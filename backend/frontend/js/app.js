/**
 * SwasthyaSetu Main Application Controller
 * Handles Conversational AI Onboarding, Floating Bubble UI,
 * AI Answer Validation & Structured Extraction, Automated Speech-to-Speech Flow,
 * Shared Language Detection (Ambient Scribe vs Turn-by-Turn),
 * Bidirectional Translation, and Clinical Record Lifecycle.
 */

// Application State
const state = {
  doctor: null,
  patients: [],
  selectedPatient: null,
  activeConsultation: null,
  activeSpeaker: 'PATIENT', // 'PATIENT' or 'DOCTOR'
  turns: [],
  draft: null,
  isProcessing: false,
};

// Conversational Intake State
const onboardingState = {
  selectedLanguage: 'hi-IN',
  currentStep: 0,
  data: {
    name: '',
    age: null,
    gender: '',
    mobile_number: '',
    preferred_language: 'hi-IN',
    chief_complaint: '',
    symptoms_duration: '',
    past_medical_history: '',
    known_allergies: '',
    current_medications: '',
  },
  isRecording: false,
};

// Client-side synthesized TTS audio cache for zero-latency replays
const intakeTtsCache = new Map();

const LANG_LABELS = {
  'en-IN': 'English',
  'hi-IN': 'Hindi',
  'mr-IN': 'Marathi',
  'gu-IN': 'Gujarati',
  'bn-IN': 'Bengali',
  'ta-IN': 'Tamil',
  'te-IN': 'Telugu',
  'kn-IN': 'Kannada',
  'ml-IN': 'Malayalam',
  'pa-IN': 'Punjabi',
  'or-IN': 'Odia',
  'en': 'English',
  'hi': 'Hindi',
  'mr': 'Marathi',
  'gu': 'Gujarati',
  'bn': 'Bengali',
  'ta': 'Tamil',
  'te': 'Telugu',
  'kn': 'Kannada',
  'ml': 'Malayalam',
  'pa': 'Punjabi',
  'or': 'Odia',
};

// Conversational Onboarding Prompts by Indian Language
const ONBOARDING_QUESTIONS = {
  'hi-IN': [
    {
      id: 'name',
      label: 'Question 1 of 5 • Full Name',
      text: 'नमस्ते! आपका शुभ नाम क्या है?',
      sub: '(Hello! What is your full name?)',
      chips: ['रमेश कुमार', 'सुनीता पाटील', 'विक्रम सिंह', 'अनिता शर्मा'],
    },
    {
      id: 'age_gender',
      label: 'Question 2 of 5 • Age & Gender',
      text: 'आपकी उम्र कितनी है और आपका लिंग (पुरुष / महिला) क्या है?',
      sub: '(What is your age and gender?)',
      chips: ['35 वर्ष, पुरुष', '28 वर्ष, महिला', '45 वर्ष, पुरुष', '52 वर्ष, महिला'],
    },
    {
      id: 'phone',
      label: 'Question 3 of 5 • Mobile Phone Number',
      text: 'कृपया अपना 10 अंकों का मोबाइल फोन नंबर बताइए।',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: [],
    },
    {
      id: 'complaint',
      label: 'Question 4 of 5 • Health Problem & Duration',
      text: 'आपको क्या तकलीफ़ या समस्या हो रही है और यह कितने दिनों से है?',
      sub: '(What health problem are you facing and for how many days?)',
      chips: ['3 दिन से तेज बुखार और सिरदर्द है', 'कल से पेट में बहुत दर्द है', '5 दिन से सूखी खांसी और सर्दी है', 'सीने में जलन और उल्टी जैसा लग रहा है'],
    },
    {
      id: 'history_allergies',
      label: 'Question 5 of 5 • Medical History & Allergies',
      text: 'क्या आपको पहले से बीपी, शुगर या दमा जैसी बीमारी है? और क्या किसी दवा से एलर्जी है?',
      sub: '(Do you have conditions like BP/Diabetes, or any drug allergies?)',
      chips: ['कोई पुरानी बीमारी या एलर्जी नहीं है', 'हाई बीपी की दवा लेता हूँ', 'टाइप 2 डायबिटीज़ (शुगर) है', 'पेनिसिलिन से एलर्जी है'],
    },
  ],
  'mr-IN': [
    {
      id: 'name',
      label: 'प्रश्न १ / ५ • पूर्ण नाव',
      text: 'नमस्कार! आपले पूर्ण नाव काय आहे?',
      sub: '(Hello! What is your full name?)',
      chips: ['रमेश कुमार', 'सुनीता पाटील', 'संजय पवार', 'अमोल जाधव'],
    },
    {
      id: 'age_gender',
      label: 'प्रश्न २ / ५ • वय आणि लिंग',
      text: 'तुमचे वय किती आहे आणि लिंग (पुरुष / स्त्री) काय आहे?',
      sub: '(What is your age and gender?)',
      chips: ['35 वर्षे, पुरुष', '28 वर्षे, स्त्री', '45 वर्षे, पुरुष', '52 वर्षे, स्त्री'],
    },
    {
      id: 'phone',
      label: 'प्रश्न ३ / ५ • मोबाईल नंबर',
      text: 'कृपया आपला १० अंकी मोबाईल नंबर सांगा.',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: [],
    },
    {
      id: 'complaint',
      label: 'प्रश्न ४ / ५ • त्रास आणि कालावधी',
      text: 'तुम्हाला काय त्रास किंवा आजार होत आहे आणि किती दिवसांपासून आहे?',
      sub: '(What health problem are you facing and for how many days?)',
      chips: ['३ दिवसांपासून तीव्र ताप आणि डोकेदुखी आहे', 'कालपासून पोटात खूप दुखत आहे', '५ दिवसांपासून खोकला आणि सर्दी आहे', 'छातीत जळजळ आणि चक्कर येत आहे'],
    },
    {
      id: 'history_allergies',
      label: 'प्रश्न ५ / ५ • वैद्यकीय इतिहास आणि अलर्जी',
      text: 'तुम्हाला आधीपासून बीपी, मधुमेह (शुगर) किंवा दमा आहे का? आणि कोणत्या औषधाची अलर्जी आहे का?',
      sub: '(Do you have BP/Diabetes history, or any known drug allergies?)',
      chips: ['कोणताही जुना आजार किंवा अलर्जी नाही', 'उच्च रक्तदाब (High BP) आहे', 'मधुमेह (Diabetes) आहे', 'पेन्सिलिनची अलर्जी आहे'],
    },
  ],
  'en-IN': [
    {
      id: 'name',
      label: 'Question 1 of 5 • Full Name',
      text: 'Hello! What is your full name?',
      sub: '(Please speak or type your full name)',
      chips: ['Ramesh Kumar', 'Sunita Patil', 'Vikram Singh', 'Rahul Verma'],
    },
    {
      id: 'age_gender',
      label: 'Question 2 of 5 • Age & Gender',
      text: 'What is your age and gender (Male / Female)?',
      sub: '(e.g., 35, Male or 28, Female)',
      chips: ['35, Male', '28, Female', '45, Male', '52, Female'],
    },
    {
      id: 'phone',
      label: 'Question 3 of 5 • Mobile Phone Number',
      text: 'Please provide your 10-digit mobile phone number.',
      sub: '(Used for clinic registration and consultation records)',
      chips: [],
    },
    {
      id: 'complaint',
      label: 'Question 4 of 5 • Chief Complaint & Duration',
      text: 'What symptoms or health problem are you experiencing, and for how long?',
      sub: '(Describe your primary complaint and duration)',
      chips: ['Fever and headache for 3 days', 'Severe stomach ache since yesterday', 'Dry cough and cold for 5 days', 'Chest heaviness and mild dizziness'],
    },
    {
      id: 'history_allergies',
      label: 'Question 5 of 5 • Medical History & Allergies',
      text: 'Do you have chronic conditions (BP, Diabetes, Asthma) or any known drug allergies?',
      sub: '(State past medical history and regular medications)',
      chips: ['No chronic conditions or allergies', 'Hypertension (High BP)', 'Type 2 Diabetes', 'Allergic to Penicillin'],
    },
  ],
  'gu-IN': [
    {
      id: 'name',
      label: 'પ્રશ્ન ૧ / ૫ • પૂરું નામ',
      text: 'નમસ્તે! તમારું પૂરું નામ શું છે?',
      sub: '(Hello! What is your full name?)',
      chips: ['રમેશ પટેલ', 'ગીતા શાહ', 'અજય દેસાઈ', 'સુરેશ મહેતા'],
    },
    {
      id: 'age_gender',
      label: 'પ્રશ્ન ૨ / ૫ • ઉંમર અને લિંગ',
      text: 'તમારી ઉંમર કેટલી છે અને તમારું લિંગ (પુરુષ / સ્ત્રી) શું છે?',
      sub: '(What is your age and gender?)',
      chips: ['35 વર્ષ, પુરુષ', '28 વર્ષ, સ્ત્રી', '45 વર્ષ, પુરુષ'],
    },
    {
      id: 'phone',
      label: 'પ્રશ્ન ૩ / ૫ • મોબાઇલ નંબર',
      text: 'કૃપા કરીને તમારો ૧૦ અંકનો મોબાઈલ નંબર જણાવો.',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: [],
    },
    {
      id: 'complaint',
      label: 'પ્રશ્ન ૪ / ૫ • તકલીફ અને સમયગાળો',
      text: 'તમને શું તકલીફ થઈ રહી છે અને કેટલા દિવસથી છે?',
      sub: '(What health problem are you facing and for how many days?)',
      chips: ['૩ દિવસથી તાવ અને માથાનો દુખાવો છે', 'ગઈકાલથી પેટમાં ખૂબ દુખાવો છે', 'ખાંસી અને શરદી છે'],
    },
    {
      id: 'history_allergies',
      label: 'પ્રશ્ન ૫ / ૫ • ઇતિહાસ અને એલર્જી',
      text: 'શું તમને બીપી, ડાયાબિટીસ છે અથવા કોઈ દવાની એલર્જી છે?',
      sub: '(Do you have BP/Diabetes history, or any known drug allergies?)',
      chips: ['કોઈ જૂની બીમારી કે એલર્જી નથી', 'હાઈ બીપી છે', 'ડાયાબિટીસ છે'],
    },
  ],
  'bn-IN': [
    {
      id: 'name',
      label: 'প্রশ্ন ১ / ৫ • পুরো নাম',
      text: 'নমস্কার! আপনার পুরো নাম কি?',
      sub: '(Hello! What is your full name?)',
      chips: ['রমেশ কুমার', 'সুচিত্রা সেন', 'সৌমেন বোস'],
    },
    {
      id: 'age_gender',
      label: 'প্রশ্ন ২ / ৫ • বয়স ও লিঙ্গ',
      text: 'আপনার বয়স কত এবং লিঙ্গ (পুরুষ / মহিলা) কি?',
      sub: '(What is your age and gender?)',
      chips: ['৩৫ বছর, পুরুষ', '২৮ বছর, মহিলা', '৪৫ বছর, পুরুষ'],
    },
    {
      id: 'phone',
      label: 'প্রশ্ন ৩ / ৫ • মোবাইল নম্বর',
      text: 'দয়া করে আপনার ১০ সংখ্যার মোবাইল ফোন নম্বরটি বলুন।',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: [],
    },
    {
      id: 'complaint',
      label: 'প্রশ্ন ৪ / ৫ • অসুস্থতা ও সময়কাল',
      text: 'আপনার কি সমস্যা হচ্ছে এবং কতদিন ধরে হচ্ছে?',
      sub: '(What health problem are you facing and for how many days?)',
      chips: ['৩ দিন ধরে জ্বর ও মাথাব্যথা', 'গতকাল থেকে পেটে তীব্র ব্যথা', 'কাশি ও ঠান্ডা লেগেছে'],
    },
    {
      id: 'history_allergies',
      label: 'প্রশ্ন ৫ / ৫ • অতীত ইতিহাস ও অ্যালার্জি',
      text: 'আপনার কি কোনো পুরানো রোগ (যেমন প্রেশার, সুগার) বা ওষুধের অ্যালার্জি আছে?',
      sub: '(Do you have BP/Diabetes history, or any known drug allergies?)',
      chips: ['কোনো পুরনো রোগ বা অ্যালার্জি নেই', 'হাই ব্লাড প্রেশার আছে', 'ডায়াবেটিস আছে'],
    },
  ],
  'ta-IN': [
    {
      id: 'name',
      label: 'கேள்வி 1 / 5 • முழு பெயர்',
      text: 'வணக்கம்! உங்கள் முழு பெயர் என்ன?',
      sub: '(Hello! What is your full name?)',
      chips: ['ரமேஷ் குமார்', 'சுந்தர் ராஜா', 'பிரியா நந்தினி'],
    },
    {
      id: 'age_gender',
      label: 'கேள்வி 2 / 5 • வயது & பாலினம்',
      text: 'உங்கள் வயது மற்றும் பாலினம் (ஆண் / பெண்) என்ன?',
      sub: '(What is your age and gender?)',
      chips: ['35 வயது, ஆண்', '28 வயது, பெண்', '45 வயது, ஆண்'],
    },
    {
      id: 'phone',
      label: 'கேள்வி 3 / 5 • தொலைபேசி எண்',
      text: 'தயவுசெய்து உங்கள் 10 இலக்க மொபைல் எண்ணைக் கூறவும்.',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: [],
    },
    {
      id: 'complaint',
      label: 'கேள்வி 4 / 5 • உடல்நலக் கோฬาறு',
      text: 'உங்களுக்கு என்ன பிரச்சனை உள்ளது மற்றும் எத்தனை நாட்களாக உள்ளது?',
      sub: '(What health problem are you facing and for how many days?)',
      chips: ['3 நாட்களாக காய்ச்சல் மற்றும் தலைவலி', 'நேற்று முதல் கடுமையான வயிற்று வலி'],
    },
    {
      id: 'history_allergies',
      label: 'கேள்வி 5 / 5 • முந்தைய வரலாறு & ஒவ்வாமை',
      text: 'உங்களுக்கு ஏதேனும் நாள்பட்ட நோய் (BP, சர்க்கரை) அல்லது மருந்து ஒவ்வாமை உள்ளதா?',
      sub: '(Do you have BP/Diabetes history, or any known drug allergies?)',
      chips: ['எந்த நோயும் ஒவ்வாமையும் இல்லை', 'இரத்த அழுத்தம் (BP) உள்ளது'],
    },
  ],
  'te-IN': [
    {
      id: 'name',
      label: 'ప్రశ్న 1 / 5 • పూర్తి పేరు',
      text: 'నమస్కారం! మీ పూర్తి పేరు ఏమిటి?',
      sub: '(Hello! What is your full name?)',
      chips: ['రమేష్ కుమార్', 'వెంకటేశ్వర్లు', 'సరిత రెడ్డి'],
    },
    {
      id: 'age_gender',
      label: 'ప్రశ్న 2 / 5 • వయస్సు & లింగం',
      text: 'మీ వయస్సు ఎంత మరియు మీ లింగం (పురుషుడు / స్త్రీ) ఏమిటి?',
      sub: '(What is your age and gender?)',
      chips: ['35 సంవత్సరాలు, పురుషుడు', '28 సంవత్సరాలు, స్త్రీ'],
    },
    {
      id: 'phone',
      label: 'ప్రశ్న 3 / 5 • మొబైల్ నంబర్',
      text: 'దయచేసి మీ 10 అంకెల మొబైల్ ఫోన్ నంబర్‌ను తెలపండి.',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: [],
    },
    {
      id: 'complaint',
      label: 'ప్రశ్న 4 / 5 • సమస్య & వ్యవధి',
      text: 'మీకు ఏమి సమస్యగా ఉంది మరియు ఎన్ని రోజుల నుండి ఉంది?',
      sub: '(What health problem are you facing and for how many days?)',
      chips: ['3 రోజుల నుండి తీవ్ర జ్వరం, తలనొప్పి', 'నిన్నటి నుండి కడుపునొప్పి'],
    },
    {
      id: 'history_allergies',
      label: 'ప్రశ్న 5 / 5 • మునుపటి చరిత్ర & అలెర్జీలు',
      text: 'మీకు BP, మధుమేహం వంటి దీర్ఘకాలిక వ్యాధులు లేదా అలెర్జీలు ఉన్నాయా?',
      sub: '(Do you have BP/Diabetes history, or any known drug allergies?)',
      chips: ['ఏ వ్యాధులు లేదా అలెర్జీలు లేవు', 'హై బీపీ ఉంది'],
    },
  ],
  'kn-IN': [
    {
      id: 'name',
      label: 'ಪ್ರಶ್ನೆ 1 / 5 • ಪೂರ್ಣ ಹೆಸರು',
      text: 'ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ಏನು?',
      sub: '(Hello! What is your full name?)',
      chips: ['ಸುರೇಶ್ ಗೌಡ', 'ಮಂಜುನಾಥ್', 'ಲಕ್ಷ್ಮಿ ದೇವಿ'],
    },
    {
      id: 'age_gender',
      label: 'ಪ್ರಶ್ನೆ 2 / 5 • ವಯಸ್ಸು & ಲಿಂಗ',
      text: 'ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು ಮತ್ತು ಲಿಂಗ (ಪುರುಷ / ಮಹಿಳೆ) ಯಾವುದು?',
      sub: '(What is your age and gender?)',
      chips: ['35 ವರ್ಷ, ಪುರುಷ', '28 ವರ್ಷ, ಮಹಿಳೆ'],
    },
    {
      id: 'phone',
      label: 'ಪ್ರಶ್ನೆ 3 / 5 • ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
      text: 'ದಯವಿಟ್ಟು ನಿಮ್ಮ 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ.',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: [],
    },
    {
      id: 'complaint',
      label: 'ಪ್ರಶ್ನೆ 4 / 5 • ಆರೋಗ್ಯ ಸಮಸ್ಯೆ & ದಿನಗಳು',
      text: 'ನಿಮಗೆ ಏನು ತೊಂದರೆ ಅಥವಾ ಕಾಯಿಲೆ ಇದೆ ಮತ್ತು ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ?',
      sub: '(What health problem are you facing and for how many days?)',
      chips: ['3 ದಿನಗಳಿಂದ ಜ್ವರ ಮತ್ತು ತಲೆನೋವು ಇದೆ', 'ಹೊಟ್ಟೆ ನೋವು ಇದೆ'],
    },
    {
      id: 'history_allergies',
      label: 'ಪ್ರಶ್ನೆ 5 / 5 • ಹಳೆಯ ಕಾಯಿಲೆ & ಅಲರ್ಜಿ',
      text: 'ನಿಮಗೆ ಬಿಪಿ, ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಅಥವಾ ಯಾವುದಾದರೂ ಔಷಧಿಯ ಅಲರ್ಜಿ ಇದೆಯೇ?',
      sub: '(Do you have BP/Diabetes history, or any known drug allergies?)',
      chips: ['ಯಾವುದೇ ಹಳೆಯ ಕಾಯಿಲೆ ಇಲ್ಲ', 'ಬಿಪಿ ಇದೆ'],
    },
  ],
  'ml-IN': [
    {
      id: 'name',
      label: 'ചോദ്യം 1 / 5 • പൂർണ്ണ പേര്',
      text: 'നമസ്കാരം! നിങ്ങളുടെ മുഴുവൻ പേര് എന്താണ്?',
      sub: '(Hello! What is your full name?)',
      chips: ['രാഹുൽ മേനോൻ', 'അഞ്ജലി നായർ', 'മോഹൻദാസ്'],
    },
    {
      id: 'age_gender',
      label: 'ചോദ്യം 2 / 5 • പ്രായവും ലിംഗവും',
      text: 'നിങ്ങളുടെ പ്രായം എത്രയാണ്, ലിംഗം (പുരുഷൻ / സ്ത്രീ) ഏതാണ്?',
      sub: '(What is your age and gender?)',
      chips: ['35 വയസ്സ്, പുരുഷൻ', '28 വയസ്സ്, സ്ത്രീ'],
    },
    {
      id: 'phone',
      label: 'ചോദ്യം 3 / 5 • മൊബൈൽ നമ്പർ',
      text: 'ദയവായി നിങ്ങളുടെ 10 അക്ക മൊബൈൽ നമ്പർ പറയുക.',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: [],
    },
    {
      id: 'complaint',
      label: 'ചോദ്യം 4 / 5 • രോഗലക്ഷണങ്ങൾ & കാലയളവ്',
      text: 'നിങ്ങൾക്ക് എന്താണ് ശാരീരിക അസ്വസ്ഥത, എത്ര ദിവസമായി?',
      sub: '(What health problem are you facing and for how many days?)',
      chips: ['3 ദിവസമായി കടുത്ത പനിയും തലവേദനയും', 'വയറുവേദനയുണ്ട്'],
    },
    {
      id: 'history_allergies',
      label: 'ചോദ്യം 5 / 5 • മുൻകാല രോഗങ്ങൾ & അലർജി',
      text: 'നിങ്ങൾക്ക് ബിപി, പ്രമേഹം തുടങ്ങിയ അസുഖങ്ങളോ മരുന്നുകളോട് അലർജിയോ ഉണ്ടോ?',
      sub: '(Do you have BP/Diabetes history, or any known drug allergies?)',
      chips: ['അസുഖങ്ങളോ അലർജിയോ ഇല്ല', 'പ്രമേഹമുണ്ട്'],
    },
  ],
  'pa-IN': [
    {
      id: 'name',
      label: 'ਸਵਾਲ 1 / 5 • ਪੂਰਾ ਨਾਮ',
      text: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਹਾਡਾ ਪੂਰਾ ਨਾਮ ਕੀ ਹੈ?',
      sub: '(Hello! What is your full name?)',
      chips: ['ਗੁਰਪ੍ਰੀਤ ਸਿੰਘ', 'ਹਰਪ੍ਰੀਤ ਕੌਰ', 'ਜਸਵਿੰਦਰ ਸਿੰਘ'],
    },
    {
      id: 'age_gender',
      label: 'ਸਵਾਲ 2 / 5 • ਉਮਰ ਅਤੇ ਲਿੰਗ',
      text: 'ਤੁਹਾਡੀ ਉਮਰ ਕਿੰਨੀ ਹੈ ਅਤੇ ਤੁਹਾਡਾ ਲਿੰਗ (ਪੁਰਸ਼ / ਮਹਿਲਾ) ਕੀ ਹੈ?',
      sub: '(What is your age and gender?)',
      chips: ['35 ਸਾਲ, ਪੁਰਸ਼', '28 ਸਾਲ, ਮਹਿਲਾ'],
    },
    {
      id: 'phone',
      label: 'ਸਵਾਲ 3 / 5 • ਮੋਬਾਈਲ ਨੰਬਰ',
      text: 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ 10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਦੱਸੋ।',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: [],
    },
    {
      id: 'complaint',
      label: 'ਸਵਾਲ 4 / 5 • ਤਕਲੀਫ਼ ਅਤੇ ਸਮਾਂ',
      text: 'ਤੁਹਾਨੂੰ ਕੀ ਤਕਲੀਫ਼ ਜਾਂ ਬਿਮਾਰੀ ਹੈ ਅਤੇ ਇਹ ਕਿੰਨੇ ਦਿਨਾਂ ਤੋਂ ਹੈ?',
      sub: '(What health problem are you facing and for how many days?)',
      chips: ['3 ਦਿਨਾਂ ਤੋਂ ਤੇਜ਼ ਬੁਖਾਰ ਅਤੇ ਸਿਰਦਰਦ', 'ਪੇਟ ਦਰਦ ਹੈ'],
    },
    {
      id: 'history_allergies',
      label: 'ਸਵਾਲ 5 / 5 • ਪੁਰਾਣੀ ਬਿਮਾਰੀ ਅਤੇ ਐਲਰਜੀ',
      text: 'ਕੀ ਤੁਹਾਨੂੰ ਬੀਪੀ, ਸ਼ੂਗਰ ਵਰਗੀ ਕੋਈ ਬਿਮਾਰੀ ਹੈ ਜਾਂ ਕਿਸੇ ਦਵਾਈ ਤੋਂ ਐਲਰਜੀ ਹੈ?',
      sub: '(Do you have BP/Diabetes history, or any known drug allergies?)',
      chips: ['ਕੋਈ ਪੁਰਾਣੀ ਬਿਮਾਰੀ ਜਾਂ ਐਲਰਜੀ ਨਹੀਂ', 'ਬੀਪੀ ਹੈ'],
    },
  ],
  'or-IN': [
    {
      id: 'name',
      label: 'ପ୍ରଶ୍ନ ୧ / ୫ • ପୂରା ନାମ',
      text: 'ନମସ୍କାର! ଆପଣଙ୍କ ପୂରା ନାମ କ’ଣ?',
      sub: '(Hello! What is your full name?)',
      chips: ['ସୁବାଷ ମହାପାତ୍ର', 'ମମତା ଦାସ', 'ରାଜେଶ ପ୍ରଧାନ'],
    },
    {
      id: 'age_gender',
      label: 'ପ୍ରଶ୍ନ ୨ / ୫ • ବୟସ ଏବଂ ଲିଙ୍ଗ',
      text: 'ଆପଣଙ୍କ ବୟସ କେତେ ଏବଂ ଆପଣଙ୍କ ଲିଙ୍ଗ (ପୁରୁଷ / ମହିଳା) କ’ଣ?',
      sub: '(What is your age and gender?)',
      chips: ['୩୫ ବର୍ଷ, ପୁରୁଷ', '୨୮ ବର୍ଷ, ମହିଳା'],
    },
    {
      id: 'phone',
      label: 'ପ୍ରଶ୍ନ ୩ / ୫ • ମୋବାଇଲ୍ ନମ୍ବର',
      text: 'ଦୟାକରି ଆପଣଙ୍କ ୧୦ ଅଙ୍କ ବିଶିଷ୍ଟ ମୋବାଇଲ୍ ନମ୍ବର କୁହନ୍ତୁ।',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: [],
    },
    {
      id: 'complaint',
      label: 'ପ୍ରଶ୍ନ ୪ / ୫ • ରୋଗ ଏବଂ କାରଣ',
      text: 'ଆପଣଙ୍କର କ’ଣ ସମସ୍ୟା ବା ରୋଗ ଅଛି ଏବଂ କେତେ ଦିନ ଧରି?',
      sub: '(What health problem are you facing and for how many days?)',
      chips: ['୩ ଦିନ ଧରି ପ୍ରବଳ ଜ୍ୱର ଓ ମୁଣ୍ଡବିନ୍ଧା', 'ପେଟ ଯନ୍ତ୍ରଣା ହେଉଛି'],
    },
    {
      id: 'history_allergies',
      label: 'ପ୍ରଶ୍ନ ୫ / ୫ • ପୁରୁଣା ରୋଗ ଓ ଆଲର୍ଜି',
      text: 'ଆପଣଙ୍କର ବିପି, ଡାଇବେଟିସ୍ ଅଛି କି କିମ୍ବା କୌଣସି ଔଷଧରୁ ଆଲର୍ଜି ଅଛି କି?',
      sub: '(Do you have BP/Diabetes history, or any known drug allergies?)',
      chips: ['କୌଣସି ପୁରୁଣା ରୋଗ ନାହିଁ', 'ବିପି ଅଛି'],
    },
  ],
};

function getQuestionsForLanguage(lang) {
  if (ONBOARDING_QUESTIONS[lang]) {
    return ONBOARDING_QUESTIONS[lang];
  }
  return ONBOARDING_QUESTIONS['hi-IN'] || ONBOARDING_QUESTIONS['en-IN'];
}

// DOM Elements
const views = {
  dashboard: document.getElementById('view-dashboard'),
  onboard: document.getElementById('view-onboard-patient'),
  patientDetail: document.getElementById('view-patient-detail'),
  consultation: document.getElementById('view-consultation'),
  draftReview: document.getElementById('view-draft-review'),
  approval: document.getElementById('view-approval-success'),
};

// Safe event listener helper
function on(id, event, handler) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener(event, handler);
  } else {
    console.warn(`[SwasthyaSetu] Element #${id} not found for ${event} event.`);
  }
}

// Promise-based Sequential API Queue to serialize requests and prevent collisions
class ApiQueue {
  constructor() {
    this.queue = Promise.resolve();
  }

  enqueue(asyncFn) {
    const next = this.queue.then(async () => {
      return await asyncFn();
    }).catch(err => {
      console.warn('[SwasthyaSetu Queue] Request error:', err);
      throw err;
    });
    this.queue = next.catch(() => {});
    return next;
  }
}

const consultationApiQueue = new ApiQueue();
const intakeApiQueue = new ApiQueue();

// Navigation Helper
function showView(viewName) {
  const allViewIds = [
    'view-dashboard',
    'view-onboard-patient',
    'view-patient-detail',
    'view-consultation',
    'view-draft-review',
    'view-approval-success'
  ];

  const targetId = {
    dashboard: 'view-dashboard',
    onboard: 'view-onboard-patient',
    onboardPatient: 'view-onboard-patient',
    patientDetail: 'view-patient-detail',
    consultation: 'view-consultation',
    draftReview: 'view-draft-review',
    approval: 'view-approval-success'
  }[viewName] || viewName;

  allViewIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('active');
  });

  const targetEl = document.getElementById(targetId);
  if (targetEl) {
    targetEl.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update Header Navigation Active State
  const navDash = document.getElementById('nav-btn-dashboard');
  const navOnboard = document.getElementById('nav-btn-onboard');
  const navConsult = document.getElementById('nav-btn-consultation');

  if (navDash) navDash.classList.toggle('active', viewName === 'dashboard' || viewName === 'patientDetail');
  if (navOnboard) navOnboard.classList.toggle('active', viewName === 'onboard' || viewName === 'onboardPatient');
  if (navConsult) navConsult.classList.toggle('active', viewName === 'consultation' || viewName === 'draftReview' || viewName === 'approval');

  // Show/Hide active consultation pill
  if (navConsult) {
    if (state.activeConsultation) {
      navConsult.style.display = 'inline-flex';
    } else {
      navConsult.style.display = 'none';
    }
  }

  // Apply localized UI
  if (viewName === 'onboard' || viewName === 'onboardPatient') {
    if (window.applyPatientOnboardingLanguage) {
      window.applyPatientOnboardingLanguage(onboardingState.selectedLanguage || 'hi-IN');
    }
  } else {
    if (window.applyDoctorLanguage) {
      window.applyDoctorLanguage(state.doctor?.preferred_language || 'en-IN');
    }
  }
}

// Modal Helpers
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('active');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('active');
}

document.querySelectorAll('.btn-close-modal').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const modal = e.target.closest('.modal-overlay');
    if (modal) modal.classList.remove('active');
  });
});

// App Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Sync localized UI from SQLite database cache on startup
  if (window.syncUILocalizationsFromDB) {
    try {
      await window.syncUILocalizationsFromDB();
    } catch (e) {
      console.warn('UI localizations DB sync fallback:', e);
    }
  }

  setupBubbleLanguageSelector();
  setupEventListeners();
  setupAudioCallbacks();

  await checkConnection();
  await loadDoctorSettings();
  await loadPatients();
});

// Connection Check
async function checkConnection() {
  const banner = document.getElementById('connection-banner');
  const statusText = document.getElementById('connection-status-text');

  try {
    await window.api.checkHealth();
    if (banner) banner.classList.remove('disconnected');
    if (statusText) statusText.textContent = `Connected • SwasthyaSetu Ready`;
  } catch (err) {
    if (banner) banner.classList.add('disconnected');
    if (statusText) statusText.textContent = `Offline Mode • Local Cache Active`;
  }
}

// Load Doctor Settings
async function loadDoctorSettings() {
  try {
    const doc = await window.api.getDoctorSettings();
    state.doctor = doc;
    const nameEl = document.getElementById('dash-doctor-name');
    const credsEl = document.getElementById('dash-doctor-creds');
    const langEl = document.getElementById('dash-doctor-lang');
    const headerDocName = document.getElementById('header-doctor-name');
    const headerLangSwitcher = document.getElementById('header-lang-switcher');

    if (nameEl) nameEl.textContent = doc.name;
    if (headerDocName) headerDocName.textContent = doc.name;
    if (credsEl) credsEl.textContent = doc.credentials;
    if (langEl) langEl.textContent = `Primary: ${LANG_LABELS[doc.preferred_language] || doc.preferred_language}`;
    if (headerLangSwitcher) headerLangSwitcher.value = doc.preferred_language || 'en-IN';

    // Apply doctor's cached UI language instantly
    if (window.applyDoctorLanguage) {
      window.applyDoctorLanguage(doc.preferred_language || 'en-IN');
    }

    // Spoken languages display
    const spokenCodes = (doc.spoken_languages || 'en-IN,mr-IN,hi-IN').split(',').map(s => s.trim()).filter(Boolean);
    const spokenNames = spokenCodes.map(code => LANG_LABELS[code] ? LANG_LABELS[code].split(' ')[0] : code).join(', ');
    const spokenEl = document.getElementById('dash-doctor-spoken');
    if (spokenEl) {
      const span = spokenEl.querySelector('span');
      if (span) span.textContent = `Speaks: ${spokenNames || 'English, Marathi, Hindi'}`;
    }

    // Fill settings modal inputs
    const setDocName = document.getElementById('setting-doc-name');
    const setDocCreds = document.getElementById('setting-doc-creds');
    const setDocLang = document.getElementById('setting-doc-lang');
    const setApiUrl = document.getElementById('setting-api-url');

    if (setDocName) setDocName.value = doc.name;
    if (setDocCreds) setDocCreds.value = doc.credentials;
    if (setDocLang) setDocLang.value = doc.preferred_language;
    if (setApiUrl) setApiUrl.value = window.api.getBaseUrl();

    // Check checkboxes in settings modal
    const spokenSet = new Set(spokenCodes);
    document.querySelectorAll('#spoken-languages-chips input[type="checkbox"]').forEach(cb => {
      cb.checked = spokenSet.has(cb.value);
      if (cb.parentElement) cb.parentElement.classList.toggle('selected', cb.checked);
    });
  } catch (err) {
    console.warn('Failed to load doctor settings:', err);
  }
}

// Load Patients List
async function loadPatients(query = '') {
  try {
    const list = await window.api.getPatients(query);
    state.patients = list;
    renderPatientsList(list);
  } catch (err) {
    console.error('Failed to load patients:', err);
  }
}

function renderPatientsList(patients) {
  const container = document.getElementById('patient-list-container');
  const countBadge = document.getElementById('patient-count-badge');
  if (countBadge) countBadge.textContent = `${patients.length} registered`;

  if (!container) return;

  if (patients.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-users-slash" style="font-size: 38px; margin-bottom: 10px; color: #cbd5e1;"></i>
        <p style="font-weight: 600;">No patients registered yet</p>
        <p style="font-size: 12px; margin-top: 4px;">Click "+ Onboard Patient" above to start interactive AI intake.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = patients.map(p => {
    const lang = p.preferred_language || 'hi-IN';
    const langClass = lang.includes('hi') ? 'badge-hi' : (lang.includes('mr') ? 'badge-mr' : 'badge-en');
    const langName = LANG_LABELS[lang] || lang;
    const complaintSnippet = p.chief_complaint ? `<p style="font-size: 11px; color: #b45309; margin-top: 2px;"><i class="fa-solid fa-stethoscope"></i> ${p.chief_complaint.slice(0, 48)}...</p>` : '';

    return `
      <div class="patient-card" onclick="viewPatientDetail('${p.id}')">
        <div class="patient-meta">
          <div class="patient-avatar">
            <i class="fa-solid fa-user"></i>
          </div>
          <div class="patient-details">
            <h4>${p.name}</h4>
            <p>${p.age ? p.age + ' yrs • ' : ''}${p.gender ? p.gender + ' • ' : ''}${p.mobile_number}</p>
            ${complaintSnippet}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="badge-chip ${langClass}">${langName.split(' ')[0]}</span>
          <i class="fa-solid fa-chevron-right" style="color: #94a3b8; font-size: 13px;"></i>
        </div>
      </div>
    `;
  }).join('');
}

// Patient Detail View
window.viewPatientDetail = async function(patientId) {
  try {
    const patient = await window.api.getPatient(patientId);
    state.selectedPatient = patient;

    const detName = document.getElementById('detail-patient-name');
    const cardName = document.getElementById('card-patient-name');
    const cardMeta = document.getElementById('card-patient-meta');
    const langBadge = document.getElementById('card-patient-lang');

    if (detName) detName.textContent = patient.name;
    if (cardName) cardName.textContent = patient.name;
    if (cardMeta) cardMeta.textContent = `${patient.age ? patient.age + ' years • ' : ''}${patient.gender ? patient.gender + ' • ' : ''}${patient.mobile_number}`;
    
    if (langBadge) {
      langBadge.textContent = LANG_LABELS[patient.preferred_language] || patient.preferred_language;
      langBadge.className = `badge-chip ${patient.preferred_language.includes('hi') ? 'badge-hi' : (patient.preferred_language.includes('mr') ? 'badge-mr' : 'badge-en')}`;
    }

    // Show pre-consultation summary if present
    const intakeBox = document.getElementById('card-patient-intake-box');
    const intakeText = document.getElementById('card-patient-intake-text');
    if (intakeBox && intakeText) {
      if (patient.intake_summary_english) {
        intakeBox.style.display = 'block';
        intakeText.textContent = patient.intake_summary_english;
      } else {
        intakeBox.style.display = 'none';
      }
    }

    showView('patientDetail');
    loadConsultationHistory(patient.id);
  } catch (err) {
    alert('Failed to load patient: ' + err.message);
  }
};

async function loadConsultationHistory(patientId) {
  const container = document.getElementById('consultation-history-list');
  const countBadge = document.getElementById('consultation-count-badge');

  try {
    const reports = await window.api.getPatientReports(patientId);
    state.patientReports = reports || [];

    if (countBadge) countBadge.textContent = `${reports.length} saved reports`;
    if (!container) return;

    if (reports.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
          <i class="fa-solid fa-folder-open" style="font-size: 24px; color: var(--border-color); display: block; margin-bottom: 8px;"></i>
          No clinical reports recorded yet for this patient.
        </div>
      `;
      return;
    }

    container.innerHTML = reports.map(r => {
      const dateStr = new Date(r.date).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const isApproved = r.status === 'APPROVED';
      const vitals = r.vitals || {};
      const vitalsPills = [];
      if (vitals.blood_pressure) vitalsPills.push(`BP: ${vitals.blood_pressure}`);
      if (vitals.weight_kg) vitalsPills.push(`Wt: ${vitals.weight_kg}kg`);
      if (vitals.pulse_bpm) vitalsPills.push(`Pulse: ${vitals.pulse_bpm}bpm`);
      if (vitals.temperature_f) vitalsPills.push(`Temp: ${vitals.temperature_f}°F`);

      const prescCount = r.prescriptions ? r.prescriptions.length : 0;

      return `
        <div class="card" style="padding: 14px; margin-bottom: 10px; border-left: 4px solid ${isApproved ? 'var(--success-green)' : 'var(--warning-amber)'}; box-shadow: var(--shadow-sm);">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <h4 style="font-size: 14px; font-weight: 800; color: var(--text-main);">${r.doctor_diagnosis || 'Clinical Consultation Record'}</h4>
                <span class="badge-chip" style="background: ${isApproved ? 'var(--success-light)' : 'var(--warning-light)'}; color: ${isApproved ? 'var(--success-green)' : 'var(--warning-amber)'}; font-size: 10px;">
                  <i class="fa-solid ${isApproved ? 'fa-circle-check' : 'fa-clock'}"></i> ${isApproved ? 'Official Approved Record' : 'Draft in Progress'}
                </span>
              </div>
              <p style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">
                <i class="fa-regular fa-calendar" style="margin-right: 4px;"></i>${dateStr} • By ${r.doctor_name || 'Dr. Priya Sharma'}
              </p>
            </div>
            <button class="btn btn-outline btn-sm" onclick="window.viewReportDetails('${r.consultation_id}')" style="white-space: nowrap; font-size: 12px; padding: 6px 12px;">
              <i class="fa-solid fa-file-waveform"></i> View Full Report
            </button>
          </div>

          ${vitalsPills.length > 0 ? `
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
              ${vitalsPills.map(v => `<span class="badge-chip" style="background: #f1f5f9; color: #334155; font-size: 11px; font-weight: 600;">${v}</span>`).join('')}
            </div>
          ` : ''}

          ${r.doctor_notes ? `
            <p style="font-size: 12px; color: #475569; margin-top: 6px; font-style: italic; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
              "${r.doctor_notes}"
            </p>
          ` : ''}

          ${prescCount > 0 ? `
            <div style="font-size: 11px; color: var(--primary-teal); font-weight: 700; margin-top: 6px;">
              <i class="fa-solid fa-pills" style="margin-right: 4px;"></i> ${prescCount} Prescribed Medicine${prescCount > 1 ? 's' : ''}
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  } catch (err) {
    if (container) container.innerHTML = `<p style="color: var(--error-red); font-size: 13px;">Failed to fetch medical reports: ${err.message}</p>`;
  }
}

window.viewReportDetails = function(consultationId) {
  const report = (state.patientReports || []).find(r => r.consultation_id === consultationId);
  if (!report) {
    alert('Report details not found.');
    return;
  }

  const modalBody = document.getElementById('report-modal-body');
  const modalTitle = document.getElementById('report-modal-title');
  const modalSub = document.getElementById('report-modal-subtitle');

  if (modalTitle) modalTitle.textContent = report.doctor_diagnosis || 'Clinical Medical Report';
  if (modalSub) {
    const dStr = new Date(report.date).toLocaleString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    modalSub.textContent = `Consultation Date: ${dStr} • Stored in Clinic SQLite Database`;
  }

  if (!modalBody) return;

  const vitals = report.vitals || {};
  const symptoms = report.symptoms || [];
  const prescriptions = report.prescriptions || [];
  const isApproved = report.status === 'APPROVED';

  modalBody.innerHTML = `
    <!-- Patient & Doctor Meta -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; background: #f8fafc; padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
      <div>
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">PATIENT DETAILS</div>
        <div style="font-size: 14px; font-weight: 800; color: var(--text-main);">${report.patient_name || state.selectedPatient?.name || 'Patient'}</div>
        <div style="font-size: 12px; color: var(--text-muted);">${state.selectedPatient?.age ? `${state.selectedPatient.age} yrs` : ''} ${state.selectedPatient?.gender || ''} • ${state.selectedPatient?.mobile_number || ''}</div>
      </div>
      <div>
        <div style="font-size: 11px; color: var(--text-muted); font-weight: 700;">ATTENDING PHYSICIAN</div>
        <div style="font-size: 14px; font-weight: 800; color: var(--primary-teal);">${report.doctor_name || 'Dr. Priya Sharma'}</div>
        <div style="font-size: 12px; color: var(--text-muted);">MBBS, MD (General Medicine)</div>
      </div>
    </div>

    <!-- Official Status Badge -->
    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: ${isApproved ? 'var(--success-light)' : 'var(--warning-light)'}; border-radius: var(--radius-sm); color: ${isApproved ? 'var(--success-green)' : 'var(--warning-amber)'}; font-size: 12px; font-weight: 700;">
      <span><i class="fa-solid ${isApproved ? 'fa-shield-halved' : 'fa-clock'}"></i> ${isApproved ? 'Verified Clinical Record (Canonical English Stored)' : 'Draft Review Record'}</span>
      <span>${isApproved ? 'Approved' : 'Pending Review'}</span>
    </div>

    <!-- Vitals -->
    <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px;">
      <h4 style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
        <i class="fa-solid fa-heart-pulse" style="color: #e11d48; margin-right: 4px;"></i> Patient Vitals
      </h4>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(90px, 1fr)); gap: 8px; text-align: center;">
        <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
          <div style="font-size: 10px; color: var(--text-muted); font-weight: 600;">WEIGHT</div>
          <div style="font-size: 13px; font-weight: 800; color: var(--text-main);">${(vitals.weight_kg ?? vitals.weight) ? `${String(vitals.weight_kg ?? vitals.weight).replace('kg', '').trim()} kg` : '-'}</div>
        </div>
        <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
          <div style="font-size: 10px; color: var(--text-muted); font-weight: 600;">HEIGHT</div>
          <div style="font-size: 13px; font-weight: 800; color: var(--text-main);">${(vitals.height_cm ?? vitals.height) ? `${String(vitals.height_cm ?? vitals.height).replace('cm', '').trim()} cm` : '-'}</div>
        </div>
        <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
          <div style="font-size: 10px; color: var(--text-muted); font-weight: 600;">BLOOD PRESSURE</div>
          <div style="font-size: 13px; font-weight: 800; color: var(--text-main);">${vitals.blood_pressure || vitals.bp || '-'}</div>
        </div>
        <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
          <div style="font-size: 10px; color: var(--text-muted); font-weight: 600;">PULSE</div>
          <div style="font-size: 13px; font-weight: 800; color: var(--text-main);">${(vitals.pulse_bpm ?? vitals.pulse) ? `${String(vitals.pulse_bpm ?? vitals.pulse).replace('bpm', '').trim()} bpm` : '-'}</div>
        </div>
        <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
          <div style="font-size: 10px; color: var(--text-muted); font-weight: 600;">TEMP</div>
          <div style="font-size: 13px; font-weight: 800; color: var(--text-main);">${(vitals.temperature_f ?? vitals.temperature ?? vitals.temp) ? `${String(vitals.temperature_f ?? vitals.temperature ?? vitals.temp).replace('°F', '').trim()} °F` : '-'}</div>
        </div>
        <div style="background: #f8fafc; padding: 8px; border-radius: 6px;">
          <div style="font-size: 10px; color: var(--text-muted); font-weight: 600;">SpO2</div>
          <div style="font-size: 13px; font-weight: 800; color: var(--text-main);">${(vitals.spo2_percent ?? vitals.spo2) ? `${String(vitals.spo2_percent ?? vitals.spo2).replace('%', '').trim()}%` : '-'}</div>
        </div>
      </div>
    </div>

    <!-- Diagnosis & Physician Notes -->
    <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px;">
      <h4 style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
        <i class="fa-solid fa-stethoscope" style="color: var(--primary-teal); margin-right: 4px;"></i> Confirmed Diagnosis & Clinical Notes
      </h4>
      <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">${report.doctor_diagnosis || 'Clinical Consultation'}</div>
      <p style="font-size: 13px; color: #475569; line-height: 1.5; white-space: pre-wrap;">${report.doctor_notes || 'No additional notes provided.'}</p>
    </div>

    <!-- Reported Symptoms -->
    ${symptoms.length > 0 ? `
      <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px;">
        <h4 style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
          <i class="fa-solid fa-notes-medical" style="color: var(--patient-color); margin-right: 4px;"></i> Patient-Reported Symptoms
        </h4>
        <ul style="padding-left: 20px; font-size: 13px; color: #334155;">
          ${symptoms.map(s => `<li><strong>${s.symptom}</strong> (Duration: ${s.duration || 'Not stated'})</li>`).join('')}
        </ul>
      </div>
    ` : ''}

    <!-- Prescriptions -->
    <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px;">
      <h4 style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 8px;">
        <i class="fa-solid fa-prescription" style="color: var(--primary-teal); margin-right: 4px;"></i> Prescribed Medications
      </h4>
      ${prescriptions.length === 0 ? `
        <div style="font-size: 12px; color: var(--text-muted); font-style: italic;">No medicines prescribed for this consultation.</div>
      ` : `
        <div style="display: flex; flex-direction: column; gap: 6px;">
          ${prescriptions.map((p, idx) => `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; padding: 8px 10px; background: #f8fafc; border-radius: 6px; font-size: 12px; word-break: break-word;">
              <div>
                <strong>${idx + 1}. ${p.medicine} ${p.strength || ''}</strong>
                <span style="color: var(--text-muted); margin-left: 6px;">${p.dose || ''} • ${p.frequency || ''} • ${p.duration || ''}</span>
              </div>
              <span style="color: var(--primary-teal); font-weight: 600;">${p.instructions || 'After meals'}</span>
            </div>
          `).join('')}
        </div>
      `}
    </div>

    <!-- Follow up advice -->
    ${report.follow_up_recommendation ? `
      <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: var(--radius-sm); padding: 10px 12px; font-size: 12px; color: #166534;">
        <strong>Follow-up Recommendation:</strong> ${report.follow_up_recommendation}
      </div>
    ` : ''}
  `;

  openModal('modal-view-report');
};

/* ==========================================================================
   CONVERSATIONAL AI ONBOARDING WITH REAL-TIME AI VALIDATION
   ========================================================================== */

function showOnboardingView() {
  // Reset intake state
  onboardingState.currentStep = 0;
  onboardingState.data = {
    name: '',
    age: null,
    gender: '',
    mobile_number: '',
    preferred_language: 'hi-IN',
    chief_complaint: '',
    symptoms_duration: '',
    past_medical_history: '',
    known_allergies: '',
    current_medications: '',
  };

  // Reset live autofill display - all fields start pending with no default mock data
  const resetField = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const dict = (window.I18N_DICTIONARY && window.I18N_DICTIONARY[onboardingState.selectedLanguage]) || {};
      el.textContent = dict.autofillPending || 'Pending response...';
      el.classList.add('placeholder');
    }
  };
  resetField('field-preview-name');
  resetField('field-preview-age-gender');
  resetField('field-preview-phone');
  resetField('field-preview-complaint');
  resetField('field-preview-history');
  resetField('field-preview-allergies');

  // Hide validation alerts
  const alertBanner = document.getElementById('intake-validation-alert');
  if (alertBanner) alertBanner.style.display = 'none';

  // Show Step A (Language Selector) and hide others
  const stepA = document.getElementById('onboard-step-language');
  const stepB = document.getElementById('onboard-step-chat');
  const stepC = document.getElementById('onboard-step-summary');

  if (stepA) stepA.style.display = 'flex';
  if (stepB) stepB.style.display = 'none';
  if (stepC) stepC.style.display = 'none';

  showView('onboard');
}

// Global window function for inline onclick and listener
window.selectOnboardingBubble = function(langCode, displayName) {
  selectOnboardingLanguage(langCode, displayName);
};

function setupBubbleLanguageSelector() {
  const bubbles = document.querySelectorAll('.lang-bubble');
  bubbles.forEach(bubble => {
    bubble.addEventListener('click', (e) => {
      const b = e.currentTarget;
      const langCode = b.getAttribute('data-lang');
      const langName = b.getAttribute('data-name');
      const langNative = b.getAttribute('data-native');
      const display = langNative ? `${langName} (${langNative})` : (langName || langCode);
      selectOnboardingLanguage(langCode, display);
    });
  });
}

function selectOnboardingLanguage(langCode, displayName) {
  console.log('[SwasthyaSetu] Language selected:', langCode, displayName);
  onboardingState.selectedLanguage = langCode;
  onboardingState.data.preferred_language = langCode;
  onboardingState.currentStep = 0;

  // Localize patient onboarding interface in patient's preferred language
  if (window.applyPatientOnboardingLanguage) {
    window.applyPatientOnboardingLanguage(langCode);
  }

  // Transition from Step A to Step B
  const stepA = document.getElementById('onboard-step-language');
  const stepB = document.getElementById('onboard-step-chat');
  const stepC = document.getElementById('onboard-step-summary');

  if (stepA) stepA.style.display = 'none';
  if (stepB) stepB.style.display = 'flex';
  if (stepC) stepC.style.display = 'none';

  const badge = document.getElementById('intake-active-lang-badge');
  if (badge) badge.textContent = `Language: ${displayName}`;

  renderIntakeQuestion();
}

async function renderIntakeQuestion() {
  const questions = getQuestionsForLanguage(onboardingState.selectedLanguage);
  const q = questions[onboardingState.currentStep];
  if (!q) {
    submitOnboardingForm();
    return;
  }

  // Clear previous validation alerts
  const alertBanner = document.getElementById('intake-validation-alert');
  if (alertBanner) alertBanner.style.display = 'none';

  // Update question cards
  const stepInd = document.getElementById('intake-step-indicator');
  const qText = document.getElementById('intake-question-text');
  const qEn = document.getElementById('intake-question-english');

  if (stepInd) stepInd.textContent = q.label;
  if (qText) qText.textContent = q.text;
  if (qEn) qEn.textContent = q.sub;

  // Clear text input
  const textInput = document.getElementById('input-intake-text');
  if (textInput) {
    textInput.value = '';
    textInput.placeholder = `Speak or type your answer (${LANG_LABELS[onboardingState.selectedLanguage] || 'Indian Language'})...`;
  }

  // Populate quick chips
  const chipsContainer = document.getElementById('intake-quick-chips');
  if (chipsContainer) {
    chipsContainer.innerHTML = (q.chips || []).map(chipText => `
      <button class="quick-chip" onclick="handleQuickChipClick('${chipText.replace(/'/g, "\\'")}')">
        <i class="fa-solid fa-comment-dots"></i> "${chipText}"
      </button>
    `).join('');
  }

  const micStatus = document.getElementById('intake-mic-status');
  if (micStatus) micStatus.innerHTML = `<i class="fa-solid fa-volume-high" style="color: var(--primary-teal);"></i> Speaking question...`;

  // 1. Speak question aloud via female TTS and WAIT for completion
  await playIntakeQuestionTTS(q.text, onboardingState.selectedLanguage);

  if (micStatus) {
    micStatus.innerHTML = `<span style="color: var(--text-muted); font-weight: 600;"><i class="fa-solid fa-microphone"></i> Tap microphone to speak your answer</span>`;
  }
}

window.handleQuickChipClick = function(text) {
  handleIntakeAnswer(text);
};

// Play question or reprompt aloud using direct TTS endpoint (Female Voice: Nalini / Kaveri / Devika)
async function playIntakeQuestionTTS(text, lang) {
  const cacheKey = `${lang}::female::${text.trim()}`;
  try {
    let audioUrl = intakeTtsCache.get(cacheKey);
    if (!audioUrl) {
      // Intake form assistant strictly speaks in female voice
      const res = await window.api.synthesizeSpeech(text, lang, null, 'female');
      if (res && res.audio_url) {
        audioUrl = window.api.resolveAudioUrl(res.audio_url);
        intakeTtsCache.set(cacheKey, audioUrl);
      }
    }
    if (audioUrl) {
      await window.audioManager.playAudioAsync(audioUrl);
    }
  } catch (err) {
    console.warn('Intake TTS playback skipped/failed:', err.message);
  }
}

// Manual Microphone Listening (User presses button to start and stop; no auto voice stop or pause)
async function startManualIntakeListening() {
  const micBtn = document.getElementById('btn-intake-mic');
  const micStatus = document.getElementById('intake-mic-status');
  const recTimer = document.getElementById('intake-rec-timer');

  if (window.audioManager.isPlaying) return;

  if (micStatus) {
    micStatus.innerHTML = `<span style="color: var(--error-color); font-weight: 800;"><i class="fa-solid fa-circle fa-beat" style="font-size: 8px;"></i> Recording... Speak answer, tap mic to stop</span>`;
  }
  if (micBtn) micBtn.classList.add('recording');
  if (recTimer) {
    recTimer.style.display = 'inline-block';
    recTimer.textContent = '00:00';
  }

  // Manual start with vad=false (continuous recording without auto-pause/cutoff)
  await window.audioManager.startRecording({ vad: false });
}

// Intake Voice Recording Toggle (Start / Stop button)
async function toggleIntakeVoiceRecording() {
  if (window.audioManager.isRecording) {
    await processManualVoiceIntake();
  } else {
    await startManualIntakeListening();
  }
}

async function processManualVoiceIntake() {
  const micBtn = document.getElementById('btn-intake-mic');
  const micStatus = document.getElementById('intake-mic-status');
  const recTimer = document.getElementById('intake-rec-timer');

  if (micStatus) micStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing answer...`;
  if (micBtn) micBtn.classList.remove('recording');
  if (recTimer) recTimer.style.display = 'none';

  const audioBlob = await window.audioManager.stopRecording();
  if (!audioBlob) {
    if (micStatus) micStatus.textContent = 'No voice detected. Tap microphone to speak.';
    return;
  }

  try {
    const result = await window.api.transcribeAudio(audioBlob, onboardingState.selectedLanguage);
    if (result && result.transcript && result.transcript.trim()) {
      const inputEl = document.getElementById('input-intake-text');
      if (inputEl) inputEl.value = result.transcript;
      await handleIntakeAnswer(result.transcript);
    } else {
      if (micStatus) micStatus.textContent = 'No voice detected. Tap microphone to try again.';
    }
  } catch (err) {
    if (micStatus) micStatus.textContent = 'Microphone error: ' + err.message;
  }
}

// Process and Validate Answer with AI (GPT-6 Luna) via Serialized Queue
async function handleIntakeAnswer(answer) {
  const clean = (answer || '').trim();
  if (!clean) return;

  return intakeApiQueue.enqueue(async () => {
    const questions = getQuestionsForLanguage(onboardingState.selectedLanguage);
    const q = questions[onboardingState.currentStep];
    if (!q) return;

    const micStatus = document.getElementById('intake-mic-status');
    const submitBtn = document.getElementById('btn-submit-intake-text');
    const alertBanner = document.getElementById('intake-validation-alert');
    const alertText = document.getElementById('intake-validation-text');

    if (micStatus) micStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
    if (submitBtn) submitBtn.disabled = true;

    try {
      // Call AI validation endpoint to check if answer matches the question asked
      const valResult = await window.api.validateIntakeAnswer(
        q.id,
        q.text,
        clean,
        onboardingState.selectedLanguage
      );

      // CASE 1: REJECTED (e.g. user said symptoms when asked for their name)
      if (!valResult.is_valid) {
        console.warn('[SwasthyaSetu] AI Validation rejected answer:', clean, valResult);
        const reprompt = valResult.reprompt_native || 'कृपया विचारलेल्या प्रश्नाचे उत्तर द्या.';

        // Show alert in UI
        if (alertBanner && alertText) {
          alertText.textContent = reprompt;
          alertBanner.style.display = 'flex';
        }

        if (micStatus) {
          micStatus.innerHTML = `<span style="color: #be123c; font-weight: 700;">⚠️ ${reprompt}</span>`;
        }

        // Speak correction aloud in native language (female voice)
        await playIntakeQuestionTTS(reprompt, onboardingState.selectedLanguage);
        if (micStatus) {
          micStatus.innerHTML = `<span style="color: var(--text-muted); font-weight: 600;"><i class="fa-solid fa-microphone"></i> Tap microphone to speak answer again</span>`;
        }
        return;
      }

      // CASE 2: VALID ANSWER!
      if (alertBanner) alertBanner.style.display = 'none';

      const extracted = (valResult.extracted_value || clean).trim();
      const parsed = valResult.parsed_fields || {};

      // Reflect the AI corrected format response in the input box
      const inputEl = document.getElementById('input-intake-text');
      if (inputEl) inputEl.value = extracted;

      if (q.id === 'name') {
        const cleanName = parsed.name || extracted;
        onboardingState.data.name = cleanName;
        updateAutofillField('item-name', 'field-preview-name', cleanName);
      } else if (q.id === 'age_gender') {
        // Must extract both age and gender in any sequence; no default fallbacks
        const ageVal = parsed.age ? parseInt(parsed.age) : (extracted.match(/\d+/) ? parseInt(extracted.match(/\d+/)[0]) : null);
        let genderVal = parsed.gender;
        if (!genderVal) {
          const lowerExt = extracted.toLowerCase();
          if (lowerExt.includes('female') || extracted.includes('महिला') || extracted.includes('स्त्री') || extracted.includes('बाई') || extracted.includes('aurat') || extracted.includes('लड़की')) {
            genderVal = 'Female';
          } else if (lowerExt.includes('male') || extracted.includes('पुरुष') || extracted.includes('माणूस') || extracted.includes('aadmi') || extracted.includes('लड़का')) {
            genderVal = 'Male';
          }
        } else {
          genderVal = (genderVal.toLowerCase().includes('fem') || genderVal.includes('महिला') || genderVal.includes('स्त्री')) ? 'Female' : 'Male';
        }

        if (!ageVal || !genderVal) {
          // Missing either age or gender -> reprompt!
          const reprompt = valResult.reprompt_native || (!ageVal 
            ? (onboardingState.selectedLanguage.includes('mr') ? 'कृपया आपले वय सांगा.' : 'कृपया अपनी उम्र बताइए।')
            : (onboardingState.selectedLanguage.includes('mr') ? 'कृपया आपले लिंग (पुरुष किंवा स्त्री) सांगा.' : 'कृपया अपना लिंग (पुरुष या महिला) बताइए।'));
          
          if (alertBanner && alertText) {
            alertText.textContent = reprompt;
            alertBanner.style.display = 'flex';
          }
          await playIntakeQuestionTTS(reprompt, onboardingState.selectedLanguage);
          if (micStatus) {
            micStatus.innerHTML = `<span style="color: var(--text-muted); font-weight: 600;"><i class="fa-solid fa-microphone"></i> Tap microphone to speak answer again</span>`;
          }
          return;
        }

        onboardingState.data.age = ageVal;
        onboardingState.data.gender = genderVal;
        updateAutofillField('item-age', 'field-preview-age-gender', `${ageVal} yrs • ${genderVal}`);
      } else if (q.id === 'phone') {
        const phoneDigits = (parsed.mobile_number || parsed.phone || extracted || '').toString().replace(/\D/g, '');
        const phoneClean = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : '';
        if (!phoneClean || phoneClean.length < 10) {
          const reprompt = valResult.reprompt_native || (onboardingState.selectedLanguage.includes('mr') ? 'कृपया वैध १० अंकी मोबाईल नंबर सांगा.' : 'कृपया 10 अंकों का वैध मोबाइल नंबर बताइए।');
          if (alertBanner && alertText) {
            alertText.textContent = reprompt;
            alertBanner.style.display = 'flex';
          }
          await playIntakeQuestionTTS(reprompt, onboardingState.selectedLanguage);
          if (micStatus) {
            micStatus.innerHTML = `<span style="color: var(--text-muted); font-weight: 600;"><i class="fa-solid fa-microphone"></i> Tap microphone to speak answer again</span>`;
          }
          return;
        }
        onboardingState.data.mobile_number = phoneClean;
        updateAutofillField('item-phone', 'field-preview-phone', phoneClean);
      } else if (q.id === 'complaint') {
        const compVal = parsed.chief_complaint || extracted;
        const durVal = parsed.symptoms_duration || '';
        onboardingState.data.chief_complaint = compVal;
        onboardingState.data.symptoms_duration = durVal;
        const displayVal = durVal && !compVal.includes(durVal) ? `${compVal} (${durVal})` : compVal;
        updateAutofillField('item-complaint', 'field-preview-complaint', displayVal);
      } else if (q.id === 'history_allergies') {
        const histVal = parsed.past_medical_history || extracted;
        const allVal = parsed.known_allergies || '';
        onboardingState.data.past_medical_history = histVal;
        onboardingState.data.known_allergies = allVal;
        updateAutofillField('item-history', 'field-preview-history', histVal || 'None');
        updateAutofillField('item-allergies', 'field-preview-allergies', allVal || 'None');
      }

      // Advance to next question
      onboardingState.currentStep++;
      if (onboardingState.currentStep < questions.length) {
        renderIntakeQuestion();
      } else {
        submitOnboardingForm();
      }
    } catch (err) {
      console.error('Validation error:', err);
      // On unexpected error, do not break flow
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function updateAutofillField(itemId, fieldId, value) {
  const itemEl = document.getElementById(itemId);
  const fieldEl = document.getElementById(fieldId);
  if (fieldEl) {
    fieldEl.textContent = value;
    fieldEl.classList.remove('placeholder');
  }
  if (itemEl) {
    itemEl.classList.add('updated');
    setTimeout(() => itemEl.classList.remove('updated'), 1400);
  }
}

// Complete intake and send to backend
async function submitOnboardingForm() {
  const finishBtn = document.getElementById('btn-finish-intake-early');
  if (finishBtn) {
    finishBtn.disabled = true;
    finishBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  }

  try {
    // Ensure we actually have patient's name before submitting
    if (!onboardingState.data.name || onboardingState.data.name.trim().length < 2) {
      alert('कृपया रुग्णाचे पूर्ण नाव भरा. (Please provide the patient name.)');
      if (finishBtn) {
        finishBtn.disabled = false;
        finishBtn.innerHTML = `<i class="fa-solid fa-check"></i> Complete & Submit Form`;
      }
      return;
    }

    const savedPatient = await window.api.submitConversationalIntake(onboardingState.data);
    state.selectedPatient = savedPatient;
    await loadPatients();

    // Render Step C (Doctor-Language Pre-Consultation Summary)
    renderPreConsultationSummary(savedPatient);

    // Transition view to Step C
    const stepB = document.getElementById('onboard-step-chat');
    const stepC = document.getElementById('onboard-step-summary');
    if (stepB) stepB.style.display = 'none';
    if (stepC) stepC.style.display = 'flex';
  } catch (err) {
    alert('Failed to submit patient intake: ' + err.message);
  } finally {
    if (finishBtn) {
      finishBtn.disabled = false;
      finishBtn.innerHTML = `<i class="fa-solid fa-check"></i> Complete & Submit Form`;
    }
  }
}

function renderPreConsultationSummary(patient) {
  const nameEl = document.getElementById('summary-patient-name');
  const metaEl = document.getElementById('summary-patient-meta');
  const langEl = document.getElementById('summary-patient-lang');
  const briefEl = document.getElementById('summary-intake-brief');
  const compEl = document.getElementById('summary-complaint');
  const durEl = document.getElementById('summary-duration');
  const histEl = document.getElementById('summary-history');
  const allEl = document.getElementById('summary-allergies');

  if (nameEl) nameEl.textContent = patient.name;
  if (metaEl) metaEl.textContent = `${patient.age ? patient.age + ' yrs • ' : ''}${patient.gender ? patient.gender + ' • ' : ''}${patient.mobile_number}`;
  
  const langName = LANG_LABELS[patient.preferred_language] || patient.preferred_language;
  if (langEl) langEl.textContent = langName;

  if (briefEl) briefEl.textContent = patient.intake_summary_english || 'Patient completed conversational voice intake. Symptoms and history converted to canonical medical English.';
  if (compEl) compEl.textContent = patient.chief_complaint || 'General medical examination';
  if (durEl) durEl.textContent = patient.symptoms_duration || 'Not specified';
  if (histEl) histEl.textContent = patient.past_medical_history || 'No prior chronic conditions recorded';
  if (allEl) allEl.textContent = patient.known_allergies || 'No known drug allergies';
}

/* ==========================================================================
   TURN-BY-TURN CONSULTATION MODE (SCRIBE MODE REMOVED)
   ========================================================================== */

// Start Consultation Entry Point - Strictly Turn-by-Turn
function initiateConsultationStart() {
  if (!state.selectedPatient) return;
  startConsultationWithMode('NORMAL');
}

// Start Consultation with Chosen Mode
async function startConsultationWithMode(mode = 'NORMAL') {
  if (!state.selectedPatient) return;

  const btnStart = document.getElementById('btn-start-consultation');
  const btnSummaryStart = document.getElementById('btn-start-from-summary');
  if (btnStart) btnStart.disabled = true;
  if (btnSummaryStart) btnSummaryStart.disabled = true;

  try {
    const doctorLang = state.doctor ? state.doctor.preferred_language : 'en-IN';
    const patientLang = state.selectedPatient.preferred_language || 'hi-IN';

    const consultation = await window.api.createConsultation(
      state.selectedPatient.id,
      doctorLang,
      patientLang,
      'NORMAL'
    );

    state.activeConsultation = consultation;
    state.turns = [];
    state.activeSpeaker = 'PATIENT';

    const pTitle = document.getElementById('cons-patient-title');
    const bPat = document.getElementById('cons-badge-patient');
    const bDoc = document.getElementById('cons-badge-doctor');

    if (pTitle) pTitle.textContent = state.selectedPatient.name;
    if (bPat) bPat.textContent = `Patient: ${LANG_LABELS[patientLang] || patientLang}`;
    if (bDoc) bDoc.textContent = `Doctor: ${LANG_LABELS[doctorLang] || doctorLang}`;

    // Initialize doctor speaking language dropdown
    const docSpeakSelect = document.getElementById('doctor-speak-lang');
    if (docSpeakSelect) docSpeakSelect.value = doctorLang;

    switchSpeaker('PATIENT');
    switchConsultationMode('CONVERSATION');
    renderTimeline([]);
    showView('consultation');
  } catch (err) {
    alert('Failed to start consultation: ' + err.message);
  } finally {
    if (btnStart) btnStart.disabled = false;
    if (btnSummaryStart) btnSummaryStart.disabled = false;
  }
}

// Speaker Selector (Patient vs Doctor)
function switchSpeaker(speaker) {
  state.activeSpeaker = speaker;
  const isPatient = speaker === 'PATIENT';

  const btnPatient = document.getElementById('btn-speaker-patient');
  const btnDoctor = document.getElementById('btn-speaker-doctor');
  const turnBanner = document.getElementById('turn-direction-banner');
  const turnText = document.getElementById('turn-direction-text');
  const docSpeakBar = document.getElementById('doctor-speak-lang-bar');

  const pLang = state.activeConsultation ? state.activeConsultation.patient_language : 'hi-IN';
  const dLang = state.doctor ? state.doctor.preferred_language : 'en-IN';

  if (isPatient) {
    if (btnPatient) btnPatient.classList.add('active');
    if (btnDoctor) btnDoctor.classList.remove('active');
    if (turnBanner) turnBanner.className = 'turn-direction-banner patient-turn';
    if (docSpeakBar) docSpeakBar.style.display = 'none';
    if (turnText) {
      turnText.textContent = `Patient Speaks (${LANG_LABELS[pLang] || pLang}) ➔ Doctor Listens (${LANG_LABELS[dLang] || dLang})`;
    }
  } else {
    if (btnPatient) btnPatient.classList.remove('active');
    if (btnDoctor) btnDoctor.classList.add('active');
    if (turnBanner) turnBanner.className = 'turn-direction-banner doctor-turn';
    if (docSpeakBar) docSpeakBar.style.display = 'flex';
    if (turnText) {
      const docCurrentSpeak = document.getElementById('doctor-speak-lang')?.value || dLang;
      turnText.textContent = `Doctor Speaks (${LANG_LABELS[docCurrentSpeak] || docCurrentSpeak}) ➔ Patient Listens (${LANG_LABELS[pLang] || pLang})`;
    }
  }
}

// Audio Recording & Turn Processing (Consultation)
async function toggleRecording() {
  if (state.isProcessing) return;

  if (window.audioManager.isRecording) {
    const audioBlob = await window.audioManager.stopRecording();
    if (audioBlob) {
      await processAudioTurn(audioBlob);
    }
  } else {
    await window.audioManager.startRecording();
  }
}

async function processAudioTurn(audioBlob) {
  if (!state.activeConsultation) return;

  return consultationApiQueue.enqueue(async () => {
    const isPatient = state.activeSpeaker === 'PATIENT';
    const docSpeakLang = document.getElementById('doctor-speak-lang')?.value || state.doctor?.preferred_language || 'en-IN';
    const sourceLang = isPatient ? state.activeConsultation.patient_language : docSpeakLang;
    const targetLang = isPatient ? (state.doctor?.preferred_language || 'en-IN') : state.activeConsultation.patient_language;

    setProcessing(true);

    try {
      const result = await window.api.processAudioTurn(
        state.activeConsultation.id,
        state.activeSpeaker,
        sourceLang,
        targetLang,
        audioBlob
      );

      appendTurn(result);

      // Auto-play synthesized audio for recipient
      if (result.audio_url) {
        const fullUrl = window.api.resolveAudioUrl(result.audio_url);
        window.audioManager.playAudio(fullUrl);
      }

      promptTurnHandoff();
    } catch (err) {
      alert('Turn processing failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  });
}

async function processTextTurn(text) {
  if (!state.activeConsultation || !text.trim()) return;

  return consultationApiQueue.enqueue(async () => {
    const isPatient = state.activeSpeaker === 'PATIENT';
    const docSpeakLang = document.getElementById('doctor-speak-lang')?.value || state.doctor?.preferred_language || 'en-IN';
    const sourceLang = isPatient ? state.activeConsultation.patient_language : docSpeakLang;
    const targetLang = isPatient ? (state.doctor?.preferred_language || 'en-IN') : state.activeConsultation.patient_language;

    setProcessing(true);

    try {
      const result = await window.api.processTextTurn(
        state.activeConsultation.id,
        state.activeSpeaker,
        sourceLang,
        targetLang,
        text.trim()
      );

      appendTurn(result);

      if (result.audio_url) {
        const fullUrl = window.api.resolveAudioUrl(result.audio_url);
        window.audioManager.playAudio(fullUrl);
      }

      promptTurnHandoff();
    } catch (err) {
      alert('Turn processing error: ' + err.message);
    } finally {
      setProcessing(false);
    }
  });
}

function promptTurnHandoff() {
  if (state.activeSpeaker === 'PATIENT') {
    switchSpeaker('DOCTOR');
  } else {
    switchSpeaker('PATIENT');
  }
}

function setProcessing(isProcessing) {
  state.isProcessing = isProcessing;
  const banner = document.getElementById('turn-processing-banner');
  const recordBtn = document.getElementById('btn-record-turn');

  if (banner) banner.style.display = isProcessing ? 'flex' : 'none';
  if (recordBtn) recordBtn.disabled = isProcessing;
}

function appendTurn(turn) {
  state.turns.push(turn);
  renderTimeline(state.turns);
}

function renderTimeline(turns) {
  const container = document.getElementById('transcript-timeline');
  if (!container) return;

  if (turns.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-microphone-slash" style="font-size: 42px; margin-bottom: 12px; color: #cbd5e1;"></i>
        <h4 style="font-size: 15px; font-weight: 700; color: #475569;">Turn-by-Turn Consultation Active</h4>
        <p style="font-size: 12px; margin-top: 4px;">Select the active speaker above, then tap the microphone to speak.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = turns.map((t) => {
    const isPatient = t.speaker === 'PATIENT';
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const cachedBadge = t.cache_hit ? `<span class="cached-pill"><i class="fa-solid fa-bolt"></i> CACHED</span>` : '';
    const audioBtn = t.audio_url ? `
      <button class="btn btn-outline btn-sm" style="margin-left: auto;" onclick="playTurnAudio('${t.audio_url}')">
        <i class="fa-solid fa-volume-high"></i> Play TTS
      </button>
    ` : '';

    return `
      <div class="transcript-card ${isPatient ? 'patient' : 'doctor'}">
        <div class="transcript-top-row">
          <div style="display: flex; align-items: center;">
            <span class="speaker-tag ${isPatient ? 'patient' : 'doctor'}">
              ${isPatient ? '<i class="fa-solid fa-user"></i> PATIENT' : '<i class="fa-solid fa-user-doctor"></i> DOCTOR'}
            </span>
            <span style="font-size: 11px; color: var(--text-muted); margin-left: 8px;">
              ${t.source_language} ➔ ${t.recipient_language}
            </span>
            ${cachedBadge}
          </div>
          <span class="transcript-time">${timeStr}</span>
        </div>

        ${t.recognized_source_text ? `
          <div class="transient-source">
            <strong>Recognized (${t.source_language}):</strong> "${t.recognized_source_text}"
          </div>
        ` : ''}

        <div class="recipient-translation">
          ${t.recipient_translation}
        </div>

        <div class="canonical-english-box">
          <strong>Canonical Clinical Record (English):</strong>
          ${t.canonical_english}
        </div>

        ${audioBtn ? `<div style="display: flex; margin-top: 4px;">${audioBtn}</div>` : ''}
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

window.playTurnAudio = function(urlPath) {
  const fullUrl = window.api.resolveAudioUrl(urlPath);
  window.audioManager.playAudio(fullUrl);
};

/* ==========================================================================
   AMBIENT SCRIBE MODE (CONTINUOUS BACKGROUND LISTENING)
   ========================================================================== */

let scribeTimerInterval = null;
let scribeSeconds = 0;
let currentConsultationMode = 'CONVERSATION';

function switchConsultationMode(mode) {
  if (window.audioManager.isRecording) return;
  currentConsultationMode = mode;
  const secConv = document.getElementById('section-conversation-mode');
  const secScribe = document.getElementById('section-scribe-mode');
  const btnConv = document.getElementById('btn-mode-conversation');
  const btnScribe = document.getElementById('btn-mode-scribe');

  if (mode === 'CONVERSATION') {
    if (secConv) secConv.style.display = 'flex';
    if (secScribe) secScribe.style.display = 'none';
    if (btnConv) {
      btnConv.style.background = '#ffffff';
      btnConv.style.color = 'var(--primary-green-deep)';
      btnConv.style.boxShadow = 'var(--shadow-sm)';
    }
    if (btnScribe) {
      btnScribe.style.background = 'transparent';
      btnScribe.style.color = 'var(--text-muted)';
      btnScribe.style.boxShadow = 'none';
    }
  } else {
    if (secConv) secConv.style.display = 'none';
    if (secScribe) secScribe.style.display = 'flex';
    if (btnScribe) {
      btnScribe.style.background = '#ffffff';
      btnScribe.style.color = '#ef4444';
      btnScribe.style.boxShadow = 'var(--shadow-sm)';
    }
    if (btnConv) {
      btnConv.style.background = 'transparent';
      btnConv.style.color = 'var(--text-muted)';
      btnConv.style.boxShadow = 'none';
    }
  }
}

async function startScribeRecording() {
  if (window.audioManager.isRecording) return;
  try {
    await window.audioManager.startRecording({ vad: false });
    scribeSeconds = 0;
    const timerDisp = document.getElementById('scribe-timer-display');
    const wave = document.getElementById('scribe-audio-wave');
    const pill = document.getElementById('scribe-status-pill');
    const instr = document.getElementById('scribe-instruction-text');
    const btnStart = document.getElementById('btn-scribe-start');
    const btnStop = document.getElementById('btn-scribe-stop');

    if (timerDisp) timerDisp.textContent = '00:00';
    if (wave) wave.style.display = 'flex';
    if (pill) {
      pill.style.background = '#fee2e2';
      pill.style.color = '#ef4444';
      pill.innerHTML = '<i class="fa-solid fa-circle fa-beat" style="font-size: 8px;"></i> RECORDING AMBIENT CONVERSATION';
    }
    if (instr) instr.textContent = 'Listening to dialogue between doctor and patient...';
    if (btnStart) btnStart.disabled = true;
    if (btnStop) btnStop.disabled = false;

    clearInterval(scribeTimerInterval);
    scribeTimerInterval = setInterval(() => {
      scribeSeconds++;
      const mins = String(Math.floor(scribeSeconds / 60)).padStart(2, '0');
      const secs = String(scribeSeconds % 60).padStart(2, '0');
      if (timerDisp) timerDisp.textContent = `${mins}:${secs}`;
    }, 1000);
  } catch (err) {
    alert('Failed to start scribe recording: ' + err.message);
  }
}

async function stopScribeAndGenerateReport() {
  if (!state.activeConsultation) return;
  clearInterval(scribeTimerInterval);
  scribeTimerInterval = null;

  const btnStop = document.getElementById('btn-scribe-stop');
  const banner = document.getElementById('scribe-processing-banner');
  const wave = document.getElementById('scribe-audio-wave');
  if (btnStop) btnStop.disabled = true;
  if (wave) wave.style.display = 'none';
  if (banner) banner.style.display = 'flex';

  try {
    const audioBlob = await window.audioManager.stopRecording();
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('No audio captured. Please speak into the microphone and try again.');
    }
    const docLang = state.doctor ? state.doctor.preferred_language : 'en-IN';
    const patLang = state.activeConsultation.patient_language || 'hi-IN';

    const draft = await window.api.processScribeAudio(state.activeConsultation.id, audioBlob, docLang, patLang);
    state.draft = draft;
    renderDraftReview(draft);
    showView('draftReview');
  } catch (err) {
    alert('Scribe processing failed: ' + err.message);
  } finally {
    if (banner) banner.style.display = 'none';
    const btnStart = document.getElementById('btn-scribe-start');
    if (btnStart) btnStart.disabled = false;
    const pill = document.getElementById('scribe-status-pill');
    if (pill) {
      pill.style.background = '#f1f5f9';
      pill.style.color = 'var(--text-muted)';
      pill.innerHTML = '<i class="fa-solid fa-circle" style="font-size: 8px;"></i> Standby - Ready to Record';
    }
    const instr = document.getElementById('scribe-instruction-text');
    if (instr) instr.textContent = 'Click "Start Recording" to begin consultation listening';
  }
}

/* ==========================================================================
   DRAFT MEDICAL RECORD GENERATION & REVIEW
   ========================================================================== */

async function loadDraftReview() {
  if (!state.activeConsultation) return;

  const reviewBtn = document.getElementById('btn-review-draft');
  if (reviewBtn) {
    reviewBtn.disabled = true;
    reviewBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  }

  try {
    const draft = await window.api.generateDraft(state.activeConsultation.id);
    state.draft = draft;

    renderDraftReview(draft);
    showView('draftReview');
  } catch (err) {
    alert('Failed to generate AI report: ' + err.message);
  } finally {
    if (reviewBtn) {
      reviewBtn.disabled = false;
      reviewBtn.innerHTML = `<i class="fa-solid fa-file-waveform"></i> Generate AI Report`;
    }
  }
}

function renderDraftReview(draft) {
  const payload = draft.structured_payload || {};

  // Vitals inputs
  const vitals = payload.vitals || {};
  const weightInput = document.getElementById('vitals-weight');
  const heightInput = document.getElementById('vitals-height');
  const bpInput = document.getElementById('vitals-bp');
  const pulseInput = document.getElementById('vitals-pulse');
  const tempInput = document.getElementById('vitals-temp');
  const spo2Input = document.getElementById('vitals-spo2');

  if (weightInput) weightInput.value = (vitals.weight_kg ?? vitals.weight ?? '').toString().replace('kg', '').trim();
  if (heightInput) heightInput.value = (vitals.height_cm ?? vitals.height ?? '').toString().replace('cm', '').trim();
  if (bpInput) bpInput.value = vitals.blood_pressure ?? vitals.bp ?? '';
  if (pulseInput) pulseInput.value = (vitals.pulse_bpm ?? vitals.pulse ?? '').toString().replace('bpm', '').trim();
  if (tempInput) tempInput.value = (vitals.temperature_f ?? vitals.temperature ?? vitals.temp ?? '').toString().replace('°F', '').trim();
  if (spo2Input) spo2Input.value = (vitals.spo2_percent ?? vitals.spo2 ?? '').toString().replace('%', '').trim();

  // Symptoms
  const symptomsContainer = document.getElementById('draft-symptoms-list');
  const symptoms = payload.patient_reported_symptoms || [];

  if (symptomsContainer) {
    if (symptoms.length === 0) {
      symptomsContainer.innerHTML = `<p style="color: var(--text-muted); font-size: 13px;">No symptoms extracted.</p>`;
    } else {
      symptomsContainer.innerHTML = symptoms.map(s => `
        <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #fffbeb; border-radius: 8px; margin-bottom: 6px;">
          <i class="fa-solid fa-virus" style="color: var(--patient-color);"></i>
          <div>
            <strong style="font-size: 14px;">${s.symptom}</strong>
            <span style="font-size: 12px; color: var(--text-muted);"> • Duration: ${s.duration || 'Not stated'}</span>
          </div>
        </div>
      `).join('');
    }
  }

  // Doctor diagnosis input
  const diagInput = document.getElementById('draft-diagnosis');
  if (diagInput) diagInput.value = payload.doctor_diagnosis || '';

  const notesInput = document.getElementById('draft-notes');
  if (notesInput) notesInput.value = payload.doctor_notes || (payload.medical_history ? `History: ${payload.medical_history}.` : '');

  // Recommended next consultation date & follow-up
  const followUpEl = document.getElementById('draft-followup-text');
  const nextDateInput = document.getElementById('draft-next-date');
  if (followUpEl) {
    followUpEl.textContent = payload.follow_up_recommendation || (payload.follow_up_days ? `Follow up in ${payload.follow_up_days} days` : 'Routine follow-up');
  }
  if (nextDateInput) {
    if (payload.recommended_next_visit_date) {
      nextDateInput.value = payload.recommended_next_visit_date;
    } else if (payload.follow_up_days) {
      const d = new Date();
      d.setDate(d.getDate() + payload.follow_up_days);
      nextDateInput.value = d.toISOString().slice(0, 10);
    } else {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      nextDateInput.value = d.toISOString().slice(0, 10);
    }
  }

  renderPrescriptions(payload.prescriptions || []);
}

// Doctor AI Scribe Assistant (Dictate Vitals & Additional Details in Any Language)
let isDoctorAIRecording = false;

async function toggleDoctorAIRecording() {
  const micBtn = document.getElementById('btn-doctor-ai-mic');
  const micStatus = document.getElementById('doctor-ai-mic-status');

  if (isDoctorAIRecording) {
    isDoctorAIRecording = false;
    if (micBtn) micBtn.classList.remove('recording');
    if (micStatus) micStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

    const blob = await window.audioManager.stopRecording();
    if (!blob) {
      if (micStatus) micStatus.textContent = 'No voice detected. Tap microphone to dictate.';
      return;
    }

    try {
      const docLang = document.getElementById('doctor-speak-lang')?.value || state.doctor?.preferred_language || 'en-IN';
      const result = await window.api.transcribeAudio(blob, docLang);
      if (result && result.transcript && result.transcript.trim()) {
        const textInput = document.getElementById('input-doctor-ai-text');
        if (textInput) textInput.value = result.transcript;
        await submitDoctorAIText(result.transcript);
      } else {
        if (micStatus) micStatus.textContent = 'Could not detect clear speech. Please speak again.';
      }
    } catch (err) {
      if (micStatus) micStatus.textContent = 'Speech transcription error: ' + err.message;
    }
  } else {
    if (window.audioManager.isPlaying) return;
    isDoctorAIRecording = true;
    if (micBtn) micBtn.classList.add('recording');
    if (micStatus) micStatus.innerHTML = `<span style="color: var(--ambient-purple); font-weight: 800;">🎙️ Listening... Dictate vitals (weight, height, BP, pulse, temp) now</span>`;

    window.audioManager.onSilenceDetected = async () => {
      if (isDoctorAIRecording) {
        await toggleDoctorAIRecording();
      }
    };

    await window.audioManager.startRecording({
      vad: true,
      silenceDurationMs: 1800,
    });
  }
}

async function submitDoctorAIText(customText) {
  const textInput = document.getElementById('input-doctor-ai-text');
  const text = (customText || textInput?.value || '').trim();
  if (!text) return;

  if (!state.activeConsultation) {
    alert('No active consultation session.');
    return;
  }

  return consultationApiQueue.enqueue(async () => {
    const micStatus = document.getElementById('doctor-ai-mic-status');
    const feedback = document.getElementById('doctor-ai-feedback');
    const feedbackText = document.getElementById('doctor-ai-feedback-text');
    const sendBtn = document.getElementById('btn-submit-doctor-ai');

    if (micStatus) micStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Analyzing vitals & clinical details...`;
    if (sendBtn) sendBtn.disabled = true;

    try {
      const docLang = state.doctor?.preferred_language || 'en-IN';
      const res = await window.api.doctorAIAssist(state.activeConsultation.id, text, docLang);
      if (res && res.updated_payload) {
        if (!state.draft) state.draft = { structured_payload: {} };
        state.draft.structured_payload = res.updated_payload;
        renderDraftReview(state.draft);

        // Directly update patient vitals card inputs on active consultation screen
        if (res.updated_payload.vitals) {
          const v = res.updated_payload.vitals;
          const w = document.getElementById('vitals-weight');
          const h = document.getElementById('vitals-height');
          const bp = document.getElementById('vitals-bp');
          const p = document.getElementById('vitals-pulse');
          const t = document.getElementById('vitals-temp');
          const s = document.getElementById('vitals-spo2');
          if (w && v.weight_kg != null) w.value = v.weight_kg;
          if (h && v.height_cm != null) h.value = v.height_cm;
          if (bp && v.blood_pressure) bp.value = v.blood_pressure;
          if (p && v.pulse_bpm != null) p.value = v.pulse_bpm;
          if (t && v.temperature_f != null) t.value = v.temperature_f;
          if (s && v.spo2_percent != null) s.value = v.spo2_percent;
        }

        if (feedback && feedbackText) {
          feedbackText.textContent = res.ai_reply || 'Vitals and clinical details updated successfully.';
          feedback.style.display = 'block';
        }
        if (textInput) textInput.value = '';
      }
    } catch (err) {
      alert('AI Assistant error: ' + err.message);
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      if (micStatus) micStatus.textContent = 'Tap microphone to dictate additional vitals & clinical instructions';
    }
  });
}

function renderPrescriptions(prescriptions) {
  const container = document.getElementById('prescriptions-list');
  if (!container) return;

  if (prescriptions.length === 0) {
    container.innerHTML = `
      <div style="padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 13px; color: var(--text-muted); text-align: center;">
        No medicines prescribed yet. Tap "+ Add Medicine" to prescribe.
      </div>
    `;
    return;
  }

  container.innerHTML = prescriptions.map((p, idx) => `
    <div class="prescription-item-row" style="display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: #f8fafc; border-radius: 8px; margin-bottom: 6px;">
      <div>
        <h5 style="font-size: 14px; font-weight: 700;">${p.medicine} ${p.strength || ''}</h5>
        <p style="font-size: 12px; color: var(--text-muted);">${p.dose || ''} • ${p.frequency || ''} • ${p.duration || ''}</p>
      </div>
      <button class="icon-btn" style="color: var(--error-red);" onclick="removePrescription(${idx})">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `).join('');
}

window.removePrescription = function(index) {
  if (!state.draft || !state.draft.structured_payload) return;
  state.draft.structured_payload.prescriptions.splice(index, 1);
  renderPrescriptions(state.draft.structured_payload.prescriptions);
};

// Approve Official Record
async function approveClinicalRecord() {
  if (!state.activeConsultation || !state.draft) return;

  const btn = document.getElementById('btn-approve-record');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  }

  try {
    const payload = state.draft.structured_payload || {};
    const diagInput = document.getElementById('draft-diagnosis');
    if (diagInput) payload.doctor_diagnosis = diagInput.value.trim();

    const notesInput = document.getElementById('draft-notes');
    if (notesInput) payload.doctor_notes = notesInput.value.trim();

    // Recommended next consultation date
    const draftNextDate = document.getElementById('draft-next-date')?.value;
    if (draftNextDate) {
      payload.recommended_next_visit_date = draftNextDate;
    }

    // Collect all edited vitals
    const weightVal = parseFloat(document.getElementById('vitals-weight')?.value);
    const heightVal = parseFloat(document.getElementById('vitals-height')?.value);
    const bpVal = (document.getElementById('vitals-bp')?.value || '').trim();
    const pulseVal = parseInt(document.getElementById('vitals-pulse')?.value, 10);
    const tempVal = parseFloat(document.getElementById('vitals-temp')?.value);
    const spo2Val = parseInt(document.getElementById('vitals-spo2')?.value, 10);

    payload.vitals = {
      weight_kg: !isNaN(weightVal) ? weightVal : null,
      weight: !isNaN(weightVal) ? `${weightVal} kg` : null,
      height_cm: !isNaN(heightVal) ? heightVal : null,
      height: !isNaN(heightVal) ? `${heightVal} cm` : null,
      blood_pressure: bpVal || null,
      bp: bpVal || null,
      pulse_bpm: !isNaN(pulseVal) ? pulseVal : null,
      pulse: !isNaN(pulseVal) ? `${pulseVal} bpm` : null,
      temperature_f: !isNaN(tempVal) ? tempVal : null,
      temperature: !isNaN(tempVal) ? `${tempVal} °F` : null,
      spo2_percent: !isNaN(spo2Val) ? spo2Val : null,
      spo2: !isNaN(spo2Val) ? `${spo2Val}%` : null,
    };

    await window.api.updateDraft(state.activeConsultation.id, payload);
    await window.api.approveDraft(state.activeConsultation.id);

    // Set follow-up date from recommendation
    const dateInput = document.getElementById('followup-date');
    if (dateInput) {
      if (draftNextDate) {
        dateInput.value = draftNextDate;
      } else {
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + 3);
        dateInput.value = nextDate.toISOString().slice(0, 10);
      }
    }

    showView('approval');
  } catch (err) {
    alert('Failed to approve clinical record: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-check-double"></i> Approve & Finalize Record`;
    }
  }
}

// Schedule Follow-up Appointment
async function saveFollowupAppointment() {
  if (!state.activeConsultation) return;

  const dateInput = document.getElementById('followup-date');
  const dtStr = dateInput ? dateInput.value : '';

  if (!dtStr) {
    alert('Please select follow-up appointment date.');
    return;
  }

  const btn = document.getElementById('btn-schedule-followup');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;
  }

  try {
    const appointmentAt = new Date(dtStr).toISOString();
    const phone = state.selectedPatient && state.selectedPatient.mobile_number ? state.selectedPatient.mobile_number : '';
    if (!phone) {
      alert('Patient phone number missing. Please update patient details first.');
      return;
    }
    await window.api.scheduleFollowup(state.activeConsultation.id, appointmentAt, phone);
    alert('Follow-up appointment saved successfully in clinic records!');
    showView('dashboard');
    loadPatients();
  } catch (err) {
    alert('Failed to save follow-up: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-calendar-check"></i> Schedule Follow-up`;
    }
  }
}

/* ==========================================================================
   EVENT LISTENERS & BINDINGS (Resilient with Safe Helpers)
   ========================================================================== */

function setupEventListeners() {
  // Top Navigation Tabs
  on('nav-btn-dashboard', 'click', () => showView('dashboard'));
  on('brand-header-link', 'click', () => showView('dashboard'));
  on('nav-btn-onboard', 'click', showOnboardingView);
  on('nav-btn-consultation', 'click', () => {
    if (state.activeConsultation) {
      showView('consultation');
    }
  });

  // Header Quick Language Switcher (Database Cache Synchronized)
  const headerLangSwitcher = document.getElementById('header-lang-switcher');
  if (headerLangSwitcher) {
    headerLangSwitcher.addEventListener('change', (e) => {
      const selected = e.target.value;
      if (window.switchAppLanguage) {
        window.switchAppLanguage(selected);
      }
    });
  }

  // Settings modal
  on('btn-open-settings', 'click', () => openModal('modal-settings'));
  on('link-configure-ip', 'click', () => openModal('modal-settings'));

  // Spoken languages checkboxes in settings
  document.querySelectorAll('#spoken-languages-chips input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      if (cb.parentElement) cb.parentElement.classList.toggle('selected', cb.checked);
    });
  });

  on('btn-save-settings', 'click', async () => {
    const name = (document.getElementById('setting-doc-name')?.value || '').trim();
    const creds = (document.getElementById('setting-doc-creds')?.value || '').trim();
    const lang = document.getElementById('setting-doc-lang')?.value || 'en-IN';
    const apiUrl = (document.getElementById('setting-api-url')?.value || '').trim();

    const checked = Array.from(document.querySelectorAll('#spoken-languages-chips input[type="checkbox"]:checked'));
    const spokenLanguages = checked.map(c => c.value).join(',');

    if (apiUrl) window.api.setBaseUrl(apiUrl);

    try {
      await window.api.updateDoctorSettings({
        name,
        credentials: creds,
        preferred_language: lang,
        spoken_languages: spokenLanguages,
      });
      await loadDoctorSettings();
      await checkConnection();
      closeModal('modal-settings');
    } catch (err) {
      alert('Error saving settings: ' + err.message);
    }
  });

  // Launch Conversational Onboarding
  on('btn-add-patient', 'click', showOnboardingView);

  // Onboarding Step A back button
  on('btn-back-onboard-lang', 'click', () => showView('dashboard'));

  // Onboarding Step B change language button
  on('btn-change-onboard-lang', 'click', () => {
    const stepB = document.getElementById('onboard-step-chat');
    const stepA = document.getElementById('onboard-step-language');
    if (stepB) stepB.style.display = 'none';
    if (stepA) stepA.style.display = 'flex';
  });

  // Replay question TTS
  on('btn-play-intake-tts', 'click', () => {
    const questions = getQuestionsForLanguage(onboardingState.selectedLanguage);
    const q = questions[onboardingState.currentStep];
    if (q) playIntakeQuestionTTS(q.text, onboardingState.selectedLanguage);
  });

  // Intake Mic Button (Manual toggle)
  on('btn-intake-mic', 'click', toggleIntakeVoiceRecording);

  // Intake Text Submit
  on('btn-submit-intake-text', 'click', () => {
    const text = (document.getElementById('input-intake-text')?.value || '').trim();
    if (text) handleIntakeAnswer(text);
  });

  const intakeInput = document.getElementById('input-intake-text');
  if (intakeInput) {
    intakeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const text = e.target.value.trim();
        if (text) handleIntakeAnswer(text);
      }
    });
  }

  // Complete Intake Early
  on('btn-finish-intake-early', 'click', submitOnboardingForm);

  // Start Consultation from Pre-Consultation Summary Card
  on('btn-start-from-summary', 'click', initiateConsultationStart);

  // Start Consultation from Patient Profile View
  on('btn-start-consultation', 'click', initiateConsultationStart);

  // Doctor Speaking Language Selector Change
  const docSpeakLang = document.getElementById('doctor-speak-lang');
  if (docSpeakLang) {
    docSpeakLang.addEventListener('change', () => {
      if (state.activeSpeaker === 'DOCTOR') {
        const turnText = document.getElementById('turn-direction-text');
        const pLang = state.activeConsultation ? state.activeConsultation.patient_language : 'hi-IN';
        if (turnText) {
          turnText.textContent = `Doctor Speaks (${LANG_LABELS[docSpeakLang.value] || docSpeakLang.value}) ➔ Patient Listens (${LANG_LABELS[pLang] || pLang})`;
        }
      }
    });
  }

  // Patient Search Debounce
  let searchTimer;
  const searchInput = document.getElementById('input-patient-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        loadPatients(e.target.value.trim());
      }, 250);
    });
  }

  // Navigation Back buttons
  on('btn-back-to-dashboard', 'click', () => showView('dashboard'));
  on('btn-back-to-consultation', 'click', () => showView('consultation'));
  on('btn-finish-consultation', 'click', () => showView('dashboard'));

  // Speaker Selector Buttons
  on('btn-speaker-patient', 'click', () => switchSpeaker('PATIENT'));
  on('btn-speaker-doctor', 'click', () => switchSpeaker('DOCTOR'));

  // Record Turn Button
  on('btn-record-turn', 'click', toggleRecording);

  // Quick Text Input Turn
  on('btn-open-text-turn', 'click', () => {
    const title = document.getElementById('modal-text-turn-title');
    const input = document.getElementById('input-turn-text');
    if (title) title.textContent = `Type Utterance (${state.activeSpeaker === 'PATIENT' ? 'Patient' : 'Doctor'})`;
    if (input) input.value = '';
    openModal('modal-text-turn');
  });

  on('btn-submit-text-turn', 'click', () => {
    const input = document.getElementById('input-turn-text');
    const text = (input?.value || '').trim();
    if (text) {
      closeModal('modal-text-turn');
      processTextTurn(text);
    }
  });

  // Review Draft / Generate AI Report Button
  on('btn-review-draft', 'click', loadDraftReview);

  // Consultation Mode Switcher Listeners
  on('btn-mode-conversation', 'click', () => switchConsultationMode('CONVERSATION'));
  on('btn-mode-scribe', 'click', () => switchConsultationMode('SCRIBE'));

  // Ambient Scribe Action Listeners
  on('btn-scribe-start', 'click', startScribeRecording);
  on('btn-scribe-stop', 'click', stopScribeAndGenerateReport);

  // Doctor AI Scribe Voice / Text Assistant Listeners
  on('btn-doctor-ai-mic', 'click', toggleDoctorAIRecording);
  on('btn-submit-doctor-ai', 'click', () => submitDoctorAIText());

  const doctorAiInput = document.getElementById('input-doctor-ai-text');
  if (doctorAiInput) {
    doctorAiInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitDoctorAIText();
      }
    });
  }

  // Print Full Medical Report
  on('btn-print-report', 'click', () => {
    window.print();
  });

  // Draft Actions
  on('btn-approve-record', 'click', approveClinicalRecord);

  // Add Prescription
  on('btn-add-prescription', 'click', () => openModal('modal-prescription'));
  on('btn-confirm-add-presc', 'click', () => {
    const med = (document.getElementById('presc-med')?.value || '').trim();
    const strength = (document.getElementById('presc-strength')?.value || '').trim();
    const dose = (document.getElementById('presc-dose')?.value || '').trim();
    const freq = (document.getElementById('presc-freq')?.value || '').trim();
    const dur = (document.getElementById('presc-duration')?.value || '').trim();

    if (!med) return;

    if (!state.draft.structured_payload.prescriptions) {
      state.draft.structured_payload.prescriptions = [];
    }

    state.draft.structured_payload.prescriptions.push({
      medicine: med,
      strength,
      dose,
      frequency: freq,
      duration: dur,
    });

    renderPrescriptions(state.draft.structured_payload.prescriptions);
    closeModal('modal-prescription');
  });

  // Follow-up Save
  on('btn-schedule-followup', 'click', saveFollowupAppointment);
}

// Audio Callbacks for Single-Device Echo Management, Visualizer & Timer
function setupAudioCallbacks() {
  const recordInstruction = document.getElementById('record-instruction');
  const recordTimer = document.getElementById('record-timer');
  const timerDisplay = document.getElementById('timer-display');
  const recordBtn = document.getElementById('btn-record-turn');
  const intakeTimer = document.getElementById('intake-rec-timer');
  const intakeWave = document.getElementById('intake-audio-wave');
  const consultWave = document.getElementById('consultation-audio-wave');

  window.audioManager.onStateChange = ({ isRecording, isPlaying }) => {
    // Show/hide animated audio visualizers
    if (intakeWave) {
      intakeWave.style.display = (isRecording || isPlaying) ? 'flex' : 'none';
    }
    if (consultWave) {
      consultWave.style.display = (isRecording || isPlaying) ? 'flex' : 'none';
    }

    if (isPlaying) {
      if (recordBtn) recordBtn.disabled = true;
      if (recordInstruction) recordInstruction.textContent = 'Audio playback in progress...';
    } else {
      if (recordBtn) recordBtn.disabled = false;
      if (isRecording) {
        if (recordBtn) recordBtn.classList.add('recording');
        if (recordTimer) recordTimer.style.display = 'flex';
        if (recordInstruction) recordInstruction.textContent = 'Listening... Speak your turn or tap mic to finish';
      } else {
        if (recordBtn) recordBtn.classList.remove('recording');
        if (recordTimer) recordTimer.style.display = 'none';
        if (recordInstruction) recordInstruction.textContent = 'Tap microphone to speak turn in native language';
      }
    }
  };

  window.audioManager.onTimerTick = (timeFormatted) => {
    if (timerDisplay) timerDisplay.textContent = timeFormatted;
    if (intakeTimer) intakeTimer.textContent = timeFormatted;
  };
}

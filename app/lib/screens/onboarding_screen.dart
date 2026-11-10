import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/audio_service.dart';
import '../core/theme.dart';
import '../core/language_names.dart';
import '../models/doctor.dart';
import '../models/patient.dart';
import '../widgets/soundwave_visualizer.dart';
import 'consultation_screen.dart';

class OnboardingScreen extends StatefulWidget {
  final ApiClient api;
  final Doctor doctor;

  const OnboardingScreen({
    super.key,
    required this.api,
    required this.doctor,
  });

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final AudioService _audio = AudioService();
  int _currentStepStage = 0; // 0: Language Bubbles, 1: Chat, 2: Pre-Consult Summary
  String _selectedLanguage = 'hi-IN';
  int _questionIndex = 0;
  bool _isValidating = false;
  String? _validationAlert;

  final TextEditingController _textInputController = TextEditingController();

  // Intake Form Data
  final Map<String, dynamic> _formData = {
    'name': '',
    'age': null,
    'gender': '',
    'mobile_number': '',
    'preferred_language': 'hi-IN',
    'chief_complaint': '',
    'symptoms_duration': '',
    'past_medical_history': '',
    'known_allergies': '',
  };

  Patient? _createdPatient;

  // Localized UI strings for all 11 Indian languages during Patient Onboarding
  static const Map<String, Map<String, String>> _intakeUi = {
    'en-IN': {
      'change_lang': 'Change Lang',
      'female_voice': 'Female Voice',
      'listen_aloud': 'Listen Aloud',
      'recording_hint': 'Recording... Speak answer, tap stop when done',
      'input_hint': 'Speak or type answer here...',
      'autofill_title': 'Live Autofilled Intake Form',
      'pending': 'Pending response...',
      'name': 'Full Name',
      'age_gender': 'Age & Gender',
      'phone': 'Mobile Number',
      'complaint': 'Chief Complaint',
      'history': 'Medical History',
      'allergies': 'Known Allergies',
      'complete_early': 'Complete & Submit Form',
    },
    'hi-IN': {
      'change_lang': 'भाषा बदलें',
      'female_voice': 'महिला आवाज़',
      'listen_aloud': 'प्रश्न सुनें',
      'recording_hint': 'रिकॉर्डिंग जारी है... बोलें, पूरा होने पर स्टॉप दबाएं',
      'input_hint': 'बोलें या उत्तर यहां टाइप करें...',
      'autofill_title': 'लाइव स्वतः भरा हुआ फॉर्म',
      'pending': 'उत्तर की प्रतीक्षा...',
      'name': 'पूरा नाम',
      'age_gender': 'उम्र एवं लिंग',
      'phone': 'मोबाइल नंबर',
      'complaint': 'मुख्य समस्या / लक्षण',
      'history': 'पिछला चिकित्सा इतिहास',
      'allergies': 'एलर्जी एवं दवाइयां',
      'complete_early': 'फॉर्म पूरा करें एवं जमा करें',
    },
    'mr-IN': {
      'change_lang': 'भाषा बदला',
      'female_voice': 'स्त्री आवाज',
      'listen_aloud': 'प्रश्न ऐका',
      'recording_hint': 'रेकॉर्डिंग सुरू आहे... उत्तर बोला, झाल्यावर स्टॉप दाबा',
      'input_hint': 'बोला किंवा उत्तर येथे टाइप करा...',
      'autofill_title': 'लाइव्ह ऑटोफिल्ड इनटेक फॉर्म',
      'pending': 'उत्तराची प्रतीक्षा...',
      'name': 'पूर्ण नाव',
      'age_gender': 'वय आणि लिंग',
      'phone': 'मोबाईल नंबर',
      'complaint': 'मुख्य तक्रार / लक्षणे',
      'history': 'मागील वैद्यकीय इतिहास',
      'allergies': 'ऍलर्जी आणि नियमित औषधे',
      'complete_early': 'फॉर्म पूर्ण करा आणि सबमिट करा',
    },
    'gu-IN': {
      'change_lang': 'ભાષા બદલો',
      'female_voice': 'સ્ત્રી અવાજ',
      'listen_aloud': 'પ્રશ્ન સાંભળો',
      'recording_hint': 'રેકોર્ડિંગ ચાલુ છે... બોલો, પૂરું થાય ત્યારે સ્ટોપ દબાવો',
      'input_hint': 'બોલો અથવા ઉત્તર અહીં ટાઇપ કરો...',
      'autofill_title': 'લાઇવ સ્વતઃ ભરેલ ઇનટેક ફોર્મ',
      'pending': 'જવાબની રાહ જોઈ રહ્યા છીએ...',
      'name': 'પૂરું નામ',
      'age_gender': 'ઉંમર અને લિંગ',
      'phone': 'મોબાઇલ નંબર',
      'complaint': 'મુખ્ય ફરિયાદ / લક્ષણો',
      'history': 'પાછલો તબીબી ઇતિહાસ',
      'allergies': 'એલર્જી અને દવાઓ',
      'complete_early': 'ફોર્મ પૂર્ણ કરી સબમિટ કરો',
    },
    'bn-IN': {
      'change_lang': 'ভাষা পরিবর্তন',
      'female_voice': 'নারী কণ্ঠ',
      'listen_aloud': 'প্রশ্ন শুনুন',
      'recording_hint': 'রেকর্ডিং চলছে... বলুন, শেষ হলে স্টপ টিপুন',
      'input_hint': 'বলুন অথবা এখানে উত্তর লিখুন...',
      'autofill_title': 'লাইভ অটোফিল ইনটেক ফর্ম',
      'pending': 'উত্তরের অপেক্ষায়...',
      'name': 'পুরো নাম',
      'age_gender': 'বয়স ও লিঙ্গ',
      'phone': 'মোবাইল নম্বর',
      'complaint': 'প্রধান সমস্যা / উপসর্গ',
      'history': 'পূর্ববর্তী চিকিৎসার ইতিহাস',
      'allergies': 'অ্যালার্জি এবং ওষুধ',
      'complete_early': 'ফর্ম সম্পন্ন ও জমা দিন',
    },
    'ta-IN': {
      'change_lang': 'மொழி மாற்றவும்',
      'female_voice': 'பெண் குரல்',
      'listen_aloud': 'கேள்வி கேளுங்கள்',
      'recording_hint': 'பதிவாகிறது... பேசுங்கள், முடிந்ததும் நிறுத்துங்கள்',
      'input_hint': 'பேசுங்கள் அல்லது பதில் தட்டச்சு செய்க...',
      'autofill_title': 'நேரலை தானியங்கு படிவம்',
      'pending': 'பதிலுக்காக காத்திருக்கிறது...',
      'name': 'முழு பெயர்',
      'age_gender': 'வயது மற்றும் பாலினம்',
      'phone': 'கைபேசி எண்',
      'complaint': 'முக்கிய பிரச்சனை / அறிகுறிகள்',
      'history': 'முந்தைய மருத்துவ வரலாறு',
      'allergies': 'ஒவ்வாமை மற்றும் மருந்துகள்',
      'complete_early': 'படிவத்தை முடித்து சமர்ப்பிக்கவும்',
    },
    'te-IN': {
      'change_lang': 'భాష మార్చండి',
      'female_voice': 'మహిళా స్వరం',
      'listen_aloud': 'ప్రశ్న వినండి',
      'recording_hint': 'రికార్డింగ్ అవుతోంది... మాట్లాడండి, పూర్తయ్యాక ఆపండి',
      'input_hint': 'మాట్లాడండి లేదా ఇక్కడ సమాధానం టైప్ చేయండి...',
      'autofill_title': 'లైవ్ ఆటో-ఫిల్డ్ ఫారం',
      'pending': 'సమాధానం కోసం వేచి ఉంది...',
      'name': 'పూర్తి పేరు',
      'age_gender': 'వయస్సు & లింగం',
      'phone': 'మొబైల్ సంఖ్య',
      'complaint': 'ప్రధాన సమస్య / లక్షణాలు',
      'history': 'గత వైద్య చరిత్ర',
      'allergies': 'అలెర్జీలు మరియు మందులు',
      'complete_early': 'ఫారమ్‌ను సమర్పించండి',
    },
    'kn-IN': {
      'change_lang': 'ಭಾಷೆ ಬದಲಿಸಿ',
      'female_voice': 'ಮಹಿಳಾ ಧ್ವನಿ',
      'listen_aloud': 'ಪ್ರಶ್ನೆ ಕೇಳಿ',
      'recording_hint': 'ರೆಕಾರ್ಡಿಂಗ್ ಆಗುತ್ತಿದೆ... ಮಾತನಾಡಿ, ಮುಗಿದ ನಂತರ ನಿಲ್ಲಿಸಿ',
      'input_hint': 'ಮಾತನಾಡಿ ಅಥವಾ ಉತ್ತರವನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...',
      'autofill_title': 'ಲೈವ್ ಸ್ವಯಂಚಾಲಿತ ಭರ್ತಿ ಫಾರ್ಮ್',
      'pending': 'ಉತ್ತರಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ...',
      'name': 'ಪೂರ್ಣ ಹೆಸರು',
      'age_gender': 'ವಯಸ್ಸು ಮತ್ತು ಲಿಂಗ',
      'phone': 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
      'complaint': 'ಮುಖ್ಯ ಸಮಸ್ಯೆ / ಲಕ್ಷಣಗಳು',
      'history': 'ಹಿಂದಿನ ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ',
      'allergies': 'ಅಲರ್ಜಿಗಳು ಮತ್ತು ಔಷಧಗಳು',
      'complete_early': 'ಫಾರ್ಮ್ ಪೂರ್ಣಗೊಳಿಸಿ ಮತ್ತು ಸಲ್ಲಿಸಿ',
    },
    'ml-IN': {
      'change_lang': 'ഭാഷ മാറ്റുക',
      'female_voice': 'സ്ത്രീ ശബ്ദം',
      'listen_aloud': 'ചോദ്യം കേൾക്കുക',
      'recording_hint': 'റെക്കോർഡിംഗ് നടക്കുന്നു... സംസാരിക്കുക, പൂർത്തിയാകുമ്പോൾ നിർത്തുക',
      'input_hint': 'സംസാരിക്കുക അല്ലെങ്കിൽ ഉത്തരം ഇവിടെ ടൈപ്പ് ചെയ്യുക...',
      'autofill_title': 'ലൈവ് സ്വയം പൂരിപ്പിച്ച ഫോം',
      'pending': 'മറുപടിക്കായി കാത്തിരിക്കുന്നു...',
      'name': 'പൂർണ്ണ പേര്',
      'age_gender': 'പ്രായവും ലിംഗവും',
      'phone': 'മൊബൈൽ നമ്പർ',
      'complaint': 'പ്രധാന പ്രശ്നം / ലക്ഷണങ്ങൾ',
      'history': 'മുൻകാല മെഡിക്കൽ ചരിത്രം',
      'allergies': 'അലർജികളും മരുന്നുകളും',
      'complete_early': 'ഫോം പൂർത്തിയാക്കി സമർപ്പിക്കുക',
    },
    'pa-IN': {
      'change_lang': 'ਭਾਸ਼ਾ ਬਦਲੋ',
      'female_voice': 'ਔਰਤ ਦੀ ਆਵਾਜ਼',
      'listen_aloud': 'ਸਵਾਲ ਸੁਣੋ',
      'recording_hint': 'ਰਿਕਾਰਡਿੰਗ ਚੱਲ ਰਹੀ ਹੈ... ਬੋਲੋ, ਖਤਮ ਹੋਣ \'ਤੇ ਰੋਕੋ',
      'input_hint': 'ਬੋਲੋ ਜਾਂ ਇੱਥੇ ਜਵਾਬ ਲਿਖੋ...',
      'autofill_title': 'ਲਾਈਵ ਸਵੈ-ਭਰਿਆ ਇਨਟੇਕ ਫਾਰਮ',
      'pending': 'ਜਵਾਬ ਦੀ ਉਡੀਕ...',
      'name': 'ਪੂਰਾ ਨਾਮ',
      'age_gender': 'ਉਮਰ ਅਤੇ ਲਿੰਗ',
      'phone': 'ਮੋਬਾਈਲ ਨੰਬਰ',
      'complaint': 'ਮੁੱਖ ਸਮੱਸਿਆ / ਲੱਛਣ',
      'history': 'ਪਿਛਲਾ ਡਾਕਟਰੀ ਇਤਿਹਾਸ',
      'allergies': 'ਐਲਰਜੀ ਅਤੇ ਦਵਾਈਆਂ',
      'complete_early': 'ਫਾਰਮ ਪੂਰਾ ਕਰੋ ਅਤੇ ਜਮ੍ਹਾਂ ਕਰੋ',
    },
    'or-IN': {
      'change_lang': 'ଭାଷା ବଦଳାନ୍ତୁ',
      'female_voice': 'ମହିଳା ସ୍ୱର',
      'listen_aloud': 'ପ୍ରଶ୍ନ ଶୁଣନ୍ତୁ',
      'recording_hint': 'ରେକର୍ଡିଂ ଚାଲିଛି... କୁହନ୍ତୁ, ସରିବା ପରେ ବନ୍ଦ କରନ୍ତୁ',
      'input_hint': 'କୁହନ୍ତୁ କିମ୍ବା ଉତ୍ତର ଏଠାରେ ଟାଇପ୍ କରନ୍ତୁ...',
      'autofill_title': 'ଲାଇଭ୍ ସ୍ୱୟଂଚାଳିତ ଇନଟେକ୍ ଫର୍ମ',
      'pending': 'ଉତ୍ତରକୁ ଅପେକ୍ଷା...',
      'name': 'ପୂରା ନାମ',
      'age_gender': 'ବୟସ ଏବଂ ଲିଙ୍ଗ',
      'phone': 'ମୋବାଇଲ୍ ନମ୍ବର',
      'complaint': 'ମୁଖ୍ୟ ସମସ୍ୟା / ଲକ୍ଷଣ',
      'history': 'ପୂର୍ବ ଚିକିତ୍ସା ଇତିହାସ',
      'allergies': 'ଆଲର୍ଜି ଏବଂ ଔଷଧ',
      'complete_early': 'ଫର୍ମ ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ ଏବଂ ଦାଖଲ କରନ୍ତୁ',
    },
  };

  String _ui(String key) {
    return _intakeUi[_selectedLanguage]?[key] ?? _intakeUi['en-IN']![key]!;
  }

  final Map<String, List<Map<String, dynamic>>> _questions = {
    'hi-IN': [
      {
        'id': 'name',
        'label': 'Question 1 of 5 • Full Name',
        'text': 'नमस्ते! आपका शुभ नाम क्या है?',
        'sub': '(Hello! What is your full name?)',
      },
      {
        'id': 'age_gender',
        'label': 'Question 2 of 5 • Age & Gender',
        'text': 'आपकी उम्र कितनी है और आपका लिंग (पुरुष / महिला) क्या है?',
        'sub': '(What is your age and gender?)',
      },
      {
        'id': 'phone',
        'label': 'Question 3 of 5 • Mobile Number',
        'text': 'कृपया अपना 10 अंकों का मोबाइल फोन नंबर बताइए।',
        'sub': '(Please provide your 10-digit mobile phone number.)',
      },
      {
        'id': 'complaint',
        'label': 'Question 4 of 5 • Health Problem',
        'text': 'आपको क्या तकलीफ़ या समस्या हो रही है और यह कितने दिनों से है?',
        'sub': '(What health problem are you facing and for how many days?)',
      },
      {
        'id': 'history_allergies',
        'label': 'Question 5 of 5 • Medical History & Allergies',
        'text': 'क्या आपको पहले से बीपी, शुगर या दमा जैसी बीमारी है? और क्या किसी दवा से एलर्जी है?',
        'sub': '(Do you have conditions like BP/Diabetes, or any drug allergies?)',
      },
    ],
    'mr-IN': [
      {
        'id': 'name',
        'label': 'प्रश्न १ / ५ • पूर्ण नाव',
        'text': 'नमस्कार! आपले पूर्ण नाव काय आहे?',
        'sub': '(Hello! What is your full name?)',
      },
      {
        'id': 'age_gender',
        'label': 'प्रश्न २ / ५ • वय आणि लिंग',
        'text': 'आपले वय किती आहे आणि आपले लिंग (पुरुष / स्त्री) काय आहे?',
        'sub': '(What is your age and gender?)',
      },
      {
        'id': 'phone',
        'label': 'प्रश्न ३ / ५ • मोबाईल नंबर',
        'text': 'कृपया आपला १० अंकी मोबाईल नंबर सांगा.',
        'sub': '(Please provide your 10-digit mobile phone number.)',
      },
      {
        'id': 'complaint',
        'label': 'प्रश्न ४ / ५ • आजार आणि कालावधी',
        'text': 'आपल्याला काय त्रास किंवा आजार होत आहे आणि किती दिवसांपासून आहे?',
        'sub': '(What health problem are you facing and for how many days?)',
      },
      {
        'id': 'history_allergies',
        'label': 'प्रश्न ५ / ५ • मागील आजार आणि ॲलर्जी',
        'text': 'आपल्याला आधीपासून बीपी, शुगर, दमा असा कोणताही जुना आजार आहे का? आणि कोणत्या औषधाची ॲलर्जी आहे का?',
        'sub': '(Do you have conditions like BP/Diabetes, or any drug allergies?)',
      },
    ],
    'en-IN': [
      {
        'id': 'name',
        'label': 'Question 1 of 5 • Full Name',
        'text': 'Hello! What is your full name?',
        'sub': '(Please state your legal first and last name)',
      },
      {
        'id': 'age_gender',
        'label': 'Question 2 of 5 • Age & Gender',
        'text': 'What is your age and gender (Male / Female)?',
        'sub': '(You can mention in any sequence, e.g. 28 Female)',
      },
      {
        'id': 'phone',
        'label': 'Question 3 of 5 • Mobile Phone Number',
        'text': 'Please provide your 10-digit mobile phone number.',
        'sub': '(Speak in digits or words)',
      },
      {
        'id': 'complaint',
        'label': 'Question 4 of 5 • Primary Complaint',
        'text': 'What symptoms or health problem are you experiencing, and for how long?',
        'sub': '(Describe your primary complaint and duration)',
      },
      {
        'id': 'history_allergies',
        'label': 'Question 5 of 5 • Medical History & Allergies',
        'text': 'Do you have chronic conditions (BP, Diabetes, Asthma) or known drug allergies?',
        'sub': '(Mention any ongoing health history)',
      },
    ],
    'gu-IN': [
      {
        'id': 'name',
        'label': 'પ્રશ્ન ૧ / ૫ • પૂરું નામ',
        'text': 'નમસ્તે! આપનું પૂરું નામ શું છે?',
        'sub': '(Hello! What is your full name?)',
      },
      {
        'id': 'age_gender',
        'label': 'પ્રશ્ન ૨ / ૫ • ઉંમર અને લિંગ',
        'text': 'આપની ઉંમર કેટલી છે અને આપનું લિંગ (પુરુષ / સ્ત્રી) શું છે?',
        'sub': '(What is your age and gender?)',
      },
      {
        'id': 'phone',
        'label': 'પ્રશ્ન ૩ / ૫ • મોબાઈલ નંબર',
        'text': 'કૃપા કરીને આપનો ૧૦ અંકનો મોબાઈલ નંબર જણાવો.',
        'sub': '(Please provide your 10-digit mobile number.)',
      },
      {
        'id': 'complaint',
        'label': 'પ્રશ્ન ૪ / ૫ • તકલીફ અને દિવસો',
        'text': 'આપને શું તકલીફ અથવા બીમારી છે અને કેટલા દિવસથી છે?',
        'sub': '(What health problem are you facing and for how many days?)',
      },
      {
        'id': 'history_allergies',
        'label': 'પ્રશ્ન ૫ / ૫ • જૂની બીમારી અને એલર્જી',
        'text': 'શું આપને બીપી, ડાયાબિટીસ કે દમ જેવો કોઈ જૂનો રોગ છે? અને કોઈ દવાની એલર્જી છે?',
        'sub': '(Do you have chronic conditions or drug allergies?)',
      },
    ],
    'bn-IN': [
      {
        'id': 'name',
        'label': 'প্রশ্ন ১ / ৫ • সম্পূর্ণ নাম',
        'text': 'নমস্কার! আপনার পুরো নাম কি?',
        'sub': '(Hello! What is your full name?)',
      },
      {
        'id': 'age_gender',
        'label': 'প্রশ্ন ২ / ৫ • বয়স এবং লিঙ্গ',
        'text': 'আপনার বয়স কত এবং আপনার লিঙ্গ (পুরুষ / মহিলা) কি?',
        'sub': '(What is your age and gender?)',
      },
      {
        'id': 'phone',
        'label': 'প্রশ্ন ৩ / ৫ • মোবাইল নম্বর',
        'text': 'অনুগ্রহ করে আপনার ১০ অঙ্কের মোবাইল নম্বরটি বলুন।',
        'sub': '(Please provide your 10-digit mobile number.)',
      },
      {
        'id': 'complaint',
        'label': 'প্রশ্ন ৪ / ৫ • শারীরিক সমস্যা',
        'text': 'আপনার কি সমস্যা বা অসুস্থতা হচ্ছে এবং কত দিন ধরে?',
        'sub': '(What health problem are you facing and for how many days?)',
      },
      {
        'id': 'history_allergies',
        'label': 'প্রশ্ন ৫ / ৫ • অতীত রোগ ও অ্যালার্জি',
        'text': 'আপনার কি প্রেসার, সুগার বা হাঁপানির মতো কোনো রোগ আছে? এবং কোনো ওষুধে অ্যালার্জি আছে?',
        'sub': '(Do you have chronic conditions or drug allergies?)',
      },
    ],
    'te-IN': [
      {
        'id': 'name',
        'label': 'ప్రశ్న 1 / 5 • పూర్తి పేరు',
        'text': 'నమస్కారం! మీ పూర్తి పేరు ఏమిటి?',
        'sub': '(Hello! What is your full name?)',
      },
      {
        'id': 'age_gender',
        'label': 'ప్రశ్న 2 / 5 • వయస్సు మరియు లింగం',
        'text': 'మీ వయస్సు ఎంత మరియు మీ లింగం (పురుషుడు / స్త్రీ) ఏమిటి?',
        'sub': '(What is your age and gender?)',
      },
      {
        'id': 'phone',
        'label': 'ప్రశ్న 3 / 5 • మొబైల్ నంబర్',
        'text': 'దయచేసి మీ 10 అంకెల మొబైల్ నంబర్ చెప్పండి.',
        'sub': '(Please provide your 10-digit mobile number.)',
      },
      {
        'id': 'complaint',
        'label': 'ప్రశ్న 4 / 5 • అనారోగ్య సమస్య',
        'text': 'మీకు ఎలాంటి అనారోగ్యం లేదా సమస్య ఉంది మరియు ఎన్ని రోజులుగా ఉంది?',
        'sub': '(What health problem are you facing and for how many days?)',
      },
      {
        'id': 'history_allergies',
        'label': 'ప్రశ్న 5 / 5 • వ్యాధి చరిత్ర & అలర్జీలు',
        'text': 'మీకు బీపీ, షుగర్ లేదా ఆస్తమా వంటి മുనుపటి వ్యాధులు ఉన్నాయా? ఏదైనా మందుల అలర్జీ ఉందా?',
        'sub': '(Do you have chronic conditions or drug allergies?)',
      },
    ],
    'ta-IN': [
      {
        'id': 'name',
        'label': 'கேள்வி 1 / 5 • முழுப் பெயர்',
        'text': 'வணக்கம்! உங்கள் முழு பெயர் என்ன?',
        'sub': '(Hello! What is your full name?)',
      },
      {
        'id': 'age_gender',
        'label': 'கேள்வி 2 / 5 • வயது மற்றும் பாலினம்',
        'text': 'உங்கள் வயது என்ன மற்றும் உங்கள் பாலினம் (ஆண் / பெண்) என்ன?',
        'sub': '(What is your age and gender?)',
      },
      {
        'id': 'phone',
        'label': 'கேள்வி 3 / 5 • மொபைல் எண்',
        'text': 'தயவுசெய்து உங்கள் 10 இலக்க மொபைல் எண்ணைக் கூறுங்கள்.',
        'sub': '(Please provide your 10-digit mobile number.)',
      },
      {
        'id': 'complaint',
        'label': 'கேள்வி 4 / 5 • உடல்நலப் பிரச்சனை',
        'text': 'உங்களுக்கு என்ன உடல்நலப் பிரச்சனை மற்றும் எத்தனை நாட்களாக உள்ளது?',
        'sub': '(What health problem are you facing and for how many days?)',
      },
      {
        'id': 'history_allergies',
        'label': 'கேள்வி 5 / 5 • முந்தைய நோய்கள் & ஒவ்வாமை',
        'text': 'உங்களுக்கு பிபி, சர்க்கரை நோய் அல்லது ஆஸ்துமா போன்ற நோய்கள் உள்ளதா? மருந்து ஒவ்வாமை ஏதேனும் உள்ளதா?',
        'sub': '(Do you have chronic conditions or drug allergies?)',
      },
    ],
    'kn-IN': [
      {
        'id': 'name',
        'label': 'ಪ್ರಶ್ನೆ 1 / 5 • ಪೂರ್ಣ ಹೆಸರು',
        'text': 'ನಮಸ್ಕಾರ! ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು ಏನು?',
        'sub': '(Hello! What is your full name?)',
      },
      {
        'id': 'age_gender',
        'label': 'ಪ್ರಶ್ನೆ 2 / 5 • ವಯಸ್ಸು ಮತ್ತು ಲಿಂಗ',
        'text': 'ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು ಮತ್ತು ನಿಮ್ಮ ಲಿಂಗ (ಪುರುಷ / ಮಹಿಳೆ) ಯಾವುದು?',
        'sub': '(What is your age and gender?)',
      },
      {
        'id': 'phone',
        'label': 'ಪ್ರಶ್ನೆ 3 / 5 • ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
        'text': 'ದಯವಿಟ್ಟು ನಿಮ್ಮ 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ.',
        'sub': '(Please provide your 10-digit mobile number.)',
      },
      {
        'id': 'complaint',
        'label': 'ಪ್ರಶ್ನೆ 4 / 5 • ಆರೋಗ್ಯ ಸಮಸ್ಯೆ',
        'text': 'ನಿಮಗೆ ಏನು ತೊಂದರೆ ಅಥವಾ ಕಾಯಿಲೆ ಇದೆ ಮತ್ತು ಎಷ್ಟು ದಿನಗಳಿಂದ ಇದೆ?',
        'sub': '(What health problem are you facing and for how many days?)',
      },
      {
        'id': 'history_allergies',
        'label': 'ಪ್ರಶ್ನೆ 5 / 5 • ಹಳೆಯ ಕಾಯಿಲೆ & ಅಲರ್ಜಿ',
        'text': 'ನಿಮಗೆ ಬಿಪಿ, ಸಕ್ಕರೆ ಕಾಯಿಲೆ ಅಥವಾ ಉಬ್ಬಸದಂತಹ ಸಮಸ್ಯೆ ಇದೆಯೇ? ಯಾವುದಾದರೂ ಔಷಧಿಯ ಅಲರ್ಜಿ ಇದೆಯೇ?',
        'sub': '(Do you have chronic conditions or drug allergies?)',
      },
    ],
    'ml-IN': [
      {
        'id': 'name',
        'label': 'ചോദ്യം 1 / 5 • പൂർണ്ണ പേര്',
        'text': 'നമസ്കാരം! നിങ്ങളുടെ മുഴുവൻ പേര് എന്താണ്?',
        'sub': '(Hello! What is your full name?)',
      },
      {
        'id': 'age_gender',
        'label': 'ചോദ്യം 2 / 5 • പ്രായവും ലിംഗവും',
        'text': 'നിങ്ങളുടെ പ്രായം എത്രയാണ്, ലിംഗം (പുരുഷൻ / സ്ത്രീ) ഏതാണ്?',
        'sub': '(What is your age and gender?)',
      },
      {
        'id': 'phone',
        'label': 'ചോദ്യം 3 / 5 • മൊബൈൽ നമ്പർ',
        'text': 'ദയവായി നിങ്ങളുടെ 10 അക്ക മൊബൈൽ നമ്പർ പറയുക.',
        'sub': '(Please provide your 10-digit mobile number.)',
      },
      {
        'id': 'complaint',
        'label': 'ചോദ്യം 4 / 5 • രോഗലക്ഷണങ്ങൾ',
        'text': 'നിങ്ങൾക്ക് എന്താണ് ശാരീരിക അസ്വസ്ഥത, എത്ര ദിവസമായി?',
        'sub': '(What health problem are you facing and for how many days?)',
      },
      {
        'id': 'history_allergies',
        'label': 'ചോദ്യം 5 / 5 • മുൻകാല രോഗങ്ങൾ & അലർജി',
        'text': 'നിങ്ങൾക്ക് ബിപി, പ്രമേഹം, ആസ്ത്മ തുടങ്ങിയ അസുഖങ്ങളോ മരുന്നുകളോട് അലർജിയോ ഉണ്ടോ?',
        'sub': '(Do you have chronic conditions or drug allergies?)',
      },
    ],
    'pa-IN': [
      {
        'id': 'name',
        'label': 'ਸਵਾਲ 1 / 5 • ਪੂਰਾ ਨਾਮ',
        'text': 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਹਾਡਾ ਪੂਰਾ ਨਾਮ ਕੀ ਹੈ?',
        'sub': '(Hello! What is your full name?)',
      },
      {
        'id': 'age_gender',
        'label': 'ਸਵਾਲ 2 / 5 • ਉਮਰ ਅਤੇ ਲਿੰਗ',
        'text': 'ਤੁਹਾਡੀ ਉਮਰ ਕਿੰਨੀ ਹੈ ਅਤੇ ਤੁਹਾਡਾ ਲਿੰਗ (ਪੁਰਸ਼ / ਮਹਿਲਾ) ਕੀ ਹੈ?',
        'sub': '(What is your age and gender?)',
      },
      {
        'id': 'phone',
        'label': 'ਸਵਾਲ 3 / 5 • ਮੋਬਾਈਲ ਨੰਬਰ',
        'text': 'ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ 10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਦੱਸੋ।',
        'sub': '(Please provide your 10-digit mobile number.)',
      },
      {
        'id': 'complaint',
        'label': 'ਸਵਾਲ 4 / 5 • ਤਕਲੀਫ਼ ਅਤੇ ਸਮਾਂ',
        'text': 'ਤੁਹਾਨੂੰ ਕੀ ਤਕਲੀਫ਼ ਜਾਂ ਬਿਮਾਰੀ ਹੈ ਅਤੇ ਇਹ ਕਿੰਨੇ ਦਿਨਾਂ ਤੋਂ ਹੈ?',
        'sub': '(What health problem are you facing and for how many days?)',
      },
      {
        'id': 'history_allergies',
        'label': 'ਸਵਾਲ 5 / 5 • ਪੁਰਾਣੀ ਬਿਮਾਰੀ ਅਤੇ ਐਲਰਜੀ',
        'text': 'ਕੀ ਤੁਹਾਨੂੰ ਬੀਪੀ, ਸ਼ੂਗਰ ਜਾਂ ਦਮੇ ਵਰਗੀ ਕੋਈ ਬਿਮਾਰੀ ਹੈ? ਅਤੇ ਕਿਸੇ ਦਵਾਈ ਤੋਂ ਐਲਰਜੀ ਹੈ?',
        'sub': '(Do you have chronic conditions or drug allergies?)',
      },
    ],
    'or-IN': [
      {
        'id': 'name',
        'label': 'ପ୍ରଶ୍ନ ୧ / ୫ • ପୂରା ନାମ',
        'text': 'ନମସ୍କାର! ଆପଣଙ୍କ ପୂରା ନାମ କ’ଣ?',
        'sub': '(Hello! What is your full name?)',
      },
      {
        'id': 'age_gender',
        'label': 'ପ୍ରଶ୍ନ ୨ / ୫ • ବୟସ ଏବଂ ଲିଙ୍ଗ',
        'text': 'ଆପଣଙ୍କ ବୟସ କେତେ ଏବଂ ଆପଣଙ୍କ ଲିଙ୍ଗ (ପୁରୁଷ / ମହିଳା) କ’ଣ?',
        'sub': '(What is your age and gender?)',
      },
      {
        'id': 'phone',
        'label': 'ପ୍ରଶ୍ନ ୩ / ୫ • ମୋବାଇଲ୍ ନମ୍ବର',
        'text': 'ଦୟାକରି ଆପଣଙ୍କ ୧୦ ଅଙ୍କ ବିଶିଷ୍ଟ ମୋବାଇଲ୍ ନମ୍ବର କୁହନ୍ତୁ।',
        'sub': '(Please provide your 10-digit mobile number.)',
      },
      {
        'id': 'complaint',
        'label': 'ପ୍ରଶ୍ନ ୪ / ୫ • ରୋଗ ଏବଂ କାରଣ',
        'text': 'ଆପଣଙ୍କର କ’ଣ ସମସ୍ୟା ବା ରୋଗ ଅଛି ଏବଂ କେତେ ଦିନ ଧରି?',
        'sub': '(What health problem are you facing and for how many days?)',
      },
      {
        'id': 'history_allergies',
        'label': 'ପ୍ରଶ୍ନ ୫ / ୫ • ପୁରୁଣା ରୋଗ ଓ ଆଲର୍ଜି',
        'text': 'ଆପଣଙ୍କର ବିପି, ଡାଇବେଟିସ୍ କିମ୍ବା ଶ୍ୱାସକଷ୍ଟ ଅଛି କି? କୌଣସି ଔଷଧରୁ ଆଲର୍ଜି ଅଛି କି?',
        'sub': '(Do you have chronic conditions or drug allergies?)',
      },
    ],
  };

  @override
  void initState() {
    super.initState();
    _audio.init();
  }

  @override
  void dispose() {
    _audio.stopAudio();
    super.dispose();
  }

  List<Map<String, dynamic>> get _currentQuestions {
    return _questions[_selectedLanguage] ?? _questions['hi-IN']!;
  }

  void _selectLanguage(String langCode) {
    setState(() {
      _selectedLanguage = langCode;
      _formData['preferred_language'] = langCode;
      _currentStepStage = 1;
      _questionIndex = 0;
    });
    _playQuestionTts();
  }

  Future<void> _playQuestionTts() async {
    final q = _currentQuestions[_questionIndex];
    try {
      final audioUrl = await widget.api.synthesizeSpeech(
        q['text'],
        _selectedLanguage,
        voiceGender: 'female',
      );
      if (audioUrl != null && mounted) {
        await _audio.playAudioAndWait(audioUrl);
      }
    } catch (e) {
      debugPrint('[Onboarding] Intake TTS error: $e');
    }
  }

  Future<void> _handleAnswer(String answerText) async {
    final clean = answerText.trim();
    if (clean.isEmpty) return;

    final q = _currentQuestions[_questionIndex];
    setState(() {
      _isValidating = true;
      _validationAlert = null;
    });

    try {
      final valRes = await widget.api.validateIntakeAnswer(
        stepId: q['id'],
        questionText: q['text'],
        userUtterance: clean,
        language: _selectedLanguage,
      );

      final isValid = valRes['is_valid'] == true;
      if (!isValid) {
        final reprompt = valRes['reprompt_native'] ?? 'कृपया विचारलेल्या प्रश्नाचे उत्तर द्या.';
        setState(() {
          _validationAlert = reprompt;
          _isValidating = false;
        });

        // Speak reprompt in female voice
        final repromptAudio = await widget.api.synthesizeSpeech(reprompt, _selectedLanguage, voiceGender: 'female');
        if (repromptAudio != null) {
          await _audio.playAudio(repromptAudio);
        }
        return;
      }

      // Valid Answer
      final extracted = valRes['extracted_value']?.toString() ?? clean;
      final parsed = valRes['parsed_fields'] is Map ? Map<String, dynamic>.from(valRes['parsed_fields']) : {};

      setState(() {
        _textInputController.clear();
        final qId = q['id'];
        if (qId == 'name') {
          _formData['name'] = parsed['name'] ?? extracted;
        } else if (qId == 'age_gender') {
          _formData['age'] = parsed['age'] ?? int.tryParse(extracted.replaceAll(RegExp(r'\D'), ''));
          _formData['gender'] = parsed['gender'] ?? (extracted.toLowerCase().contains('fem') ? 'Female' : 'Male');
        } else if (qId == 'phone') {
          _formData['mobile_number'] = parsed['mobile_number'] ?? extracted.replaceAll(RegExp(r'\D'), '');
        } else if (qId == 'complaint') {
          _formData['chief_complaint'] = parsed['chief_complaint'] ?? extracted;
          _formData['symptoms_duration'] = parsed['symptoms_duration'] ?? '';
        } else if (qId == 'history_allergies') {
          _formData['past_medical_history'] = parsed['past_medical_history'] ?? extracted;
          _formData['known_allergies'] = parsed['known_allergies'] ?? 'None';
        }

        if (_questionIndex < _currentQuestions.length - 1) {
          _questionIndex++;
          _isValidating = false;
          _playQuestionTts();
        } else {
          _isValidating = false;
          _submitForm();
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isValidating = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Validation error: $e')),
      );
    }
  }

  Future<void> _submitForm() async {
    setState(() => _isValidating = true);
    try {
      final patient = await widget.api.createPatient(_formData);
      setState(() {
        _createdPatient = patient;
        _currentStepStage = 2; // Summary Stage
        _isValidating = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isValidating = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to save patient: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Patient Onboarding'),
        actions: [
          if (_currentStepStage == 1)
            TextButton(
              onPressed: _submitForm,
              child: const Text('Finish', style: TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.w700)),
            ),
        ],
      ),
      body: _buildCurrentStage(),
    );
  }

  Widget _buildCurrentStage() {
    if (_currentStepStage == 0) {
      return _buildLanguageBubbleStage();
    } else if (_currentStepStage == 1) {
      return _buildChatStage();
    } else {
      return _buildSummaryStage();
    }
  }

  // STAGE A: Floating Language Bubbles
  Widget _buildLanguageBubbleStage() {
    final bubbles = [
      {'code': 'hi-IN', 'name': 'हिन्दी', 'sub': 'Hindi'},
      {'code': 'mr-IN', 'name': 'मराठी', 'sub': 'Marathi'},
      {'code': 'en-IN', 'name': 'English', 'sub': 'Indian English'},
      {'code': 'gu-IN', 'name': 'ગુજરાતી', 'sub': 'Gujarati'},
      {'code': 'bn-IN', 'name': 'বাংলা', 'sub': 'Bengali'},
      {'code': 'ta-IN', 'name': 'தமிழ்', 'sub': 'Tamil'},
      {'code': 'te-IN', 'name': 'తెలుగు', 'sub': 'Telugu'},
      {'code': 'kn-IN', 'name': 'ಕನ್ನಡ', 'sub': 'Kannada'},
      {'code': 'ml-IN', 'name': 'മലയാളം', 'sub': 'Malayalam'},
      {'code': 'pa-IN', 'name': 'ਪੰਜਾਬੀ', 'sub': 'Punjabi'},
      {'code': 'or-IN', 'name': 'ଓଡ଼ିଆ', 'sub': 'Odia'},
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.greenLight,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.greenBorder),
            ),
            child: const Column(
              children: [
                Icon(Icons.record_voice_over, color: AppColors.primaryGreen, size: 36),
                SizedBox(height: 8),
                Text(
                  'अपनी भाषा चुनें • Select Language • आपली भाषा निवडा',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                ),
                SizedBox(height: 4),
                Text(
                  'Conversational AI intake assistant speaks in your selected language',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: AppColors.primaryGreen),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 12,
            runSpacing: 14,
            alignment: WrapAlignment.center,
            children: bubbles.map((b) {
              return InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: () => _selectLanguage(b['code']!),
                child: Container(
                  width: 140,
                  padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.greenBorder, width: 1.5),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primaryGreen.withValues(alpha: 0.08),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Text(
                        b['name']!,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        b['sub']!,
                        style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // STAGE B: Interactive Conversational Intake Chat + Autofilled Preview Card
  Widget _buildChatStage() {
    final q = _currentQuestions[_questionIndex];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Assistant Header Card
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.greenLight,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.greenBorder),
            ),
            child: Row(
              children: [
                const CircleAvatar(
                  backgroundColor: AppColors.primaryGreen,
                  radius: 16,
                  child: Icon(Icons.medical_services, color: Colors.white, size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Aarogya Mitra • आरोग्य मित्र',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                      ),
                      Text(
                        'Language: ${LanguageNames.getName(_selectedLanguage)} • ${_ui('female_voice')}',
                        style: const TextStyle(fontSize: 11, color: AppColors.primaryGreen),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => setState(() => _currentStepStage = 0),
                  child: Text(_ui('change_lang'), style: const TextStyle(fontSize: 11, color: AppColors.primaryGreen)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Question Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 3)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  q['label'] ?? '',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primaryGreen),
                ),
                const SizedBox(height: 8),
                Text(
                  q['text'] ?? '',
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.textMain),
                ),
                const SizedBox(height: 4),
                Text(
                  q['sub'] ?? '',
                  style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                ),
                const SizedBox(height: 12),

                // TTS Play & Wave Visualizer
                Row(
                  children: [
                    OutlinedButton.icon(
                      icon: const Icon(Icons.volume_up, size: 16),
                      label: Text(_ui('listen_aloud'), style: const TextStyle(fontSize: 12)),
                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6)),
                      onPressed: _playQuestionTts,
                    ),
                    const SizedBox(width: 12),
                    ListenableBuilder(
                      listenable: _audio,
                      builder: (context, _) => SoundwaveVisualizer(
                        isAnimating: _audio.isRecording || _audio.isPlaying,
                        height: 24,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Validation Alert
          if (_validationAlert != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.errorBg,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFECDD3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: AppColors.errorRed, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _validationAlert!,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.errorRed),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],


          // Recording Feedback Indicator
          ListenableBuilder(
            listenable: _audio,
            builder: (context, _) {
              if (_audio.isRecording) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFEE2E2),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFFECACA)),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.fiber_manual_record, color: AppColors.errorRed, size: 10),
                      const SizedBox(width: 6),
                      Text(
                        _ui('recording_hint'),
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.errorRed),
                      ),
                    ],
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),

          // Voice / Text Input Row
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                ListenableBuilder(
                  listenable: _audio,
                  builder: (context, _) {
                    final isRec = _audio.isRecording;
                    return InkWell(
                      onTap: () async {
                        if (isRec) {
                          final bytes = await _audio.stopRecording();
                          if (bytes != null && bytes.isNotEmpty) {
                            setState(() => _isValidating = true);
                            try {
                              final text = await widget.api.transcribeAudio(bytes, _selectedLanguage);
                              _handleAnswer(text);
                            } catch (e) {
                              setState(() => _isValidating = false);
                              if (mounted) {
                                ScaffoldMessenger.of(this.context).showSnackBar(SnackBar(content: Text('Transcription error: $e')));
                              }
                            }
                          }
                        } else {
                          await _audio.startRecording();
                        }
                      },
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: isRec ? AppColors.errorRed : AppColors.primaryGreen,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(isRec ? Icons.stop : Icons.mic, color: Colors.white, size: 22),
                      ),
                    );
                  },
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _textInputController,
                    decoration: InputDecoration(
                      hintText: _ui('input_hint'),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                    onSubmitted: (val) => _handleAnswer(val),
                  ),
                ),
                const SizedBox(width: 8),
                if (_isValidating)
                  const SizedBox(
                    width: 28,
                    height: 28,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primaryGreen),
                  )
                else
                  IconButton(
                    icon: const Icon(Icons.send, color: AppColors.primaryGreen),
                    onPressed: () => _handleAnswer(_textInputController.text),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Live Autofilled Form Preview Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.assignment_turned_in, color: AppColors.primaryGreen, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      _ui('autofill_title'),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _formFieldRow(_ui('name'), _formData['name']),
                _formFieldRow(_ui('age_gender'), _formData['age'] != null ? "${_formData['age']} yrs • ${_formData['gender']}" : ''),
                _formFieldRow(_ui('phone'), _formData['mobile_number']),
                _formFieldRow(_ui('complaint'), _formData['chief_complaint']),
                _formFieldRow(_ui('history'), _formData['past_medical_history']),
                _formFieldRow(_ui('allergies'), _formData['known_allergies']),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _formFieldRow(String label, dynamic value) {
    final valStr = value?.toString() ?? '';
    final hasVal = valStr.trim().isNotEmpty;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
          const SizedBox(height: 2),
          Text(
            hasVal ? valStr : _ui('pending'),
            style: TextStyle(
              fontSize: 13,
              fontWeight: hasVal ? FontWeight.w700 : FontWeight.w500,
              color: hasVal ? AppColors.textMain : AppColors.textMuted.withValues(alpha: 0.6),
            ),
          ),
        ],
      ),
    );
  }

  // STAGE C: Pre-Consultation Summary Card
  Widget _buildSummaryStage() {
    final p = _createdPatient!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.greenBorder, width: 1.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppColors.primaryGreen,
                      radius: 24,
                      child: const Icon(Icons.person, color: Colors.white, size: 26),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(p.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                          Text('${p.age ?? ""} yrs • ${p.gender ?? ""} • ${p.mobileNumber}', style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.greenSubtle,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.greenBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Clinical Triage Briefing',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        p.intakeSummaryEnglish ?? p.chiefComplaint ?? 'Patient completed pre-consultation intake.',
                        style: const TextStyle(fontSize: 13, color: Color(0xFF166534), height: 1.4),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                _formFieldRow('Chief Complaint', p.chiefComplaint),
                _formFieldRow('Medical History', p.pastMedicalHistory),
                _formFieldRow('Known Allergies', p.knownAllergies),
              ],
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            icon: const Icon(Icons.play_arrow),
            label: const Text('Start Doctor Consultation'),
            style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16)),
            onPressed: () {
              Navigator.pushReplacement(
                context,
                MaterialPageRoute(
                  builder: (context) => ConsultationScreen(
                    api: widget.api,
                    doctor: widget.doctor,
                    patient: p,
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Return to Dashboard'),
          ),
        ],
      ),
    );
  }
}

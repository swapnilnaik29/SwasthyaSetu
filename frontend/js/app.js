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
  'hi-IN': 'Hindi (हिन्दी)',
  'mr-IN': 'Marathi (मराठी)',
  'gu-IN': 'Gujarati (ગુજરાતી)',
  'bn-IN': 'Bengali (বাংলা)',
  'ta-IN': 'Tamil (தமிழ்)',
  'te-IN': 'Telugu (తెలుగు)',
  'kn-IN': 'Kannada (ಕನ್ನಡ)',
  'ml-IN': 'Malayalam (മലയാളം)',
  'pa-IN': 'Punjabi (ਪੰਜਾਬੀ)',
  'or-IN': 'Odia (ଓଡ଼ିଆ)',
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

// Navigation Helper
function showView(viewName) {
  Object.keys(views).forEach(key => {
    if (views[key]) {
      views[key].classList.remove('active');
    }
  });
  if (views[viewName]) {
    views[viewName].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const health = await window.api.checkHealth();
    if (banner) banner.classList.remove('disconnected');
    if (statusText) statusText.textContent = `Connected to Backend (${health.database || 'SQLite WAL'}) • LAN: ${health.server_lan_ip || 'Active'}`;
  } catch (err) {
    if (banner) banner.classList.add('disconnected');
    if (statusText) statusText.textContent = `Backend Disconnected (${window.api.getBaseUrl()}) — Tap Configure to set LAN IP`;
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

    if (nameEl) nameEl.textContent = doc.name;
    if (credsEl) credsEl.textContent = doc.credentials;
    if (langEl) langEl.textContent = `Primary: ${LANG_LABELS[doc.preferred_language] || doc.preferred_language}`;

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
    const history = await window.api.getPatientConsultations(patientId);
    if (countBadge) countBadge.textContent = `${history.length} past visits`;

    if (!container) return;

    if (history.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 13px;">
          No previous consultations recorded for this patient.
        </div>
      `;
      return;
    }

    container.innerHTML = history.map(c => {
      const dateStr = new Date(c.started_at).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      const isCompleted = c.status === 'COMPLETED';
      const isAmbient = c.mode === 'AMBIENT_BACKGROUND';
      return `
        <div class="patient-card" style="cursor: default;">
          <div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <h4 style="font-size: 14px; font-weight: 700;">${dateStr}</h4>
              ${isAmbient ? '<span class="badge-chip badge-ambient" style="font-size: 9px;"><i class="fa-solid fa-microphone-lines"></i> Ambient Scribe</span>' : ''}
            </div>
            <p style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
              Doctor: ${c.doctor_language} ↔ Patient: ${c.patient_language}
            </p>
          </div>
          <span class="badge-chip" style="background: ${isCompleted ? 'var(--success-light)' : 'var(--warning-light)'}; color: ${isCompleted ? 'var(--success-green)' : 'var(--warning-amber)'}; font-size: 10px;">
            ${c.status}
          </span>
        </div>
      `;
    }).join('');
  } catch (err) {
    if (container) container.innerHTML = `<p style="color: var(--error-red);">Failed to load history</p>`;
  }
}

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
      el.textContent = 'Pending response...';
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

  // 2. Pause briefly so speaker output clears before opening mic
  await new Promise(r => setTimeout(r, 350));

  // 3. Automatically open microphone after TTS and listen for user response
  startAutoListening();
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

// Automatic Microphone Listening Loop (Speech-to-Speech)
async function startAutoListening() {
  const micBtn = document.getElementById('btn-intake-mic');
  const micStatus = document.getElementById('intake-mic-status');
  const recTimer = document.getElementById('intake-rec-timer');

  if (window.audioManager.isPlaying) return;

  if (micStatus) {
    micStatus.innerHTML = `<span style="color: var(--success-green); font-weight: 800;">🎙️ ऐकत आहे... (Listening... Speak your answer now)</span>`;
  }
  if (micBtn) micBtn.classList.add('recording');
  if (recTimer) {
    recTimer.style.display = 'inline-block';
    recTimer.textContent = '00:00';
  }

  // Setup real-time VAD callbacks
  window.audioManager.onSpeechStart = () => {
    if (micStatus) micStatus.innerHTML = `<span style="color: var(--primary-teal); font-weight: 800;">🗣️ बोलणे चालू आहे... (Speaking detected...)</span>`;
  };

  window.audioManager.onSilenceDetected = async () => {
    console.log('[SwasthyaSetu] Long pause detected after speech. Auto-stopping and transcribing...');
    await processAutoVoiceIntake();
  };

  window.audioManager.onIdleTimeout = () => {
    if (micStatus) micStatus.textContent = 'माईक थांबला. बोलण्यासाठी माईक टॅप करा (Tap mic to speak)';
    if (micBtn) micBtn.classList.remove('recording');
    if (recTimer) recTimer.style.display = 'none';
    window.audioManager.stopRecording();
  };

  await window.audioManager.startRecording({
    vad: true,
    speechThreshold: 0.015,
    silenceDurationMs: 1800, // 1.8 seconds long pause triggers auto stop and transcribe
    maxIdleMs: 12000,
  });
}

// Intake Voice Recording Toggle (Manual fallback)
async function toggleIntakeVoiceRecording() {
  if (window.audioManager.isRecording) {
    await processAutoVoiceIntake();
  } else {
    await startAutoListening();
  }
}

async function processAutoVoiceIntake() {
  const micBtn = document.getElementById('btn-intake-mic');
  const micStatus = document.getElementById('intake-mic-status');
  const recTimer = document.getElementById('intake-rec-timer');

  if (micStatus) micStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Transcribing & validating with AI...`;
  if (micBtn) micBtn.classList.remove('recording');
  if (recTimer) recTimer.style.display = 'none';

  const audioBlob = await window.audioManager.stopRecording();
  if (!audioBlob) {
    if (micStatus) micStatus.textContent = 'कोणताही आवाज आला नाही. कृपया पुन्हा बोला. (Tap mic to speak)';
    return;
  }

  try {
    const result = await window.api.transcribeAudio(audioBlob, onboardingState.selectedLanguage);
    if (result && result.transcript && result.transcript.trim()) {
      const inputEl = document.getElementById('input-intake-text');
      if (inputEl) inputEl.value = result.transcript;
      await handleIntakeAnswer(result.transcript);
    } else {
      if (micStatus) micStatus.textContent = 'काहीही आवाज ऐकू आला नाही. कृपया पुन्हा बोला.';
      // Re-prompt user to speak
      await new Promise(r => setTimeout(r, 400));
      startAutoListening();
    }
  } catch (err) {
    if (micStatus) micStatus.textContent = 'STT error: ' + err.message;
  }
}

// Process and Validate Answer with AI (GPT-6 Luna)
async function handleIntakeAnswer(answer) {
  const clean = (answer || '').trim();
  if (!clean) return;

  const questions = getQuestionsForLanguage(onboardingState.selectedLanguage);
  const q = questions[onboardingState.currentStep];
  if (!q) return;

  const micStatus = document.getElementById('intake-mic-status');
  const submitBtn = document.getElementById('btn-submit-intake-text');
  const alertBanner = document.getElementById('intake-validation-alert');
  const alertText = document.getElementById('intake-validation-text');

  if (micStatus) micStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> AI तपासत आहे... (AI validating answer...)`;
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
      await new Promise(r => setTimeout(r, 350));

      // Automatically re-open mic to let patient answer the question properly!
      startAutoListening();
      return;
    }

    // CASE 2: VALID ANSWER!
    if (alertBanner) alertBanner.style.display = 'none';

    const extracted = (valResult.extracted_value || clean).trim();
    const parsed = valResult.parsed_fields || {};

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
        const reprompt = !ageVal 
          ? (onboardingState.selectedLanguage.includes('mr') ? 'कृपया आपले वय सांगा.' : 'कृपया अपनी उम्र बताइए।')
          : (onboardingState.selectedLanguage.includes('mr') ? 'कृपया आपले लिंग (पुरुष किंवा स्त्री) सांगा.' : 'कृपया अपना लिंग (पुरुष या महिला) बताइए।');
        
        if (alertBanner && alertText) {
          alertText.textContent = reprompt;
          alertBanner.style.display = 'flex';
        }
        await playIntakeQuestionTTS(reprompt, onboardingState.selectedLanguage);
        await new Promise(r => setTimeout(r, 350));
        startAutoListening();
        return;
      }

      onboardingState.data.age = ageVal;
      onboardingState.data.gender = genderVal;
      updateAutofillField('item-age', 'field-preview-age-gender', `${ageVal} yrs • ${genderVal}`);
    } else if (q.id === 'phone') {
      const phoneDigits = parsed.mobile_number || extracted.replace(/\D/g, '');
      const phoneClean = phoneDigits.length >= 10 ? phoneDigits.slice(-10) : '';
      if (!phoneClean || phoneClean.length < 10) {
        const reprompt = onboardingState.selectedLanguage.includes('mr') ? 'कृपया वैध १० अंकी मोबाईल नंबर सांगा.' : 'कृपया 10 अंकों का वैध मोबाइल नंबर बताइए।';
        if (alertBanner && alertText) {
          alertText.textContent = reprompt;
          alertBanner.style.display = 'flex';
        }
        await playIntakeQuestionTTS(reprompt, onboardingState.selectedLanguage);
        await new Promise(r => setTimeout(r, 350));
        startAutoListening();
        return;
      }
      onboardingState.data.mobile_number = phoneClean;
      updateAutofillField('item-phone', 'field-preview-phone', phoneClean);
    } else if (q.id === 'complaint') {
      const compVal = parsed.chief_complaint || extracted;
      const durVal = parsed.symptoms_duration || '';
      onboardingState.data.chief_complaint = compVal;
      onboardingState.data.symptoms_duration = durVal;
      updateAutofillField('item-complaint', 'field-preview-complaint', compVal);
    } else if (q.id === 'history_allergies') {
      const histVal = parsed.past_medical_history || extracted;
      const allVal = parsed.known_allergies || '';
      onboardingState.data.past_medical_history = histVal;
      onboardingState.data.known_allergies = allVal;
      updateAutofillField('item-history', 'field-preview-history', histVal);
      updateAutofillField('item-allergies', 'field-preview-allergies', allVal);
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
    finishBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Canonicalizing with GPT-6 Luna...`;
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
  if (langEl) langEl.textContent = `${langName} [${patient.preferred_language}]`;

  if (briefEl) briefEl.textContent = patient.intake_summary_english || 'Patient completed conversational voice intake. Symptoms and history converted to canonical medical English.';
  if (compEl) compEl.textContent = patient.chief_complaint || 'General medical examination';
  if (durEl) durEl.textContent = patient.symptoms_duration || 'Not specified';
  if (histEl) histEl.textContent = patient.past_medical_history || 'No prior chronic conditions recorded';
  if (allEl) allEl.textContent = patient.known_allergies || 'No known drug allergies';
}

/* ==========================================================================
   SHARED LANGUAGE DETECTION & CONSULTATION MODES
   ========================================================================== */

function checkSharedLanguage(patientLang, doctor) {
  if (!doctor) return { isShared: false };

  const doctorPrimary = doctor.preferred_language || 'en-IN';
  const spokenList = (doctor.spoken_languages || 'en-IN,mr-IN,hi-IN')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean);

  const pLangClean = (patientLang || '').trim().toLowerCase();

  const isShared = (pLangClean === doctorPrimary.toLowerCase()) || spokenList.includes(pLangClean);
  return {
    isShared,
    sharedLangCode: patientLang,
    sharedLangLabel: LANG_LABELS[patientLang] || patientLang,
  };
}

// Start Consultation Entry Point
function initiateConsultationStart() {
  if (!state.selectedPatient) return;

  const patientLang = state.selectedPatient.preferred_language || 'hi-IN';
  const sharedInfo = checkSharedLanguage(patientLang, state.doctor);

  if (sharedInfo.isShared) {
    const modalShared = document.getElementById('modal-shared-lang-name');
    if (modalShared) modalShared.textContent = sharedInfo.sharedLangLabel;
    openModal('modal-mode-select');
  } else {
    startConsultationWithMode('NORMAL');
  }
}

// Start Consultation with Chosen Mode
async function startConsultationWithMode(mode = 'NORMAL') {
  closeModal('modal-mode-select');

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
      mode
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

    const ambientBanner = document.getElementById('ambient-mode-banner');
    if (ambientBanner) {
      ambientBanner.style.display = (mode === 'AMBIENT_BACKGROUND') ? 'flex' : 'none';
    }

    switchSpeaker('PATIENT');
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
  const isAmbient = state.activeConsultation && state.activeConsultation.mode === 'AMBIENT_BACKGROUND';

  const btnPatient = document.getElementById('btn-speaker-patient');
  const btnDoctor = document.getElementById('btn-speaker-doctor');
  const turnBanner = document.getElementById('turn-direction-banner');
  const turnText = document.getElementById('turn-direction-text');

  const pLang = state.activeConsultation ? state.activeConsultation.patient_language : 'hi-IN';
  const dLang = state.activeConsultation ? state.activeConsultation.doctor_language : 'en-IN';

  if (isPatient) {
    if (btnPatient) btnPatient.classList.add('active');
    if (btnDoctor) btnDoctor.classList.remove('active');
    if (turnBanner) turnBanner.className = 'turn-direction-banner patient-turn';
    if (turnText) {
      if (isAmbient) {
        turnText.textContent = `Patient Speaking (${LANG_LABELS[pLang] || pLang}) • App logging English clinical notes`;
      } else {
        turnText.textContent = `Patient Speaks (${LANG_LABELS[pLang] || pLang}) ➔ Doctor Listens (${LANG_LABELS[dLang] || dLang})`;
      }
    }
  } else {
    if (btnPatient) btnPatient.classList.remove('active');
    if (btnDoctor) btnDoctor.classList.add('active');
    if (turnBanner) turnBanner.className = 'turn-direction-banner doctor-turn';
    if (turnText) {
      if (isAmbient) {
        turnText.textContent = `Doctor Speaking (${LANG_LABELS[dLang] || dLang}) • App logging English clinical notes`;
      } else {
        turnText.textContent = `Doctor Speaks (${LANG_LABELS[dLang] || dLang}) ➔ Patient Listens (${LANG_LABELS[pLang] || pLang} Male Voice)`;
      }
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

  const isPatient = state.activeSpeaker === 'PATIENT';
  const isAmbient = state.activeConsultation.mode === 'AMBIENT_BACKGROUND';
  const sourceLang = isPatient ? state.activeConsultation.patient_language : state.activeConsultation.doctor_language;
  const targetLang = isPatient ? state.activeConsultation.doctor_language : state.activeConsultation.patient_language;

  setProcessing(true, isAmbient ? 'Background Scribe: Transcribing & indexing clinical record...' : 'Transcribing with Gnani AI & translating with GPT-6 Luna...');

  try {
    const result = await window.api.processAudioTurn(
      state.activeConsultation.id,
      state.activeSpeaker,
      sourceLang,
      targetLang,
      audioBlob
    );

    appendTurn(result);

    // Auto-play synthesized audio for recipient ONLY in Normal mode (Ambient mode skips TTS)
    if (!isAmbient && result.audio_url) {
      const fullUrl = window.api.resolveAudioUrl(result.audio_url);
      window.audioManager.playAudio(fullUrl);
    }

    promptTurnHandoff();
  } catch (err) {
    alert('Turn processing failed: ' + err.message);
  } finally {
    setProcessing(false);
  }
}

async function processTextTurn(text) {
  if (!state.activeConsultation || !text.trim()) return;

  const isPatient = state.activeSpeaker === 'PATIENT';
  const isAmbient = state.activeConsultation.mode === 'AMBIENT_BACKGROUND';
  const sourceLang = isPatient ? state.activeConsultation.patient_language : state.activeConsultation.doctor_language;
  const targetLang = isPatient ? state.activeConsultation.doctor_language : state.activeConsultation.patient_language;

  setProcessing(true, 'Translating with GPT-6 Luna & querying translation cache...');

  try {
    const result = await window.api.processTextTurn(
      state.activeConsultation.id,
      state.activeSpeaker,
      sourceLang,
      targetLang,
      text.trim()
    );

    appendTurn(result);

    if (!isAmbient && result.audio_url) {
      const fullUrl = window.api.resolveAudioUrl(result.audio_url);
      window.audioManager.playAudio(fullUrl);
    }

    promptTurnHandoff();
  } catch (err) {
    alert('Turn processing error: ' + err.message);
  } finally {
    setProcessing(false);
  }
}

function promptTurnHandoff() {
  if (state.activeSpeaker === 'PATIENT') {
    switchSpeaker('DOCTOR');
  } else {
    switchSpeaker('PATIENT');
  }
}

function setProcessing(isProcessing, message = 'Processing speech turn...') {
  state.isProcessing = isProcessing;
  const banner = document.getElementById('turn-processing-banner');
  const bannerText = document.getElementById('turn-processing-text');
  const recordBtn = document.getElementById('btn-record-turn');

  if (banner) banner.style.display = isProcessing ? 'flex' : 'none';
  if (bannerText) bannerText.textContent = message;
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
    const isAmbient = state.activeConsultation && state.activeConsultation.mode === 'AMBIENT_BACKGROUND';
    container.innerHTML = `
      <div style="text-align: center; padding: 48px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-${isAmbient ? 'microphone-lines' : 'microphone-slash'}" style="font-size: 42px; margin-bottom: 12px; color: #cbd5e1;"></i>
        <h4 style="font-size: 15px; font-weight: 700; color: #475569;">${isAmbient ? 'Background Scribe Ready' : 'No speech recorded yet'}</h4>
        <p style="font-size: 12px; margin-top: 4px;">${isAmbient ? 'Tap the record button to speak naturally in your shared language.' : 'Select active speaker above, then tap the record button to speak.'}</p>
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
   DRAFT MEDICAL RECORD GENERATION & REVIEW
   ========================================================================== */

async function loadDraftReview() {
  if (!state.activeConsultation) return;

  const reviewBtn = document.getElementById('btn-review-draft');
  if (reviewBtn) {
    reviewBtn.disabled = true;
    reviewBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating...`;
  }

  try {
    const draft = await window.api.generateDraft(state.activeConsultation.id);
    state.draft = draft;

    renderDraftReview(draft);
    showView('draftReview');
  } catch (err) {
    alert('Failed to generate draft: ' + err.message);
  } finally {
    if (reviewBtn) {
      reviewBtn.disabled = false;
      reviewBtn.innerHTML = `<i class="fa-solid fa-clipboard-check"></i> Review Draft & Report`;
    }
  }
}

function renderDraftReview(draft) {
  const payload = draft.structured_payload || {};

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

  renderPrescriptions(payload.prescriptions || []);
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
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Finalizing Official Record...`;
  }

  try {
    const payload = state.draft.structured_payload || {};
    const diagInput = document.getElementById('draft-diagnosis');
    if (diagInput) payload.doctor_diagnosis = diagInput.value.trim();

    const notesInput = document.getElementById('draft-notes');
    if (notesInput) payload.doctor_notes = notesInput.value.trim();

    await window.api.updateDraft(state.activeConsultation.id, payload);
    await window.api.approveDraft(state.activeConsultation.id);

    // Set default follow-up 3 days later
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    const dateInput = document.getElementById('followup-date');
    if (dateInput) {
      dateInput.value = nextDate.toISOString().slice(0, 10);
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
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Scheduling...`;
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

  // Mode Selection Modal Choices
  on('opt-mode-ambient', 'click', () => startConsultationWithMode('AMBIENT_BACKGROUND'));
  on('opt-mode-normal', 'click', () => startConsultationWithMode('NORMAL'));

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

  // Scripted Demo Presets
  on('btn-open-presets', 'click', () => {
    const isPatient = state.activeSpeaker === 'PATIENT';
    const patientPresets = [
      'Mujhe three days se fever hai aur headache bhi hai.',
      'Mala teen divasapasun taap aani dukhane ahe.',
      'I have severe stomach ache since yesterday morning.',
    ];
    const doctorPresets = [
      'Take paracetamol 500mg twice daily after meals for three days.',
      'तुम्हाला किती दिवसांपासून ताप येत आहे?',
      'Drink plenty of warm water and take complete bed rest.',
    ];
    const presets = isPatient ? patientPresets : doctorPresets;

    const listContainer = document.getElementById('presets-list-container');
    if (listContainer) {
      listContainer.innerHTML = presets.map(p => `
        <button class="btn btn-outline" style="text-align: left; justify-content: flex-start; font-size: 13px;" onclick="selectPreset('${p.replace(/'/g, "\\'")}')">
          <i class="fa-solid fa-comment-dots"></i> "${p}"
        </button>
      `).join('');
    }

    const modalTitle = document.getElementById('modal-presets-title');
    if (modalTitle) modalTitle.textContent = `Demo Presets (${isPatient ? 'Patient' : 'Doctor'})`;
    openModal('modal-presets');
  });

  window.selectPreset = function(phrase) {
    closeModal('modal-presets');
    processTextTurn(phrase);
  };

  // Review Draft Button
  on('btn-review-draft', 'click', loadDraftReview);

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

// Audio Callbacks for Single-Device Echo Management & Timer
function setupAudioCallbacks() {
  const recordInstruction = document.getElementById('record-instruction');
  const recordTimer = document.getElementById('record-timer');
  const timerDisplay = document.getElementById('timer-display');
  const recordBtn = document.getElementById('btn-record-turn');
  const intakeTimer = document.getElementById('intake-rec-timer');

  window.audioManager.onStateChange = ({ isRecording, isPlaying }) => {
    if (isPlaying) {
      if (recordBtn) recordBtn.disabled = true;
      if (recordInstruction) recordInstruction.textContent = 'TTS PLAYING — AUDIO PLAYBACK ACTIVE';
    } else {
      if (recordBtn) recordBtn.disabled = false;
      if (isRecording) {
        if (recordBtn) recordBtn.classList.add('recording');
        if (recordTimer) recordTimer.style.display = 'flex';
        if (recordInstruction) recordInstruction.textContent = 'Recording in progress... Tap mic to finish turn';
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

/**
 * SwasthyaSetu Main Application Controller
 * Handles Conversational AI Onboarding, Floating Bubble UI,
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
      text: 'आपकी उम्र कितनी है और आपका लिंग (पुरुष / महिला / अन्य) क्या है?',
      sub: '(What is your age and gender?)',
      chips: ['35 वर्ष, पुरुष', '28 वर्ष, महिला', '45 वर्ष, पुरुष', '52 वर्ष, महिला'],
    },
    {
      id: 'phone',
      label: 'Question 3 of 5 • Mobile Phone Number',
      text: 'कृपया अपना 10 अंकों का मोबाइल फोन नंबर बताइए।',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: ['9876543210', '9820012345', '9123456789'],
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
      text: 'तुमचे वय किती आहे आणि लिंग (पुरुष / स्त्री / इतर) काय आहे?',
      sub: '(What is your age and gender?)',
      chips: ['35 वर्षे, पुरुष', '28 वर्षे, स्त्री', '45 वर्षे, पुरुष', '52 वर्षे, स्त्री'],
    },
    {
      id: 'phone',
      label: 'प्रश्न ३ / ५ • मोबाईल नंबर',
      text: 'कृपया आपला १० अंकी मोबाईल नंबर सांगा.',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: ['9876543210', '9820012345', '9123456789'],
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
      text: 'What is your age and gender (Male / Female / Other)?',
      sub: '(e.g., 35, Male or 28, Female)',
      chips: ['35, Male', '28, Female', '45, Male', '52, Female'],
    },
    {
      id: 'phone',
      label: 'Question 3 of 5 • Mobile Phone Number',
      text: 'Please provide your 10-digit mobile phone number.',
      sub: '(Used for clinic registration and consultation records)',
      chips: ['9876543210', '9820012345', '9123456789'],
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
      text: 'તમારી ઉંમર કેટલી છે અને તમારું લિંગ (પુરુષ / સ્ત્રી / અન્ય) શું છે?',
      sub: '(What is your age and gender?)',
      chips: ['35 વર્ષ, પુરુષ', '28 વર્ષ, સ્ત્રી', '45 વર્ષ, પુરુષ'],
    },
    {
      id: 'phone',
      label: 'પ્રશ્ન ૩ / ૫ • મોબાઇલ નંબર',
      text: 'કૃપા કરીને તમારો ૧૦ અંકનો મોબાઈલ નંબર જણાવો.',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: ['9876543210', '9820012345'],
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
      text: 'আপনার বয়স কত এবং লিঙ্গ (পুরুষ / মহিলা / অন্য) কি?',
      sub: '(What is your age and gender?)',
      chips: ['৩৫ বছর, পুরুষ', '২৮ বছর, মহিলা', '৪৫ বছর, পুরুষ'],
    },
    {
      id: 'phone',
      label: 'প্রশ্ন ৩ / ৫ • মোবাইল নম্বর',
      text: 'দয়া করে আপনার ১০ সংখ্যার মোবাইল ফোন নম্বরটি বলুন।',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: ['9876543210', '9820012345'],
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
      text: 'உங்கள் வயது மற்றும் பாலினம் (ஆண் / பெண் / பிற) என்ன?',
      sub: '(What is your age and gender?)',
      chips: ['35 வயது, ஆண்', '28 வயது, பெண்', '45 வயது, ஆண்'],
    },
    {
      id: 'phone',
      label: 'கேள்வி 3 / 5 • தொலைபேசி எண்',
      text: 'தயவுசெய்து உங்கள் 10 இலக்க மொபைல் எண்ணைக் கூறவும்.',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: ['9876543210', '9820012345'],
    },
    {
      id: 'complaint',
      label: 'கேள்வி 4 / 5 • உடல்நலக் கோளாறு',
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
      text: 'మీ వయస్సు ఎంత మరియు మీ లింగం (పురుషుడు / స్త్రీ / ఇతర) ఏమిటి?',
      sub: '(What is your age and gender?)',
      chips: ['35 సంవత్సరాలు, పురుషుడు', '28 సంవత్సరాలు, స్త్రీ'],
    },
    {
      id: 'phone',
      label: 'ప్రశ్న 3 / 5 • మొబైల్ నంబర్',
      text: 'దయచేసి మీ 10 అంకెల మొబైల్ ఫోన్ నంబర్‌ను తెలపండి.',
      sub: '(Please provide your 10-digit mobile phone number.)',
      chips: ['9876543210', '9820012345'],
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

// Fallback generator for other languages (kn, ml, pa, or) using English/Hindi template
function getQuestionsForLanguage(lang) {
  if (ONBOARDING_QUESTIONS[lang]) {
    return ONBOARDING_QUESTIONS[lang];
  }
  const base = ONBOARDING_QUESTIONS['hi-IN'] || ONBOARDING_QUESTIONS['en-IN'];
  return base;
}

// DOM Elements
const views = {
  dashboard: document.getElementById('view-dashboard'),
  onboard: document.getElementById('view-onboard-patient'),
  patientDetail: document.getElementById('view-patient-detail'),
  consultation: document.getElementById('view-consultation'),
  draftReview: document.getElementById('view-draft-review'),
  approval: document.getElementById('view-approval'),
};

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
  setupEventListeners();
  setupAudioCallbacks();
  setupBubbleLanguageSelector();
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
    banner.classList.remove('disconnected');
    statusText.textContent = `Connected to Backend (${health.database || 'SQLite WAL'}) • LAN: ${health.server_lan_ip || 'Active'}`;
  } catch (err) {
    banner.classList.add('disconnected');
    statusText.textContent = `Backend Disconnected (${window.api.getBaseUrl()}) — Tap Configure to set LAN IP`;
  }
}

// Load Doctor Settings
async function loadDoctorSettings() {
  try {
    const doc = await window.api.getDoctorSettings();
    state.doctor = doc;
    document.getElementById('dash-doctor-name').textContent = doc.name;
    document.getElementById('dash-doctor-creds').textContent = doc.credentials;
    document.getElementById('dash-doctor-lang').textContent = `Primary: ${LANG_LABELS[doc.preferred_language] || doc.preferred_language}`;

    // Spoken languages display
    const spokenCodes = (doc.spoken_languages || 'en-IN,mr-IN,hi-IN').split(',').map(s => s.trim()).filter(Boolean);
    const spokenNames = spokenCodes.map(code => LANG_LABELS[code] ? LANG_LABELS[code].split(' ')[0] : code).join(', ');
    const spokenEl = document.getElementById('dash-doctor-spoken');
    if (spokenEl) {
      spokenEl.querySelector('span').textContent = `Speaks: ${spokenNames || 'English, Marathi, Hindi'}`;
    }

    // Fill settings modal inputs
    document.getElementById('setting-doc-name').value = doc.name;
    document.getElementById('setting-doc-creds').value = doc.credentials;
    document.getElementById('setting-doc-lang').value = doc.preferred_language;
    document.getElementById('setting-api-url').value = window.api.getBaseUrl();

    // Check checkboxes in settings modal
    const spokenSet = new Set(spokenCodes);
    document.querySelectorAll('#spoken-languages-chips input[type="checkbox"]').forEach(cb => {
      cb.checked = spokenSet.has(cb.value);
      cb.parentElement.classList.toggle('selected', cb.checked);
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
  countBadge.textContent = `${patients.length} registered`;

  if (patients.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 36px 20px; color: var(--text-muted);">
        <i class="fa-solid fa-users-slash" style="font-size: 38px; margin-bottom: 10px; color: #cbd5e1;"></i>
        <p style="font-weight: 600;">No patients registered yet</p>
        <p style="font-size: 12px; margin-top: 4px;">Click "+ Onboard Patient" to start interactive AI intake.</p>
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

    document.getElementById('detail-patient-name').textContent = patient.name;
    document.getElementById('card-patient-name').textContent = patient.name;
    document.getElementById('card-patient-meta').textContent = `${patient.age ? patient.age + ' years • ' : ''}${patient.gender ? patient.gender + ' • ' : ''}${patient.mobile_number}`;
    
    const langBadge = document.getElementById('card-patient-lang');
    langBadge.textContent = LANG_LABELS[patient.preferred_language] || patient.preferred_language;
    langBadge.className = `badge-chip ${patient.preferred_language.includes('hi') ? 'badge-hi' : (patient.preferred_language.includes('mr') ? 'badge-mr' : 'badge-en')}`;

    // Show pre-consultation summary if present
    const intakeBox = document.getElementById('card-patient-intake-box');
    const intakeText = document.getElementById('card-patient-intake-text');
    if (patient.intake_summary_english) {
      intakeBox.style.display = 'block';
      intakeText.textContent = patient.intake_summary_english;
    } else {
      intakeBox.style.display = 'none';
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
    countBadge.textContent = `${history.length} past visits`;

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
    container.innerHTML = `<p style="color: var(--error-red);">Failed to load history</p>`;
  }
}

/* ==========================================================================
   CONVERSATIONAL AI ONBOARDING & FLOATING BUBBLE UI
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

  // Reset live autofill display
  document.getElementById('field-preview-name').textContent = 'Pending response...';
  document.getElementById('field-preview-name').classList.add('placeholder');
  document.getElementById('field-preview-age-gender').textContent = 'Pending response...';
  document.getElementById('field-preview-age-gender').classList.add('placeholder');
  document.getElementById('field-preview-phone').textContent = 'Pending response...';
  document.getElementById('field-preview-phone').classList.add('placeholder');
  document.getElementById('field-preview-complaint').textContent = 'Pending response...';
  document.getElementById('field-preview-complaint').classList.add('placeholder');
  document.getElementById('field-preview-history').textContent = 'Pending response...';
  document.getElementById('field-preview-history').classList.add('placeholder');
  document.getElementById('field-preview-allergies').textContent = 'Pending response...';
  document.getElementById('field-preview-allergies').classList.add('placeholder');

  // Show Step A (Language Selector) and hide others
  document.getElementById('onboard-step-language').style.display = 'flex';
  document.getElementById('onboard-step-chat').style.display = 'none';
  document.getElementById('onboard-step-summary').style.display = 'none';

  showView('onboard');
}

function setupBubbleLanguageSelector() {
  const bubbles = document.querySelectorAll('.lang-bubble');
  bubbles.forEach(bubble => {
    bubble.addEventListener('click', () => {
      const langCode = bubble.getAttribute('data-lang');
      const langName = bubble.getAttribute('data-name');
      const langNative = bubble.getAttribute('data-native');
      selectOnboardingLanguage(langCode, `${langName} (${langNative})`);
    });
  });
}

function selectOnboardingLanguage(langCode, displayName) {
  onboardingState.selectedLanguage = langCode;
  onboardingState.data.preferred_language = langCode;
  onboardingState.currentStep = 0;

  // Transition from Step A to Step B
  document.getElementById('onboard-step-language').style.display = 'none';
  document.getElementById('onboard-step-chat').style.display = 'flex';
  document.getElementById('intake-active-lang-badge').textContent = `Language: ${displayName}`;

  renderIntakeQuestion();
}

function renderIntakeQuestion() {
  const questions = getQuestionsForLanguage(onboardingState.selectedLanguage);
  const q = questions[onboardingState.currentStep];
  if (!q) {
    submitOnboardingForm();
    return;
  }

  // Update question cards
  document.getElementById('intake-step-indicator').textContent = q.label;
  document.getElementById('intake-question-text').textContent = q.text;
  document.getElementById('intake-question-english').textContent = q.sub;

  // Clear text input
  const textInput = document.getElementById('input-intake-text');
  textInput.value = '';
  textInput.placeholder = `Speak or type your answer (${LANG_LABELS[onboardingState.selectedLanguage] || 'Indian Language'})...`;

  // Populate quick chips
  const chipsContainer = document.getElementById('intake-quick-chips');
  chipsContainer.innerHTML = (q.chips || []).map(chipText => `
    <button class="quick-chip" onclick="handleQuickChipClick('${chipText.replace(/'/g, "\\'")}')">
      <i class="fa-solid fa-comment-dots"></i> "${chipText}"
    </button>
  `).join('');

  // Automatically speak question aloud via TTS using male voice
  playIntakeQuestionTTS(q.text, onboardingState.selectedLanguage);
}

window.handleQuickChipClick = function(text) {
  handleIntakeAnswer(text);
};

// Play question aloud using direct TTS endpoint
async function playIntakeQuestionTTS(text, lang) {
  try {
    const res = await window.api.synthesizeSpeech(text, lang);
    if (res && res.audio_url) {
      const fullUrl = window.api.resolveAudioUrl(res.audio_url);
      window.audioManager.playAudio(fullUrl);
    }
  } catch (err) {
    console.warn('Intake TTS playback skipped/failed:', err.message);
  }
}

// Intake Voice Recording Toggle
async function toggleIntakeVoiceRecording() {
  const micBtn = document.getElementById('btn-intake-mic');
  const micStatus = document.getElementById('intake-mic-status');
  const recTimer = document.getElementById('intake-rec-timer');

  if (window.audioManager.isRecording) {
    // Stop recording and transcribe
    micStatus.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Transcribing with Gnani AI...`;
    micBtn.classList.remove('recording');
    recTimer.style.display = 'none';

    const audioBlob = await window.audioManager.stopRecording();
    if (audioBlob) {
      try {
        const result = await window.api.transcribeAudio(audioBlob, onboardingState.selectedLanguage);
        if (result && result.transcript) {
          document.getElementById('input-intake-text').value = result.transcript;
          handleIntakeAnswer(result.transcript);
        } else {
          micStatus.textContent = 'No speech detected. Please tap mic and speak clearly.';
        }
      } catch (err) {
        micStatus.textContent = 'STT error: ' + err.message;
      }
    }
  } else {
    // Start recording
    const started = await window.audioManager.startRecording();
    if (started) {
      micBtn.classList.add('recording');
      micStatus.textContent = 'Listening... Speak in your native language (Tap to stop)';
      recTimer.style.display = 'inline-block';
      recTimer.textContent = '00:00';
    }
  }
}

// Process submitted answer (text or voice)
function handleIntakeAnswer(answer) {
  const clean = (answer || '').trim();
  if (!clean) return;

  const step = onboardingState.currentStep;

  if (step === 0) {
    // Name
    onboardingState.data.name = clean;
    updateAutofillField('item-name', 'field-preview-name', clean);
  } else if (step === 1) {
    // Age & Gender
    let age = null;
    const ageMatch = clean.match(/\d+/);
    if (ageMatch) age = parseInt(ageMatch[0]);
    onboardingState.data.age = age || 35;

    let gender = 'Male';
    const lower = clean.toLowerCase();
    if (lower.includes('महिला') || lower.includes('स्त्री') || lower.includes('female') || lower.includes('woman') || lower.includes('girl')) {
      gender = 'Female';
    }
    onboardingState.data.gender = gender;

    updateAutofillField('item-age', 'field-preview-age-gender', `${onboardingState.data.age} yrs • ${gender}`);
  } else if (step === 2) {
    // Phone
    const digits = clean.replace(/\D/g, '');
    const phone = digits.length >= 10 ? digits.slice(-10) : clean;
    onboardingState.data.mobile_number = phone || '9876543210';
    updateAutofillField('item-phone', 'field-preview-phone', onboardingState.data.mobile_number);
  } else if (step === 3) {
    // Chief Complaint & Symptoms Duration
    onboardingState.data.chief_complaint = clean;
    onboardingState.data.symptoms_duration = clean;
    updateAutofillField('item-complaint', 'field-preview-complaint', clean);
  } else if (step === 4) {
    // Medical History & Allergies
    onboardingState.data.past_medical_history = clean;
    onboardingState.data.known_allergies = clean;
    updateAutofillField('item-history', 'field-preview-history', clean);
    updateAutofillField('item-allergies', 'field-preview-allergies', clean);
  }

  // Advance to next question
  onboardingState.currentStep++;
  const questions = getQuestionsForLanguage(onboardingState.selectedLanguage);
  if (onboardingState.currentStep < questions.length) {
    renderIntakeQuestion();
  } else {
    submitOnboardingForm();
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
  finishBtn.disabled = true;
  finishBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Canonicalizing with GPT-6 Luna...`;

  try {
    // Defaults if missing
    if (!onboardingState.data.name) onboardingState.data.name = 'Patient ' + Math.floor(1000 + Math.random() * 9000);
    if (!onboardingState.data.mobile_number) onboardingState.data.mobile_number = '98' + Math.floor(10000000 + Math.random() * 90000000);

    const savedPatient = await window.api.submitConversationalIntake(onboardingState.data);
    state.selectedPatient = savedPatient;
    await loadPatients();

    // Render Step C (Doctor-Language Pre-Consultation Summary)
    renderPreConsultationSummary(savedPatient);

    // Transition view to Step C
    document.getElementById('onboard-step-chat').style.display = 'none';
    document.getElementById('onboard-step-summary').style.display = 'flex';
  } catch (err) {
    alert('Failed to submit patient intake: ' + err.message);
  } finally {
    finishBtn.disabled = false;
    finishBtn.innerHTML = `<i class="fa-solid fa-check"></i> Complete & Submit Form`;
  }
}

function renderPreConsultationSummary(patient) {
  document.getElementById('summary-patient-name').textContent = patient.name;
  document.getElementById('summary-patient-meta').textContent = `${patient.age ? patient.age + ' yrs • ' : ''}${patient.gender ? patient.gender + ' • ' : ''}${patient.mobile_number}`;
  
  const langName = LANG_LABELS[patient.preferred_language] || patient.preferred_language;
  document.getElementById('summary-patient-lang').textContent = `${langName} [${patient.preferred_language}]`;

  // Briefing generated by GPT-6 Luna
  document.getElementById('summary-intake-brief').textContent = patient.intake_summary_english || 'Patient completed conversational voice intake. Symptoms and history converted to canonical medical English.';
  document.getElementById('summary-complaint').textContent = patient.chief_complaint || 'General medical examination';
  document.getElementById('summary-duration').textContent = patient.symptoms_duration || 'Not specified';
  document.getElementById('summary-history').textContent = patient.past_medical_history || 'No prior chronic conditions recorded';
  document.getElementById('summary-allergies').textContent = patient.known_allergies || 'No known drug allergies';
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
    // Both doctor and patient speak the same language!
    // Prompt doctor for Ambient Background Scribe Mode vs Standard Turn-by-Turn Mode
    document.getElementById('modal-shared-lang-name').textContent = sharedInfo.sharedLangLabel;
    openModal('modal-mode-select');
  } else {
    // Different languages: directly start in Standard Turn-by-Turn Mode
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
    state.activeSpeaker = 'PATIENT'; // patient starts

    // Setup consultation screen
    document.getElementById('cons-patient-title').textContent = state.selectedPatient.name;
    document.getElementById('cons-badge-patient').textContent = `Patient: ${LANG_LABELS[patientLang] || patientLang}`;
    document.getElementById('cons-badge-doctor').textContent = `Doctor: ${LANG_LABELS[doctorLang] || doctorLang}`;

    // Ambient mode banner toggle
    const ambientBanner = document.getElementById('ambient-mode-banner');
    if (mode === 'AMBIENT_BACKGROUND') {
      ambientBanner.style.display = 'flex';
    } else {
      ambientBanner.style.display = 'none';
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
  const recBtn = document.getElementById('btn-record-turn');
  const turnBanner = document.getElementById('turn-direction-banner');
  const turnText = document.getElementById('turn-direction-text');

  const pLang = state.activeConsultation ? state.activeConsultation.patient_language : 'hi-IN';
  const dLang = state.activeConsultation ? state.activeConsultation.doctor_language : 'en-IN';

  if (isPatient) {
    btnPatient.classList.add('active');
    btnDoctor.classList.remove('active');
    recBtn.className = 'record-btn-big';
    turnBanner.className = 'turn-direction-banner patient-turn';
    if (isAmbient) {
      turnText.textContent = `Patient Speaking (${LANG_LABELS[pLang] || pLang}) • App logging English clinical notes`;
    } else {
      turnText.textContent = `Patient Speaks (${LANG_LABELS[pLang] || pLang}) ➔ Doctor Listens (${LANG_LABELS[dLang] || dLang})`;
    }
  } else {
    btnPatient.classList.remove('active');
    btnDoctor.classList.add('active');
    recBtn.className = 'record-btn-big doctor';
    turnBanner.className = 'turn-direction-banner doctor-turn';
    if (isAmbient) {
      turnText.textContent = `Doctor Speaking (${LANG_LABELS[dLang] || dLang}) • App logging English clinical notes`;
    } else {
      turnText.textContent = `Doctor Speaks (${LANG_LABELS[dLang] || dLang}) ➔ Patient Listens (${LANG_LABELS[pLang] || pLang} Male Voice)`;
    }
  }
}

// Audio Recording & Turn Processing
async function toggleRecording() {
  if (state.isProcessing) return;

  if (window.audioManager.isRecording) {
    // Stop recording
    const audioBlob = await window.audioManager.stopRecording();
    if (audioBlob) {
      await processAudioTurn(audioBlob);
    }
  } else {
    // Start recording
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

    // Auto-prompt turn handoff
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

  if (isProcessing) {
    banner.style.display = 'flex';
    bannerText.textContent = message;
    recordBtn.disabled = true;
  } else {
    banner.style.display = 'none';
    recordBtn.disabled = false;
  }
}

function appendTurn(turn) {
  state.turns.push(turn);
  renderTimeline(state.turns);
}

function renderTimeline(turns) {
  const container = document.getElementById('transcript-timeline');

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
  reviewBtn.disabled = true;
  reviewBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Generating...`;

  try {
    const draft = await window.api.generateDraft(state.activeConsultation.id);
    state.draft = draft;

    renderDraftReview(draft);
    showView('draftReview');
  } catch (err) {
    alert('Failed to generate draft: ' + err.message);
  } finally {
    reviewBtn.disabled = false;
    reviewBtn.innerHTML = `<i class="fa-solid fa-clipboard-check"></i> Review Draft`;
  }
}

function renderDraftReview(draft) {
  const payload = draft.structured_payload || {};

  // Symptoms
  const symptomsContainer = document.getElementById('draft-symptoms-list');
  const symptoms = payload.patient_reported_symptoms || [];

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

  // Doctor diagnosis input
  document.getElementById('draft-input-diagnosis').value = payload.doctor_diagnosis || 'Viral fever with upper respiratory tract infection';
  document.getElementById('draft-input-history').value = payload.medical_history || (state.selectedPatient ? state.selectedPatient.past_medical_history : 'None');
  document.getElementById('draft-input-allergies').value = payload.allergies || (state.selectedPatient ? state.selectedPatient.known_allergies : 'No known drug allergies');
  document.getElementById('draft-input-followup').value = payload.follow_up_recommendation || 'Follow up after 3 days if symptoms persist';

  renderPrescriptions(payload.prescriptions || []);
}

function renderPrescriptions(prescriptions) {
  const container = document.getElementById('draft-prescriptions-list');

  if (prescriptions.length === 0) {
    container.innerHTML = `
      <div style="padding: 12px; background: #f8fafc; border-radius: 8px; font-size: 13px; color: var(--text-muted); text-align: center;">
        No medicines prescribed yet. Tap "+ Add Medicine" to prescribe.
      </div>
    `;
    return;
  }

  container.innerHTML = prescriptions.map((p, idx) => `
    <div class="prescription-item-row">
      <div>
        <h5>${p.medicine} ${p.strength || ''}</h5>
        <p>${p.dose || ''} • ${p.frequency || ''} • ${p.duration || ''}</p>
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

// Save Draft Edits
async function saveDraftEdits() {
  if (!state.activeConsultation || !state.draft) return;

  const payload = state.draft.structured_payload;
  payload.doctor_diagnosis = document.getElementById('draft-input-diagnosis').value.trim();
  payload.medical_history = document.getElementById('draft-input-history').value.trim();
  payload.allergies = document.getElementById('draft-input-allergies').value.trim();
  payload.follow_up_recommendation = document.getElementById('draft-input-followup').value.trim();

  try {
    const updated = await window.api.updateDraft(state.activeConsultation.id, payload);
    state.draft = updated;
    alert('Draft edits saved successfully!');
  } catch (err) {
    alert('Failed to save draft: ' + err.message);
  }
}

// Approve Official Record
async function approveClinicalRecord() {
  if (!state.activeConsultation || !state.draft) return;

  const btn = document.getElementById('btn-approve-record');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Committing Official Record...`;

  try {
    const payload = state.draft.structured_payload;
    payload.doctor_diagnosis = document.getElementById('draft-input-diagnosis').value.trim();
    payload.medical_history = document.getElementById('draft-input-history').value.trim();
    payload.allergies = document.getElementById('draft-input-allergies').value.trim();
    payload.follow_up_recommendation = document.getElementById('draft-input-followup').value.trim();

    await window.api.updateDraft(state.activeConsultation.id, payload);
    await window.api.approveDraft(state.activeConsultation.id);

    // Setup Approval & Follow-up View
    document.getElementById('appr-diagnosis-text').textContent = payload.doctor_diagnosis;
    const prescContainer = document.getElementById('appr-prescription-summary');
    if (payload.prescriptions && payload.prescriptions.length > 0) {
      prescContainer.innerHTML = payload.prescriptions.map(p => `
        <div>• <strong>${p.medicine} ${p.strength || ''}</strong> (${p.dose || ''}, ${p.frequency || ''})</div>
      `).join('');
    } else {
      prescContainer.innerHTML = `<em>No medicines prescribed</em>`;
    }

    // Set default follow-up 3 days later
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 3);
    nextDate.setHours(10, 30, 0, 0);
    document.getElementById('input-followup-datetime').value = nextDate.toISOString().slice(0, 16);
    document.getElementById('input-followup-phone').value = state.selectedPatient ? state.selectedPatient.mobile_number : '';

    showView('approval');
  } catch (err) {
    alert('Failed to approve clinical record: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-circle-check"></i> Approve & Save Official Clinical Record`;
  }
}

// Schedule Follow-up Appointment
async function saveFollowupAppointment() {
  if (!state.activeConsultation) return;

  const dtStr = document.getElementById('input-followup-datetime').value;
  const phone = document.getElementById('input-followup-phone').value.trim();

  if (!dtStr || !phone) {
    alert('Please enter both appointment date/time and contact phone number.');
    return;
  }

  const btn = document.getElementById('btn-save-followup');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving Appointment...`;

  try {
    const appointmentAt = new Date(dtStr).toISOString();
    await window.api.scheduleFollowup(state.activeConsultation.id, appointmentAt, phone);
    alert('Follow-up appointment saved successfully in local clinic database!');
    showView('dashboard');
    loadPatients();
  } catch (err) {
    alert('Failed to save follow-up: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-calendar-check"></i> Save Follow-up Appointment`;
  }
}

/* ==========================================================================
   EVENT LISTENERS & BINDINGS
   ========================================================================== */

function setupEventListeners() {
  // Settings modal
  document.getElementById('btn-open-settings').addEventListener('click', () => openModal('modal-settings'));
  document.getElementById('link-configure-ip').addEventListener('click', () => openModal('modal-settings'));

  // Spoken languages checkboxes in settings
  document.querySelectorAll('#spoken-languages-chips input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
      cb.parentElement.classList.toggle('selected', cb.checked);
    });
  });

  document.getElementById('btn-save-settings').addEventListener('click', async () => {
    const name = document.getElementById('setting-doc-name').value.trim();
    const creds = document.getElementById('setting-doc-creds').value.trim();
    const lang = document.getElementById('setting-doc-lang').value;
    const apiUrl = document.getElementById('setting-api-url').value.trim();

    // Collect spoken languages
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

  // Launch Conversational Onboarding (Floating Bubble UI)
  document.getElementById('btn-add-patient').addEventListener('click', showOnboardingView);

  // Onboarding Step A back button
  document.getElementById('btn-back-onboard-lang').addEventListener('click', () => showView('dashboard'));

  // Onboarding Step B change language button
  document.getElementById('btn-change-onboard-lang').addEventListener('click', () => {
    document.getElementById('onboard-step-chat').style.display = 'none';
    document.getElementById('onboard-step-language').style.display = 'flex';
  });

  // Replay question TTS
  document.getElementById('btn-play-intake-tts').addEventListener('click', () => {
    const questions = getQuestionsForLanguage(onboardingState.selectedLanguage);
    const q = questions[onboardingState.currentStep];
    if (q) playIntakeQuestionTTS(q.text, onboardingState.selectedLanguage);
  });

  // Intake Mic Button
  document.getElementById('btn-intake-mic').addEventListener('click', toggleIntakeVoiceRecording);

  // Intake Text Submit
  document.getElementById('btn-submit-intake-text').addEventListener('click', () => {
    const text = document.getElementById('input-intake-text').value.trim();
    if (text) handleIntakeAnswer(text);
  });

  document.getElementById('input-intake-text').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const text = e.target.value.trim();
      if (text) handleIntakeAnswer(text);
    }
  });

  // Complete Intake Early
  document.getElementById('btn-finish-intake-early').addEventListener('click', submitOnboardingForm);

  // Start Consultation from Pre-Consultation Summary Card
  document.getElementById('btn-start-from-summary').addEventListener('click', initiateConsultationStart);

  // Start Consultation from Patient Profile View
  document.getElementById('btn-start-consultation').addEventListener('click', initiateConsultationStart);

  // Mode Selection Modal Choices
  document.getElementById('opt-mode-ambient').addEventListener('click', () => startConsultationWithMode('AMBIENT_BACKGROUND'));
  document.getElementById('opt-mode-normal').addEventListener('click', () => startConsultationWithMode('NORMAL'));

  // Patient Search Debounce
  let searchTimer;
  document.getElementById('input-patient-search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      loadPatients(e.target.value.trim());
    }, 250);
  });

  // Navigation Back buttons
  document.getElementById('btn-back-to-dashboard').addEventListener('click', () => showView('dashboard'));
  document.getElementById('btn-back-to-consultation').addEventListener('click', () => showView('consultation'));
  document.getElementById('btn-finish-to-dashboard').addEventListener('click', () => showView('dashboard'));
  const btnFinishConsultation = document.getElementById('btn-finish-consultation');
  if (btnFinishConsultation) {
    btnFinishConsultation.addEventListener('click', () => showView('dashboard'));
  }

  // Speaker Selector Buttons
  document.getElementById('btn-speaker-patient').addEventListener('click', () => switchSpeaker('PATIENT'));
  document.getElementById('btn-speaker-doctor').addEventListener('click', () => switchSpeaker('DOCTOR'));

  // Record Turn Button
  document.getElementById('btn-record-turn').addEventListener('click', toggleRecording);

  // Quick Text Input Turn
  document.getElementById('btn-type-turn').addEventListener('click', () => {
    document.getElementById('modal-text-turn-title').textContent = `Type Turn (${state.activeSpeaker === 'PATIENT' ? 'Patient' : 'Doctor'})`;
    document.getElementById('input-turn-text').value = '';
    openModal('modal-text-turn');
  });

  document.getElementById('btn-submit-text-turn').addEventListener('click', () => {
    const text = document.getElementById('input-turn-text').value.trim();
    if (text) {
      closeModal('modal-text-turn');
      processTextTurn(text);
    }
  });

  // Scripted Demo Presets
  document.getElementById('btn-preset-turn').addEventListener('click', () => {
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
    listContainer.innerHTML = presets.map(p => `
      <button class="btn btn-outline" style="text-align: left; justify-content: flex-start; font-size: 13px;" onclick="selectPreset('${p.replace(/'/g, "\\'")}')">
        <i class="fa-solid fa-comment-dots"></i> "${p}"
      </button>
    `).join('');

    document.getElementById('modal-presets-title').textContent = `Demo Presets (${isPatient ? 'Patient' : 'Doctor'})`;
    openModal('modal-presets');
  });

  window.selectPreset = function(phrase) {
    closeModal('modal-presets');
    processTextTurn(phrase);
  };

  // Review Draft Button
  document.getElementById('btn-review-draft').addEventListener('click', loadDraftReview);

  // Draft Actions
  document.getElementById('btn-save-draft').addEventListener('click', saveDraftEdits);
  document.getElementById('btn-approve-record').addEventListener('click', approveClinicalRecord);

  // Add Prescription
  document.getElementById('btn-add-prescription').addEventListener('click', () => openModal('modal-prescription'));
  document.getElementById('btn-confirm-add-presc').addEventListener('click', () => {
    const med = document.getElementById('presc-med').value.trim();
    const strength = document.getElementById('presc-strength').value.trim();
    const dose = document.getElementById('presc-dose').value.trim();
    const freq = document.getElementById('presc-freq').value.trim();
    const dur = document.getElementById('presc-duration').value.trim();

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
  document.getElementById('btn-save-followup').addEventListener('click', saveFollowupAppointment);
}

// Audio Callbacks for Single-Device Echo Management & Timer
function setupAudioCallbacks() {
  const playbackBanner = document.getElementById('audio-playback-banner');
  const recordLabel = document.getElementById('record-status-label');
  const recordBtn = document.getElementById('btn-record-turn');
  const intakeTimer = document.getElementById('intake-rec-timer');

  window.audioManager.onStateChange = ({ isRecording, isPlaying }) => {
    if (isPlaying) {
      playbackBanner.style.display = 'flex';
      recordBtn.disabled = true;
      recordLabel.textContent = 'TTS PLAYING — MIC LOCKED';
      recordLabel.className = 'record-status-label';
    } else {
      playbackBanner.style.display = 'none';
      recordBtn.disabled = false;
      if (isRecording) {
        recordBtn.classList.add('recording');
        recordLabel.classList.add('recording');
        recordLabel.textContent = 'RECORDING... (TAP TO STOP)';
      } else {
        recordBtn.classList.remove('recording');
        recordLabel.classList.remove('recording');
        recordLabel.textContent = 'TAP TO RECORD TURN';
      }
    }
  };

  window.audioManager.onTimerTick = (timeFormatted) => {
    recordLabel.textContent = `RECORDING (${timeFormatted}) — TAP TO STOP`;
    if (intakeTimer) {
      intakeTimer.textContent = timeFormatted;
    }
  };
}

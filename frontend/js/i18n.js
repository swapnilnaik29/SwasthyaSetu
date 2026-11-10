/**
 * SwasthyaSetu UI Localization Dictionary & Database Cache Client
 * Supports dynamic cached UI translation in English (en-IN), Hindi (hi-IN), and Marathi (mr-IN).
 * - Doctor UI reflects doctor's preferred language from settings / quick switcher.
 * - Patient Form Filling UI reflects patient's chosen language.
 * - Fully synced with SQLite database cache (`ui_localizations`) & cached in memory for zero latency.
 */

window.I18N_DICTIONARY = {
  'en-IN': {
    brandSubtitle: 'Clinical Communication Suite',
    doctorSettingsTooltip: 'Doctor & App Settings',
    doctorCreds: 'MBBS, MD (General Medicine)',
    primaryLangPrefix: 'Primary: ',
    searchPatientsPlaceholder: 'Search patients by name or phone...',
    onboardPatientBtn: 'Onboard Patient',
    registeredPatientsTitle: 'Registered Patients',
    registeredSuffix: ' registered',
    noPatientsText: 'No patients registered yet. Tap "Onboard Patient" to register.',
    patientProfileTitle: 'Patient Profile',
    preferredLangLabel: 'Preferred Language:',
    intakeSummaryLabel: 'Intake Summary:',
    startConsultationBtn: 'Start Consultation',
    medicalHistoryTitle: 'Medical History & Reports',
    noReportsText: 'No clinical reports recorded yet for this patient.',
    viewFullReportBtn: 'View Full Report',
    officialApprovedBadge: 'Official Approved Record',
    draftBadge: 'Draft in Progress',
    consultationTitle: 'Consultation',
    activeSessionBadge: 'Active Session',
    generateAiReportBtn: 'Generate AI Report',
    patientSpeaksBtn: 'PATIENT SPEAKS',
    doctorSpeaksBtn: 'DOCTOR SPEAKS',
    doctorSpeakingInLabel: 'Doctor Speaking In:',
    turnDirectionDoctor: 'Doctor Speaks ({docLang}) ➔ Patient Listens ({patLang})',
    turnDirectionPatient: 'Patient Speaks ({patLang}) ➔ Doctor Listens ({docLang})',
    typeTurnBtn: 'Type',
    recordTurnInstruction: 'Tap microphone to speak turn in native language',
    reviewDraftTitle: 'Review Clinical Draft',
    aiDraftDisclaimerTitle: 'AI-GENERATED DRAFT — PENDING DOCTOR REVIEW',
    aiDraftDisclaimerText: 'The AI never diagnoses or prescribes autonomously. Doctor review and confirmation are legally required.',
    talkToAiTitle: 'Talk to AI Clinical Assistant',
    talkToAiDesc: 'Dictate vitals (Weight, Height, BP, Pulse, Temp) or notes in English, Hindi, or Marathi',
    talkToAiPlaceholder: 'e.g. Weight 70 kg, height 175 cm, BP 120/80 mmHg, pulse 74...',
    sendBtn: 'Send',
    patientVitalsTitle: 'Patient Vitals',
    patientVitalsSubtitle: 'Auto-filled / Editable',
    vitalsWeight: 'Weight (kg)',
    vitalsHeight: 'Height (cm)',
    vitalsBp: 'Blood Pressure',
    vitalsPulse: 'Pulse (bpm)',
    vitalsTemp: 'Temp (°F)',
    vitalsSpo2: 'SpO2 (%)',
    recommendedNextConsultationTitle: 'Recommended Next Consultation',
    recommendedNextDateLabel: 'Date:',
    symptomsTitle: 'Patient-Reported Symptoms',
    physicianAssessmentTitle: 'Physician Assessment',
    doctorDiagnosisLabel: 'Doctor Diagnosis *',
    doctorDiagnosisPlaceholder: 'Enter confirmed clinical diagnosis...',
    doctorNotesLabel: 'Doctor Clinical Notes',
    doctorNotesPlaceholder: 'Enter clinical observations, rest advisory, and diet instructions...',
    prescriptionsTitle: 'Prescriptions',
    addMedicineBtn: 'Add Medicine',
    approveRecordBtn: 'Approve & Finalize Record',
    recordApprovedTitle: 'Clinical Record Approved',
    recordApprovedSubtitle: 'Medical record safely archived in canonical English strictly.',
    scheduleFollowupTitle: 'Schedule Follow-up Appointment',
    followupDateLabel: 'Follow-up Date *',
    followupNotesLabel: 'Follow-up Instructions (Appointment Only)',
    followupNotesPlaceholder: 'e.g. Review if fever persists after 3 days',
    scheduleFollowupBtn: 'Schedule Follow-up',
    returnDashboardBtn: 'Return to Dashboard',
    reportModalTitle: 'Official Medical Report',
    patientDetailsHeader: 'PATIENT DETAILS',
    attendingPhysicianHeader: 'ATTENDING PHYSICIAN',
    printReportBtn: 'Print / Save PDF',
    closeBtn: 'Close',
    settingsModalTitle: 'Doctor & App Settings',
    settingDocNameLabel: 'Doctor Full Name',
    settingDocCredsLabel: 'Doctor Credentials',
    settingDocLangLabel: 'Doctor Primary Language (Storage & Consultation)',
    saveSettingsBtn: 'Save Settings',
    cancelBtn: 'Cancel',
    // Patient Onboarding Form Elements
    intakeHeaderSub: 'Language: Indian English',
    changeLangBtn: 'Change Language',
    listenAloudBtn: 'Listen Aloud',
    intakeTypePlaceholder: 'Or type answer here...',
    intakeNextBtn: 'Next',
    intakeCompleteBtn: 'Complete & Submit Form',
    autofillCardTitle: 'Live Autofilled Intake Form',
    autofillSyncBadge: 'Live Sync',
    autofillLabelName: 'Full Name',
    autofillLabelAge: 'Age & Gender',
    autofillLabelPhone: 'Mobile Number',
    autofillLabelComplaint: 'Chief Complaint',
    autofillLabelHistory: 'Past History & Chronic Conditions',
    autofillLabelAllergies: 'Known Allergies & Regular Medications',
    micTapToSpeak: 'Tap mic to speak your answer',
  },

  'hi-IN': {
    brandSubtitle: 'क्लिनिकल संचार एवं परामर्श सुइट',
    doctorSettingsTooltip: 'चिकित्सक एवं ऐप सेटिंग्स',
    doctorCreds: 'एमबीबीएस, एमडी (जनरल मेडिसिन)',
    primaryLangPrefix: 'प्राथमिक: ',
    searchPatientsPlaceholder: 'मरीज़ का नाम या मोबाइल नंबर खोजें...',
    onboardPatientBtn: 'नया मरीज़ जोड़ें',
    registeredPatientsTitle: 'पंजीकृत मरीज़',
    registeredSuffix: ' पंजीकृत',
    noPatientsText: 'अभी कोई मरीज़ पंजीकृत नहीं है। नया मरीज़ जोड़ने के लिए "नया मरीज़ जोड़ें" दबाएं।',
    patientProfileTitle: 'मरीज़ प्रोफ़ाइल',
    preferredLangLabel: 'पसंदीदा भाषा:',
    intakeSummaryLabel: 'आरंभिक सारांश:',
    startConsultationBtn: 'परामर्श शुरू करें',
    medicalHistoryTitle: 'चिकित्सा इतिहास एवं रिपोर्ट्स',
    noReportsText: 'इस मरीज़ की अभी कोई क्लिनिकल रिपोर्ट दर्ज नहीं है।',
    viewFullReportBtn: 'पूरी रिपोर्ट देखें',
    officialApprovedBadge: 'आधिकारिक स्वीकृत रिकॉर्ड',
    draftBadge: 'प्रारूप प्रगति पर',
    consultationTitle: 'डॉक्टर परामर्श',
    activeSessionBadge: 'सक्रिय सत्र',
    generateAiReportBtn: 'एआई रिपोर्ट तैयार करें',
    patientSpeaksBtn: 'मरीज़ बोलेगा',
    doctorSpeaksBtn: 'डॉक्टर बोलेंगे',
    doctorSpeakingInLabel: 'डॉक्टर बोलने की भाषा:',
    turnDirectionDoctor: 'डॉक्टर बोलेंगे ({docLang}) ➔ मरीज़ सुनेंगे ({patLang})',
    turnDirectionPatient: 'मरीज़ बोलेंगे ({patLang}) ➔ डॉक्टर सुनेंगे ({docLang})',
    typeTurnBtn: 'टाइप करें',
    recordTurnInstruction: 'अपनी भाषा में बोलने के लिए माइक दबाएं',
    reviewDraftTitle: 'क्लिनिकल प्रारूप की समीक्षा',
    aiDraftDisclaimerTitle: 'एआई-निर्मित प्रारूप — डॉक्टर की समीक्षा आवश्यक',
    aiDraftDisclaimerText: 'एआई स्वतः निदान या दवा तय नहीं करता। डॉक्टर का सत्यापन कानूनी रूप से अनिवार्य है।',
    talkToAiTitle: 'एआई क्लिनिकल सहायक',
    talkToAiDesc: 'वाइटल्स (वजन, लंबाई, बीपी, नाड़ी, तापमान) या नोट्स हिंदी, मराठी या अंग्रेजी में बोलें',
    talkToAiPlaceholder: 'उदा. वजन 70 किलो, लंबाई 175 सेमी, बीपी 120/80...',
    sendBtn: 'भेजें',
    patientVitalsTitle: 'मरीज़ के वाइटल्स',
    patientVitalsSubtitle: 'एआई द्वारा स्वतः भरे गए / संपादन योग्य',
    vitalsWeight: 'वजन (किलो)',
    vitalsHeight: 'लंबाई (सेमी)',
    vitalsBp: 'रक्तचाप (BP)',
    vitalsPulse: 'नाड़ी (bpm)',
    vitalsTemp: 'तापमान (°F)',
    vitalsSpo2: 'SpO2 (%)',
    recommendedNextConsultationTitle: 'अगले परामर्श की संस्तुति',
    recommendedNextDateLabel: 'तारीख:',
    symptomsTitle: 'मरीज़ द्वारा बताए गए लक्षण',
    physicianAssessmentTitle: 'चिकित्सक आकलन',
    doctorDiagnosisLabel: 'डॉक्टर का अंतिम निदान *',
    doctorDiagnosisPlaceholder: 'पुष्ट क्लिनिकल निदान दर्ज करें...',
    doctorNotesLabel: 'चिकित्सकीय परामर्श एवं निर्देश',
    doctorNotesPlaceholder: 'निरीक्षण, आराम एवं खान-पान के निर्देश दर्ज करें...',
    prescriptionsTitle: 'दवाइयाँ (प्रिस्क्रिप्शन)',
    addMedicineBtn: 'दवा जोड़ें',
    approveRecordBtn: 'रिकॉर्ड स्वीकृत एवं सुरक्षित करें',
    recordApprovedTitle: 'क्लिनिकल रिकॉर्ड स्वीकृत',
    recordApprovedSubtitle: 'चिकित्सा रिकॉर्ड सुरक्षित रूप से अंग्रेजी में संगृहीत किया गया।',
    scheduleFollowupTitle: 'फ़ॉलो-अप अपॉइंटमेंट निर्धारित करें',
    followupDateLabel: 'फ़ॉलो-अप की तारीख *',
    followupNotesLabel: 'फ़ॉलो-अप निर्देश',
    followupNotesPlaceholder: 'उदा. बुखार 3 दिन बाद भी रहे तो पुनः दिखाएं',
    scheduleFollowupBtn: 'अपॉइंटमेंट तय करें',
    returnDashboardBtn: 'डैशबोर्ड पर लौटें',
    reportModalTitle: 'आधिकारिक चिकित्सा रिपोर्ट',
    patientDetailsHeader: 'मरीज़ का विवरण',
    attendingPhysicianHeader: 'उपचारक चिकित्सक',
    printReportBtn: 'प्रिंट / पीडीएफ सेव करें',
    closeBtn: 'बंद करें',
    settingsModalTitle: 'चिकित्सक एवं ऐप सेटिंग्स',
    settingDocNameLabel: 'डॉक्टर का पूरा नाम',
    settingDocCredsLabel: 'योग्यता एवं उपाधियाँ',
    settingDocLangLabel: 'डॉक्टर की प्राथमिक भाषा (संग्रहण एवं परामर्श)',
    saveSettingsBtn: 'सेटिंग्स सहेजें',
    cancelBtn: 'रद्द करें',
    intakeHeaderSub: 'भाषा: हिंदी (हिन्दी)',
    changeLangBtn: 'भाषा बदलें',
    listenAloudBtn: 'सुनें',
    intakeTypePlaceholder: 'या यहाँ उत्तर लिखें...',
    intakeNextBtn: 'आगे बढ़ें',
    intakeCompleteBtn: 'प्रपत्र पूर्ण एवं जमा करें',
    autofillCardTitle: 'लाइव स्वतः भरा हुआ प्रपत्र',
    autofillSyncBadge: 'लाइव सिंक',
    autofillLabelName: 'पूरा नाम',
    autofillLabelAge: 'उम्र एवं लिंग',
    autofillLabelPhone: 'मोबाइल नंबर',
    autofillLabelComplaint: 'मुख्य समस्या एवं लक्षण',
    autofillLabelHistory: 'पिछला चिकित्सा इतिहास',
    autofillLabelAllergies: 'एलर्जी एवं नियमित दवाएं',
    micTapToSpeak: 'माइक दबाकर अपना उत्तर बोलें',
  },

  'mr-IN': {
    brandSubtitle: 'क्लिनिकल संवाद आणि सल्लागार सुइट',
    doctorSettingsTooltip: 'डॉक्टर आणि ॲप सेटिंग्ज',
    doctorCreds: 'एमबीबीएस, एमडी (जनरल मेडिसिन)',
    primaryLangPrefix: 'प्राथमिक भाषा: ',
    searchPatientsPlaceholder: 'रुग्णाचे नाव किंवा मोबाईल नंबर शोधा...',
    onboardPatientBtn: 'नवीन रुग्ण नोंदवा',
    registeredPatientsTitle: 'नोंदणीकृत रुग्ण',
    registeredSuffix: ' नोंदणीकृत',
    noPatientsText: 'अद्याप कोणताही रुग्ण नोंदवलेला नाही. नवीन रुग्ण नोंदवण्यासाठी "नवीन रुग्ण नोंदवा" दाबा.',
    patientProfileTitle: 'रुग्ण तपशील',
    preferredLangLabel: 'पसंतीची भाषा:',
    intakeSummaryLabel: 'थोडक्यात सारांश:',
    startConsultationBtn: 'सल्लामसलत सुरू करा',
    medicalHistoryTitle: 'वैद्यकीय इतिहास आणि अहवाल',
    noReportsText: 'या रुग्णाचा अद्याप कोणताही क्लिनिकल अहवाल नाही.',
    viewFullReportBtn: 'संपूर्ण अहवाल पहा',
    officialApprovedBadge: 'अधिकृत मंजूर रेकॉर्ड',
    draftBadge: 'मसुदा सुरू आहे',
    consultationTitle: 'डॉक्टर तपासणी',
    activeSessionBadge: 'सक्रिय सत्र',
    generateAiReportBtn: 'एआय अहवाल तयार करा',
    patientSpeaksBtn: 'रुग्ण बोलणार',
    doctorSpeaksBtn: 'डॉक्टर बोलणार',
    doctorSpeakingInLabel: 'डॉक्टर बोलण्याची भाषा:',
    turnDirectionDoctor: 'डॉक्टर बोलणार ({docLang}) ➔ रुग्ण ऐकणार ({patLang})',
    turnDirectionPatient: 'रुग्ण बोलणार ({patLang}) ➔ डॉक्टर ऐकणार ({docLang})',
    typeTurnBtn: 'टाइप करा',
    recordTurnInstruction: 'तुमच्या भाषेत बोलण्यासाठी माइक दाबा',
    reviewDraftTitle: 'क्लिनिकल मसुदा पुनरावलोकन',
    aiDraftDisclaimerTitle: 'एआय-निर्मित मसुदा — डॉक्टरांचे पुनरावलोकन आवश्यक',
    aiDraftDisclaimerText: 'एआय स्वतः निदान किंवा औषधे ठरवत नाही. डॉक्टरांचे पुनरावलोकन कायदेशीररित्या आवश्यक आहे.',
    talkToAiTitle: 'एआय क्लिनिकल सहाय्यक',
    talkToAiDesc: 'व्हाइटल्स (वजन, उंची, बीपी, नाडी, तापमान) किंवा नोंदी मराठी, हिंदी किंवा इंग्रजीत सांगा',
    talkToAiPlaceholder: 'उदा. वजन ६८ किलो, उंची १७२ सेमी, बीपी १२०/८०...',
    sendBtn: 'पाठवा',
    patientVitalsTitle: 'रुग्णाचे व्हाइटल्स',
    patientVitalsSubtitle: 'एआय द्वारे भरलेले / बदलण्यायोग्य',
    vitalsWeight: 'वजन (किलो)',
    vitalsHeight: 'उंची (सेमी)',
    vitalsBp: 'रक्तदाब (BP)',
    vitalsPulse: 'नाडी (bpm)',
    vitalsTemp: 'तापमान (°F)',
    vitalsSpo2: 'SpO2 (%)',
    recommendedNextConsultationTitle: 'पुढील भेटीची शिफारस',
    recommendedNextDateLabel: 'दिनांक:',
    symptomsTitle: 'रुग्णाने सांगितलेली लक्षणे',
    physicianAssessmentTitle: 'डॉक्टरांचे क्लिनिकल मूल्यांकन',
    doctorDiagnosisLabel: 'डॉक्टरांचे अंतिम निदान *',
    doctorDiagnosisPlaceholder: 'निश्चित निदान प्रविष्ट करा...',
    doctorNotesLabel: 'क्लिनिकल नोंदी आणि सल्ला',
    doctorNotesPlaceholder: 'निरीक्षणे, विश्रांती आणि आहाराचे मार्गदर्शन लिहा...',
    prescriptionsTitle: 'औषधोपचार (प्रिस्क्रिप्शन)',
    addMedicineBtn: 'औषध जोडा',
    approveRecordBtn: 'अहवाल मंजूर आणि जतन करा',
    recordApprovedTitle: 'क्लिनिकल रेकॉर्ड मंजूर',
    recordApprovedSubtitle: 'वैद्यकीय रेकॉर्ड सुरक्षितपणे इंग्रजीत जतन करण्यात आले आहे.',
    scheduleFollowupTitle: 'पुढील अपॉइंटमेंट निश्चित करा',
    followupDateLabel: 'पुढील भेटीचा दिनांक *',
    followupNotesLabel: 'पुढील सूचना',
    followupNotesPlaceholder: 'उदा. ताप ३ दिवस राहिल्यास पुन्हा भेटा',
    scheduleFollowupBtn: 'अपॉइंटमेंट निश्चित करा',
    returnDashboardBtn: 'डॅशबोर्डवर जा',
    reportModalTitle: 'अधिकृत वैद्यकीय अहवाल',
    patientDetailsHeader: 'रुग्णाचा तपशील',
    attendingPhysicianHeader: 'तपासणारे डॉक्टर',
    printReportBtn: 'प्रिंट / पीडीएफ सेव्ह करा',
    closeBtn: 'बंद करा',
    settingsModalTitle: 'डॉक्टर आणि ॲप सेटिंग्ज',
    settingDocNameLabel: 'डॉक्टरांचे पूर्ण नाव',
    settingDocCredsLabel: 'शिक्षण आणि पदव्या',
    settingDocLangLabel: 'डॉक्टरांची प्राथमिक भाषा',
    saveSettingsBtn: 'सेटिंग्ज जतन करा',
    cancelBtn: 'रद्द करा',
    intakeHeaderSub: 'भाषा: मराठी (मराठी)',
    changeLangBtn: 'भाषा बदला',
    listenAloudBtn: 'ऐका',
    intakeTypePlaceholder: 'किंवा येथे उत्तर टाइप करा...',
    intakeNextBtn: 'पुढील प्रश्न',
    intakeCompleteBtn: 'अर्ज पूर्ण आणि सबमिट करा',
    autofillCardTitle: 'थेट स्वयं-भरलेला प्रवेश अर्ज',
    autofillSyncBadge: 'थेट सिंक',
    autofillLabelName: 'पूर्ण नाव',
    autofillLabelAge: 'वय आणि लिंग',
    autofillLabelPhone: 'मोबाईल नंबर',
    autofillLabelComplaint: 'मुख्य समस्या / लक्षणे',
    autofillLabelHistory: 'मागील वैद्यकीय आजार',
    autofillLabelAllergies: 'ॲलर्जी आणि नियमित औषधे',
    micTapToSpeak: 'माइक दाबून उत्तर बोला',
  },
};

/**
 * Syncs UI localization dictionaries from SQLite backend database.
 */
window.syncUILocalizationsFromDB = async function() {
  try {
    if (window.api && window.api.getAllUICaches) {
      const dbCaches = await window.api.getAllUICaches();
      if (dbCaches && typeof dbCaches === 'object') {
        Object.keys(dbCaches).forEach(lang => {
          if (dbCaches[lang] && dbCaches[lang].translations) {
            window.I18N_DICTIONARY[lang] = dbCaches[lang].translations;
          }
        });
        localStorage.setItem('swasthya_ui_cached_db', 'true');
      }
    }
  } catch (err) {
    console.warn('[SwasthyaSetu] UI localization database sync fallback to local memory:', err.message);
  }
};

/**
 * Applies Doctor UI localization dynamically.
 */
window.applyDoctorLanguage = function(langCode = 'en-IN') {
  const dict = window.I18N_DICTIONARY[langCode] || window.I18N_DICTIONARY['en-IN'];
  if (!dict) return;

  // Header
  const subtitle = document.getElementById('brand-subtitle-text');
  if (subtitle) subtitle.textContent = dict.brandSubtitle;

  const headerLangSwitcher = document.getElementById('header-lang-switcher');
  if (headerLangSwitcher && headerLangSwitcher.value !== langCode) {
    headerLangSwitcher.value = langCode;
  }

  // Dashboard
  const searchInput = document.getElementById('input-patient-search');
  if (searchInput) searchInput.placeholder = dict.searchPatientsPlaceholder;
  const onboardBtn = document.getElementById('btn-add-patient');
  if (onboardBtn) onboardBtn.innerHTML = `<i class="fa-solid fa-user-plus"></i> <span id="label-onboard-btn">${dict.onboardPatientBtn}</span>`;
  const regTitle = document.getElementById('dash-registered-title');
  if (regTitle) regTitle.innerHTML = `<i class="fa-solid fa-hospital-user" style="color: var(--primary-green); font-size: 17px;"></i> ${dict.registeredPatientsTitle}`;

  // Patient Detail View
  const lblPrefLang = document.getElementById('label-pref-lang');
  if (lblPrefLang) lblPrefLang.textContent = dict.preferredLangLabel;
  const lblIntakeSumm = document.getElementById('label-intake-summary');
  if (lblIntakeSumm) lblIntakeSumm.textContent = dict.intakeSummaryLabel;
  const startConsBtn = document.getElementById('btn-start-consultation');
  if (startConsBtn) startConsBtn.innerHTML = `<i class="fa-solid fa-play"></i> <span id="label-start-consultation">${dict.startConsultationBtn}</span>`;
  const medHistTitle = document.getElementById('header-medical-history');
  if (medHistTitle) medHistTitle.innerHTML = `<i class="fa-solid fa-notes-medical" style="color: var(--primary-green); margin-right: 6px;"></i> ${dict.medicalHistoryTitle}`;

  // Consultation View
  const consPatientTitle = document.getElementById('cons-patient-title');
  if (consPatientTitle && !consPatientTitle.dataset.titleSet) consPatientTitle.textContent = dict.consultationTitle;
  const consStatusBadge = document.getElementById('cons-status-badge');
  if (consStatusBadge) consStatusBadge.innerHTML = `<i class="fa-solid fa-circle" style="font-size: 8px; margin-right: 4px;"></i> ${dict.activeSessionBadge}`;
  const genReportBtn = document.getElementById('btn-review-draft');
  if (genReportBtn) genReportBtn.innerHTML = `<i class="fa-solid fa-file-waveform"></i> <span id="label-generate-ai-report">${dict.generateAiReportBtn}</span>`;
  const speakerPatBtn = document.getElementById('btn-speaker-patient');
  if (speakerPatBtn) speakerPatBtn.innerHTML = `<i class="fa-solid fa-user"></i> <span id="label-patient-speaks-btn">${dict.patientSpeaksBtn}</span>`;
  const speakerDocBtn = document.getElementById('btn-speaker-doctor');
  if (speakerDocBtn) speakerDocBtn.innerHTML = `<i class="fa-solid fa-user-doctor"></i> <span id="label-doctor-speaks-btn">${dict.doctorSpeaksBtn}</span>`;
  const typeTurnBtn = document.getElementById('btn-open-text-turn');
  if (typeTurnBtn) typeTurnBtn.innerHTML = `<i class="fa-solid fa-keyboard"></i> <span id="label-type-btn">${dict.typeTurnBtn}</span>`;
  const recInstr = document.getElementById('record-instruction');
  if (recInstr) recInstr.textContent = dict.recordTurnInstruction;

  // Review Draft View
  const draftTitle = document.getElementById('draft-review-title');
  if (draftTitle) draftTitle.textContent = dict.reviewDraftTitle;
  const discTitle = document.getElementById('ai-disclaimer-title');
  if (discTitle) discTitle.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${dict.aiDraftDisclaimerTitle}`;
  const discDesc = document.getElementById('ai-disclaimer-desc');
  if (discDesc) discDesc.textContent = dict.aiDraftDisclaimerText;
  const talkTitle = document.getElementById('talk-ai-title');
  if (talkTitle) talkTitle.textContent = dict.talkToAiTitle;
  const talkDesc = document.getElementById('talk-ai-desc');
  if (talkDesc) talkDesc.textContent = dict.talkToAiDesc;
  const docAiInput = document.getElementById('input-doctor-ai-text');
  if (docAiInput) docAiInput.placeholder = dict.talkToAiPlaceholder;
  const submitDocAiBtn = document.getElementById('btn-submit-doctor-ai');
  if (submitDocAiBtn) submitDocAiBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> <span id="label-send-btn">${dict.sendBtn}</span>`;
  const vitalsTitle = document.getElementById('vitals-card-title');
  if (vitalsTitle) vitalsTitle.innerHTML = `<i class="fa-solid fa-heart-pulse" style="color: var(--primary-green); margin-right: 6px;"></i> ${dict.patientVitalsTitle}`;
  const vitalsSub = document.getElementById('vitals-card-sub');
  if (vitalsSub) vitalsSub.textContent = dict.patientVitalsSubtitle;

  const lblWeight = document.getElementById('label-vitals-weight');
  if (lblWeight) lblWeight.textContent = dict.vitalsWeight;
  const lblHeight = document.getElementById('label-vitals-height');
  if (lblHeight) lblHeight.textContent = dict.vitalsHeight;
  const lblBp = document.getElementById('label-vitals-bp');
  if (lblBp) lblBp.textContent = dict.vitalsBp;
  const lblPulse = document.getElementById('label-vitals-pulse');
  if (lblPulse) lblPulse.textContent = dict.vitalsPulse;
  const lblTemp = document.getElementById('label-vitals-temp');
  if (lblTemp) lblTemp.textContent = dict.vitalsTemp;
  const lblSpo2 = document.getElementById('label-vitals-spo2');
  if (lblSpo2) lblSpo2.textContent = dict.vitalsSpo2;

  const lblNextCons = document.getElementById('label-draft-next-consultation');
  if (lblNextCons) lblNextCons.textContent = dict.recommendedNextConsultationTitle;
  const lblNextDate = document.getElementById('label-draft-next-date');
  if (lblNextDate) lblNextDate.textContent = dict.recommendedNextDateLabel;

  const symTitle = document.getElementById('symptoms-card-title');
  if (symTitle) symTitle.textContent = dict.symptomsTitle;
  const assessTitle = document.getElementById('assessment-card-title');
  if (assessTitle) assessTitle.textContent = dict.physicianAssessmentTitle;
  const lblDiag = document.getElementById('label-draft-diagnosis');
  if (lblDiag) lblDiag.textContent = dict.doctorDiagnosisLabel;
  const diagInp = document.getElementById('draft-diagnosis');
  if (diagInp) diagInp.placeholder = dict.doctorDiagnosisPlaceholder;
  const lblNotes = document.getElementById('label-draft-notes');
  if (lblNotes) lblNotes.textContent = dict.doctorNotesLabel;
  const notesInp = document.getElementById('draft-notes');
  if (notesInp) notesInp.placeholder = dict.doctorNotesPlaceholder;

  const prescTitle = document.getElementById('prescriptions-card-title');
  if (prescTitle) prescTitle.textContent = dict.prescriptionsTitle;
  const addPrescBtn = document.getElementById('btn-add-prescription');
  if (addPrescBtn) addPrescBtn.innerHTML = `<i class="fa-solid fa-plus"></i> <span id="label-add-medicine">${dict.addMedicineBtn}</span>`;
  const approveBtn = document.getElementById('btn-approve-record');
  if (approveBtn) approveBtn.innerHTML = `<i class="fa-solid fa-check-double"></i> <span id="label-approve-record">${dict.approveRecordBtn}</span>`;

  // Follow-up View
  const appTitle = document.getElementById('approval-title');
  if (appTitle) appTitle.textContent = dict.recordApprovedTitle;
  const appSub = document.getElementById('approval-subtitle');
  if (appSub) appSub.textContent = dict.recordApprovedSubtitle;
  const fuCardTitle = document.getElementById('followup-card-title');
  if (fuCardTitle) fuCardTitle.textContent = dict.scheduleFollowupTitle;
  const lblFuDate = document.getElementById('label-followup-date');
  if (lblFuDate) lblFuDate.textContent = dict.followupDateLabel;
  const lblFuNotes = document.getElementById('label-followup-notes');
  if (lblFuNotes) lblFuNotes.textContent = dict.followupNotesLabel;
  const fuNotes = document.getElementById('followup-notes');
  if (fuNotes) fuNotes.placeholder = dict.followupNotesPlaceholder;
  const schedFuBtn = document.getElementById('btn-schedule-followup');
  if (schedFuBtn) schedFuBtn.innerHTML = `<i class="fa-solid fa-calendar-check"></i> <span id="label-schedule-followup">${dict.scheduleFollowupBtn}</span>`;
  const finConsBtn = document.getElementById('btn-finish-consultation');
  if (finConsBtn) finConsBtn.innerHTML = `<i class="fa-solid fa-house"></i> <span id="label-return-dashboard">${dict.returnDashboardBtn}</span>`;

  // Settings Modal
  const setModalTitle = document.getElementById('modal-settings-title');
  if (setModalTitle) setModalTitle.textContent = dict.settingsModalTitle;
  const lblSetDocName = document.getElementById('label-setting-doc-name');
  if (lblSetDocName) lblSetDocName.textContent = dict.settingDocNameLabel;
  const lblSetDocCreds = document.getElementById('label-setting-doc-creds');
  if (lblSetDocCreds) lblSetDocCreds.textContent = dict.settingDocCredsLabel;
  const lblSetDocLang = document.getElementById('label-setting-doc-lang');
  if (lblSetDocLang) lblSetDocLang.textContent = dict.settingDocLangLabel;
  const saveSetBtn = document.getElementById('btn-save-settings');
  if (saveSetBtn) saveSetBtn.textContent = dict.saveSettingsBtn;
};

/**
 * Applies UI localization for the Patient Onboarding Form based on the language chosen by the patient.
 */
window.applyPatientOnboardingLanguage = function(langCode = 'hi-IN') {
  const dict = window.I18N_DICTIONARY[langCode] || window.I18N_DICTIONARY['hi-IN'] || window.I18N_DICTIONARY['en-IN'];
  if (!dict) return;

  const activeLangBadge = document.getElementById('intake-active-lang-badge');
  if (activeLangBadge) activeLangBadge.textContent = dict.intakeHeaderSub;
  const changeLangBtn = document.getElementById('btn-change-onboard-lang');
  if (changeLangBtn) changeLangBtn.innerHTML = `<i class="fa-solid fa-rotate"></i> ${dict.changeLangBtn}`;
  const playTtsBtn = document.getElementById('btn-play-intake-tts');
  if (playTtsBtn) playTtsBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> <span id="label-listen-aloud">${dict.listenAloudBtn}</span>`;

  const typeInp = document.getElementById('input-intake-text');
  if (typeInp) typeInp.placeholder = dict.intakeTypePlaceholder;
  const submitTextBtn = document.getElementById('btn-submit-intake-text');
  if (submitTextBtn) submitTextBtn.innerHTML = `<span id="label-intake-next">${dict.intakeNextBtn}</span> <i class="fa-solid fa-arrow-right"></i>`;

  const completeEarlyBtn = document.getElementById('btn-finish-intake-early');
  if (completeEarlyBtn) completeEarlyBtn.innerHTML = `<i class="fa-solid fa-check"></i> <span id="label-intake-complete">${dict.intakeCompleteBtn}</span>`;

  // Live Autofill Preview Card
  const autofillTitle = document.getElementById('autofill-header-title');
  if (autofillTitle) autofillTitle.innerHTML = `<i class="fa-solid fa-file-waveform" style="color: var(--primary-green); margin-right: 6px;"></i> ${dict.autofillCardTitle}`;
  const autofillSync = document.getElementById('autofill-sync-badge');
  if (autofillSync) autofillSync.innerHTML = `<i class="fa-solid fa-bolt" style="font-size: 9px;"></i> ${dict.autofillSyncBadge}`;

  const lblName = document.getElementById('autofill-label-name');
  if (lblName) lblName.textContent = dict.autofillLabelName;
  const lblAge = document.getElementById('autofill-label-age');
  if (lblAge) lblAge.textContent = dict.autofillLabelAge;
  const lblPhone = document.getElementById('autofill-label-phone');
  if (lblPhone) lblPhone.textContent = dict.autofillLabelPhone;
  const lblComplaint = document.getElementById('autofill-label-complaint');
  if (lblComplaint) lblComplaint.textContent = dict.autofillLabelComplaint;
  const lblHistory = document.getElementById('autofill-label-history');
  if (lblHistory) lblHistory.textContent = dict.autofillLabelHistory;
  const lblAllergies = document.getElementById('autofill-label-allergies');
  if (lblAllergies) lblAllergies.textContent = dict.autofillLabelAllergies;

  const micStatus = document.getElementById('intake-mic-status');
  if (micStatus && !micStatus.innerHTML.includes('fa-spinner')) {
    micStatus.textContent = dict.micTapToSpeak;
  }
};

/**
 * Universal app language switcher: triggers instant UI update and caches preference.
 */
window.switchAppLanguage = function(langCode) {
  localStorage.setItem('swasthya_selected_lang', langCode);
  window.applyDoctorLanguage(langCode);
};

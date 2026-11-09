/**
 * SwasthyaSetu UI Localization Dictionary & Cache
 * Supports dynamic cached UI translation in English (en-IN), Hindi (hi-IN), and Marathi (mr-IN).
 * - Doctor UI reflects doctor's preferred language from settings.
 * - Patient Form Filling UI reflects patient's chosen language.
 */

window.I18N_DICTIONARY = {
  'en-IN': {
    brandSubtitle: 'Clinical Communication Portal',
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
    reviewDraftTitle: 'Review Consultation Draft',
    aiDraftDisclaimerTitle: 'AI-GENERATED DRAFT — PENDING DOCTOR REVIEW',
    aiDraftDisclaimerText: 'The AI never diagnoses or prescribes autonomously. Doctor review and confirmation are legally required.',
    talkToAiTitle: 'Talk to AI Scribe Assistant',
    talkToAiDesc: 'Dictate vitals (Weight, Height, BP, Pulse, Temp) or notes in English, Hindi, or Marathi',
    talkToAiPlaceholder: 'e.g. Weight 70 kg, height 175 cm, BP 120/80 mmHg, pulse 74...',
    sendBtn: 'Send',
    patientVitalsTitle: 'Patient Vitals',
    patientVitalsSubtitle: 'Auto-filled by AI / Editable',
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
    listenAloudBtn: 'Listen Aloud (TTS)',
    intakeTypePlaceholder: 'Or type answer here...',
    intakeNextBtn: 'Next',
    intakeCompleteBtn: 'Complete & Submit Form',
    autofillCardTitle: 'Live Autofilled Intake Form',
    autofillSyncBadge: 'Syncing in Real Time',
    autofillLabelName: 'Full Name',
    autofillLabelAge: 'Age & Gender',
    autofillLabelPhone: 'Mobile Number',
    autofillLabelComplaint: 'Chief Complaint',
    autofillLabelHistory: 'Past History & Chronic Conditions',
    autofillLabelAllergies: 'Known Allergies & Regular Medications',
    micTapToSpeak: 'Tap mic to speak your answer',
  },

  'hi-IN': {
    brandSubtitle: 'क्लिनिकल संवाद एवं परामर्श पोर्टल',
    doctorSettingsTooltip: 'डॉक्टर और ऐप सेटिंग्स',
    doctorCreds: 'एमबीबीएस, एमडी (जनरल मेडिसिन)',
    primaryLangPrefix: 'प्राथमिक भाषा: ',
    searchPatientsPlaceholder: 'मरीज़ का नाम या मोबाइल नंबर खोजें...',
    onboardPatientBtn: 'मरीज़ जोड़ें',
    registeredPatientsTitle: 'पंजीकृत मरीज़',
    registeredSuffix: ' पंजीकृत',
    noPatientsText: 'अभी तक कोई मरीज़ पंजीकृत नहीं है। "मरीज़ जोड़ें" पर टैप करें।',
    patientProfileTitle: 'मरीज़ प्रोफ़ाइल',
    preferredLangLabel: 'पसंदीदा भाषा:',
    intakeSummaryLabel: 'प्रारंभिक सारांश:',
    startConsultationBtn: 'परामर्श शुरू करें',
    medicalHistoryTitle: 'चिकित्सा इतिहास और रिपोर्ट्स',
    noReportsText: 'इस मरीज़ के लिए अभी तक कोई मेडिकल रिपोर्ट दर्ज नहीं है।',
    viewFullReportBtn: 'पूरी रिपोर्ट देखें',
    officialApprovedBadge: 'स्वीकृत आधिकारिक रिकॉर्ड',
    draftBadge: 'समीक्षाधीन ड्राफ्ट',
    consultationTitle: 'परामर्श सत्र',
    activeSessionBadge: 'सक्रिय सत्र',
    generateAiReportBtn: 'एआई रिपोर्ट बनाएं',
    patientSpeaksBtn: 'मरीज़ बोलेगा',
    doctorSpeaksBtn: 'डॉक्टर बोलेंगे',
    doctorSpeakingInLabel: 'डॉक्टर की बोलने की भाषा:',
    turnDirectionDoctor: 'डॉक्टर बोलेंगे ({docLang}) ➔ मरीज़ सुनेंगे ({patLang})',
    turnDirectionPatient: 'मरीज़ बोलेंगे ({patLang}) ➔ डॉक्टर सुनेंगे ({docLang})',
    typeTurnBtn: 'टाइप करें',
    recordTurnInstruction: 'अपनी भाषा में बोलने के लिए माइक टैप करें',
    reviewDraftTitle: 'परामर्श ड्राफ्ट समीक्षा',
    aiDraftDisclaimerTitle: 'एआई-निर्मित ड्राफ्ट — डॉक्टर समीक्षा लंबित',
    aiDraftDisclaimerText: 'एआई कभी भी स्वतंत्र रूप से निदान या दवा नहीं लिखता। डॉक्टर द्वारा समीक्षा और पुष्टि कानूनी रूप से आवश्यक है।',
    talkToAiTitle: 'एआई स्क्राइब सहायक से बात करें',
    talkToAiDesc: 'वाइटल्स (वजन, लंबाई, बीपी, पल्स) या नोट्स हिंदी, मराठी या अंग्रेजी में बोलें या लिखें',
    talkToAiPlaceholder: 'उदा. वजन 70 किलो, लंबाई 175 सेमी, बीपी 120/80, पल्स 74...',
    sendBtn: 'भेजें',
    patientVitalsTitle: 'मरीज़ के वाइटल्स',
    patientVitalsSubtitle: 'एआई द्वारा स्वतः भरा गया / संपादन योग्य',
    vitalsWeight: 'वजन (किग्रा)',
    vitalsHeight: 'लंबाई (सेमी)',
    vitalsBp: 'रक्तचाप (BP)',
    vitalsPulse: 'नाड़ी (पल्स bpm)',
    vitalsTemp: 'तापमान (°F)',
    vitalsSpo2: 'ऑक्सीजन (SpO2 %)',
    recommendedNextConsultationTitle: 'अगले परामर्श की अनुशंसित तिथि',
    recommendedNextDateLabel: 'तारीख:',
    symptomsTitle: 'मरीज़ द्वारा बताए गए लक्षण',
    physicianAssessmentTitle: 'चिकित्सक मूल्यांकन',
    doctorDiagnosisLabel: 'डॉक्टर निदान *',
    doctorDiagnosisPlaceholder: 'पुष्ट नैदानिक निदान दर्ज करें...',
    doctorNotesLabel: 'डॉक्टर क्लिनिकल नोट्स',
    doctorNotesPlaceholder: 'निरीक्षण, आराम की सलाह और आहार निर्देश दर्ज करें...',
    prescriptionsTitle: 'निर्धारित दवाइयाँ',
    addMedicineBtn: 'दवा जोड़ें',
    approveRecordBtn: 'रिकॉर्ड स्वीकृत और अंतिम रूप दें',
    recordApprovedTitle: 'क्लिनिकल रिकॉर्ड स्वीकृत',
    recordApprovedSubtitle: 'मेडिकल रिकॉर्ड सुरक्षित रूप से प्रमाणित अंग्रेजी में सहेजा गया।',
    scheduleFollowupTitle: 'अगला परामर्श शेड्यूल करें',
    followupDateLabel: 'अनुवर्ती परामर्श तिथि *',
    followupNotesLabel: 'अनुवर्ती निर्देश (परामर्श हेतु)',
    followupNotesPlaceholder: 'उदा. यदि 3 दिन बाद भी बुखार रहे तो दिखाएं',
    scheduleFollowupBtn: 'परामर्श शेड्यूल करें',
    returnDashboardBtn: 'डैशबोर्ड पर लौटें',
    reportModalTitle: 'आधिकारिक मेडिकल रिपोर्ट',
    patientDetailsHeader: 'मरीज़ का विवरण',
    attendingPhysicianHeader: 'उपचारक चिकित्सक',
    printReportBtn: 'प्रिंट / पीडीएफ सेव करें',
    closeBtn: 'बंद करें',
    settingsModalTitle: 'डॉक्टर और ऐप सेटिंग्स',
    settingDocNameLabel: 'डॉक्टर का पूरा नाम',
    settingDocCredsLabel: 'डॉक्टर की डिग्री / योग्यता',
    settingDocLangLabel: 'डॉक्टर की प्राथमिक भाषा',
    saveSettingsBtn: 'सेटिंग्स सहेजें',
    cancelBtn: 'रद्द करें',
    // Patient Onboarding Form Elements
    intakeHeaderSub: 'भाषा: हिन्दी',
    changeLangBtn: 'भाषा बदलें',
    listenAloudBtn: 'सुनें (TTS)',
    intakeTypePlaceholder: 'या यहाँ टाइप करें...',
    intakeNextBtn: 'आगे बढ़ें',
    intakeCompleteBtn: 'फॉर्म पूरा करें और जमा करें',
    autofillCardTitle: 'लाइव स्वचालित भरा फॉर्म',
    autofillSyncBadge: 'रीयल-टाइम में सिंक हो रहा है',
    autofillLabelName: 'पूरा नाम',
    autofillLabelAge: 'उम्र और लिंग',
    autofillLabelPhone: 'मोबाइल नंबर',
    autofillLabelComplaint: 'मुख्य समस्या और अवधि',
    autofillLabelHistory: 'पिछला मेडिकल इतिहास',
    autofillLabelAllergies: 'दवा एलर्जी और वर्तमान दवाएं',
    micTapToSpeak: 'बोलने के लिए माइक दबाएँ',
  },

  'mr-IN': {
    brandSubtitle: 'क्लिनिकल संभाषण व सल्लामसलत पोर्टल',
    doctorSettingsTooltip: 'डॉक्टर आणि ॲप सेटिंग्ज',
    doctorCreds: 'एमबीबीएस, एमडी (जनरल मेडिसिन)',
    primaryLangPrefix: 'प्राथमिक भाषा: ',
    searchPatientsPlaceholder: 'रुग्णाचे नाव किंवा फोन नंबर शोधा...',
    onboardPatientBtn: 'नवीन रुग्ण नोंदणी',
    registeredPatientsTitle: 'नोंदणीकृत रुग्ण',
    registeredSuffix: ' नोंदणीकृत',
    noPatientsText: 'अद्याप कोणताही रुग्ण नोंदणीकृत नाही. नोंदणीसाठी "नवीन रुग्ण नोंदणी" वर टॅप करा.',
    patientProfileTitle: 'रुग्ण तपशील प्रोफाइल',
    preferredLangLabel: 'पसंतीची भाषा:',
    intakeSummaryLabel: 'नोंदणी सारांश:',
    startConsultationBtn: 'सल्लामसलत सुरू करा',
    medicalHistoryTitle: 'वैद्यकीय इतिहास आणि अहवाल',
    noReportsText: 'या रुग्णासाठी अद्याप कोणताही वैद्यकीय अहवाल नोंदवला गेलेला नाही.',
    viewFullReportBtn: 'पूर्ण अहवाल पहा',
    officialApprovedBadge: 'प्रमाणित मंजूर वैद्यकीय नोंद',
    draftBadge: 'पुनरावलोकन मसुदा',
    consultationTitle: 'सल्लामसलत सत्र',
    activeSessionBadge: 'सक्रिय सत्र',
    generateAiReportBtn: 'एआय अहवाल तयार करा',
    patientSpeaksBtn: 'रुग्ण बोलेल',
    doctorSpeaksBtn: 'डॉक्टर बोलतील',
    doctorSpeakingInLabel: 'डॉक्टर बोलण्याची भाषा:',
    turnDirectionDoctor: 'डॉक्टर बोलतील ({docLang}) ➔ रुग्ण ऐकतील ({patLang})',
    turnDirectionPatient: 'रुग्ण बोलतील ({patLang}) ➔ डॉक्टर ऐकतील ({docLang})',
    typeTurnBtn: 'टाईप करा',
    recordTurnInstruction: 'आपल्या भाषेत बोलण्यासाठी माइकवर टॅप करा',
    reviewDraftTitle: 'सल्लामसलत मसुदा पुनरावलोकन',
    aiDraftDisclaimerTitle: 'एआय-निर्मित मसुदा — डॉक्टर पुनरावलोकन प्रलंबित',
    aiDraftDisclaimerText: 'एआय कधीही स्वायत्तपणे निदान किंवा औषधोपचार ठरवत नाही. डॉक्टरांचे पुनरावलोकन आणि पुष्टीकरण अनिवार्य आहे.',
    talkToAiTitle: 'एआय स्क्राइब सहाय्यकाशी बोला',
    talkToAiDesc: 'वजन, उंची, बीपी, नाडी किंवा इतर सूचना मराठी, हिंदी किंवा इंग्रजीत बोला किंवा टाईप करा',
    talkToAiPlaceholder: 'उदा. वजन ७० किलो, उंची १७५ सेमी, बीपी १२०/८०, नाडी ७४...',
    sendBtn: 'पाठवा',
    patientVitalsTitle: 'रुग्णाची महत्त्वाची लक्षणे (Vitals)',
    patientVitalsSubtitle: 'एआय द्वारे स्वयंचलित भरलेले / संपादनक्षम',
    vitalsWeight: 'वजन (किलो)',
    vitalsHeight: 'उंची (सेमी)',
    vitalsBp: 'रक्तदाब (BP)',
    vitalsPulse: 'नाडी (पल्स bpm)',
    vitalsTemp: 'तापमान (°F)',
    vitalsSpo2: 'ऑक्सिजन (SpO2 %)',
    recommendedNextConsultationTitle: 'पुढील भेटीची शिफारस तारीख',
    recommendedNextDateLabel: 'तारीख:',
    symptomsTitle: 'रुग्णाने सांगितलेली लक्षणे',
    physicianAssessmentTitle: 'डॉक्टरांचे मूल्यांकन',
    doctorDiagnosisLabel: 'डॉक्टरांचे निदान *',
    doctorDiagnosisPlaceholder: 'निश्चित वैद्यकीय निदान नोंदवा...',
    doctorNotesLabel: 'क्लिनिकल नोंदी आणि सल्ला',
    doctorNotesPlaceholder: 'तपासणी निरीक्षणे, विश्रांतीचा सल्ला आणि आहाराच्या सूचना...',
    prescriptionsTitle: 'औषधोपचार (Prescriptions)',
    addMedicineBtn: 'औषध जोडा',
    approveRecordBtn: 'नोंद मंजूर आणि अंतिम करा',
    recordApprovedTitle: 'वैद्यकीय नोंद मंजूर केली',
    recordApprovedSubtitle: 'वैद्यकीय अहवाल सुरक्षितपणे प्रमाणित इंग्रजीत जतन करण्यात आला आहे.',
    scheduleFollowupTitle: 'पुढील भेटीची वेळ निश्चित करा',
    followupDateLabel: 'पुढील तारीख *',
    followupNotesLabel: 'पुढील सूचना (फक्त भेटीसाठी)',
    followupNotesPlaceholder: 'उदा. ताप न उतरल्यास ३ दिवसांनी पुन्हा दाखवा',
    scheduleFollowupBtn: 'वेळ निश्चित करा',
    returnDashboardBtn: 'डॅशबोर्डवर परत जा',
    reportModalTitle: 'अधिकृत वैद्यकीय अहवाल',
    patientDetailsHeader: 'रुग्णाचा तपशील',
    attendingPhysicianHeader: 'तपासणारे डॉक्टर',
    printReportBtn: 'प्रिंट / पीडीएफ सेव्ह करा',
    closeBtn: 'बंद करा',
    settingsModalTitle: 'डॉक्टर आणि ॲप सेटिंग्ज',
    settingDocNameLabel: 'डॉक्टरांचे पूर्ण नाव',
    settingDocCredsLabel: 'डॉक्टरांची पदवी / पात्रता',
    settingDocLangLabel: 'डॉक्टरांची प्राथमिक भाषा',
    saveSettingsBtn: 'सेटिंग्ज जतन करा',
    cancelBtn: 'रद्द करा',
    // Patient Onboarding Form Elements
    intakeHeaderSub: 'भाषा: मराठी',
    changeLangBtn: 'भाषा बदला',
    listenAloudBtn: 'मोठ्याने ऐका (TTS)',
    intakeTypePlaceholder: 'किंवा येथे टाइप करा...',
    intakeNextBtn: 'पुढे जा',
    intakeCompleteBtn: 'फॉर्म पूर्ण करा आणि सबमिट करा',
    autofillCardTitle: 'थेट स्वयंचलित भरलेला फॉर्म',
    autofillSyncBadge: 'रिअल-टाइममध्ये सिंक होत आहे',
    autofillLabelName: 'पूर्ण नाव',
    autofillLabelAge: 'वय आणि लिंग',
    autofillLabelPhone: 'मोबाईल नंबर',
    autofillLabelComplaint: 'मुख्य त्रास व कालावधी',
    autofillLabelHistory: 'मागील आजार आणि इतिहास',
    autofillLabelAllergies: 'औषध अलर्जी व चालू औषधे',
    micTapToSpeak: 'बोलण्यासाठी माइकवर टॅप करा',
  },
};

/**
 * Applies UI localization for the Doctor's interface based on doctor's preferred language.
 * Cached locally for zero-latency instant rendering.
 */
window.applyDoctorLanguage = function(langCode = 'en-IN') {
  const dict = window.I18N_DICTIONARY[langCode] || window.I18N_DICTIONARY['en-IN'];
  if (!dict) return;

  // Header & Brand
  const brandSub = document.querySelector('.brand-subtitle');
  if (brandSub) brandSub.textContent = dict.brandSubtitle;
  const btnSettings = document.getElementById('btn-open-settings');
  if (btnSettings) btnSettings.title = dict.doctorSettingsTooltip;

  // Dashboard
  const searchInput = document.getElementById('input-patient-search');
  if (searchInput) searchInput.placeholder = dict.searchPatientsPlaceholder;
  const addPatientBtn = document.getElementById('btn-add-patient');
  if (addPatientBtn) addPatientBtn.innerHTML = `<i class="fa-solid fa-user-plus"></i> ${dict.onboardPatientBtn}`;
  const regTitle = document.getElementById('dash-registered-title');
  if (regTitle) regTitle.textContent = dict.registeredPatientsTitle;

  // Patient Profile
  const detailTitle = document.getElementById('detail-patient-name');
  if (detailTitle && (!detailTitle.dataset.nameSet)) detailTitle.textContent = dict.patientProfileTitle;
  const prefLangLabel = document.getElementById('label-pref-lang');
  if (prefLangLabel) prefLangLabel.textContent = dict.preferredLangLabel;
  const startConsBtn = document.getElementById('btn-start-consultation');
  if (startConsBtn) startConsBtn.innerHTML = `<i class="fa-solid fa-play"></i> ${dict.startConsultationBtn}`;
  const medHistTitle = document.getElementById('header-medical-history');
  if (medHistTitle) medHistTitle.innerHTML = `<i class="fa-solid fa-notes-medical" style="color: var(--primary-teal); margin-right: 6px;"></i> ${dict.medicalHistoryTitle}`;

  // Consultation View
  const consPatientTitle = document.getElementById('cons-patient-title');
  if (consPatientTitle && !consPatientTitle.dataset.titleSet) consPatientTitle.textContent = dict.consultationTitle;
  const consStatusBadge = document.getElementById('cons-status-badge');
  if (consStatusBadge) consStatusBadge.textContent = dict.activeSessionBadge;
  const genReportBtn = document.getElementById('btn-review-draft');
  if (genReportBtn) genReportBtn.innerHTML = `<i class="fa-solid fa-file-waveform"></i> ${dict.generateAiReportBtn}`;
  const speakerPatBtn = document.getElementById('btn-speaker-patient');
  if (speakerPatBtn) speakerPatBtn.innerHTML = `<i class="fa-solid fa-user"></i> ${dict.patientSpeaksBtn}`;
  const speakerDocBtn = document.getElementById('btn-speaker-doctor');
  if (speakerDocBtn) speakerDocBtn.innerHTML = `<i class="fa-solid fa-user-doctor"></i> ${dict.doctorSpeaksBtn}`;
  const typeTurnBtn = document.getElementById('btn-open-text-turn');
  if (typeTurnBtn) typeTurnBtn.innerHTML = `<i class="fa-solid fa-keyboard"></i> ${dict.typeTurnBtn}`;
  const recInstr = document.getElementById('record-instruction');
  if (recInstr) recInstr.textContent = dict.recordTurnInstruction;

  // Review Draft View
  const draftTitle = document.getElementById('draft-review-title');
  if (draftTitle) draftTitle.textContent = dict.reviewDraftTitle;
  const discTitle = document.getElementById('ai-disclaimer-title');
  if (discTitle) discTitle.textContent = dict.aiDraftDisclaimerTitle;
  const discDesc = document.getElementById('ai-disclaimer-desc');
  if (discDesc) discDesc.textContent = dict.aiDraftDisclaimerText;
  const talkTitle = document.getElementById('talk-ai-title');
  if (talkTitle) talkTitle.textContent = dict.talkToAiTitle;
  const talkDesc = document.getElementById('talk-ai-desc');
  if (talkDesc) talkDesc.textContent = dict.talkToAiDesc;
  const docAiInput = document.getElementById('input-doctor-ai-text');
  if (docAiInput) docAiInput.placeholder = dict.talkToAiPlaceholder;
  const submitDocAiBtn = document.getElementById('btn-submit-doctor-ai');
  if (submitDocAiBtn) submitDocAiBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> ${dict.sendBtn}`;
  const vitalsTitle = document.getElementById('vitals-card-title');
  if (vitalsTitle) vitalsTitle.innerHTML = `<i class="fa-solid fa-heart-pulse" style="color: #e11d48; margin-right: 6px;"></i> ${dict.patientVitalsTitle}`;
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
  if (addPrescBtn) addPrescBtn.innerHTML = `<i class="fa-solid fa-plus"></i> ${dict.addMedicineBtn}`;
  const approveBtn = document.getElementById('btn-approve-record');
  if (approveBtn) approveBtn.innerHTML = `<i class="fa-solid fa-check-double"></i> ${dict.approveRecordBtn}`;

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
  if (schedFuBtn) schedFuBtn.innerHTML = `<i class="fa-solid fa-calendar-check"></i> ${dict.scheduleFollowupBtn}`;
  const finConsBtn = document.getElementById('btn-finish-consultation');
  if (finConsBtn) finConsBtn.innerHTML = `<i class="fa-solid fa-house"></i> ${dict.returnDashboardBtn}`;

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
  if (playTtsBtn) playTtsBtn.innerHTML = `<i class="fa-solid fa-volume-high"></i> ${dict.listenAloudBtn}`;

  const typeInp = document.getElementById('input-intake-text');
  if (typeInp) typeInp.placeholder = dict.intakeTypePlaceholder;
  const submitTextBtn = document.getElementById('btn-submit-intake-text');
  if (submitTextBtn) submitTextBtn.innerHTML = `<i class="fa-solid fa-arrow-right"></i> ${dict.intakeNextBtn}`;

  const completeEarlyBtn = document.getElementById('btn-finish-intake-early');
  if (completeEarlyBtn) completeEarlyBtn.innerHTML = `<i class="fa-solid fa-check"></i> ${dict.intakeCompleteBtn}`;

  // Live Autofill Preview Card
  const autofillTitle = document.getElementById('autofill-header-title');
  if (autofillTitle) autofillTitle.innerHTML = `<i class="fa-solid fa-file-waveform" style="color: var(--primary-teal); margin-right: 6px;"></i> ${dict.autofillCardTitle}`;
  const autofillSync = document.getElementById('autofill-sync-badge');
  if (autofillSync) autofillSync.textContent = dict.autofillSyncBadge;

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

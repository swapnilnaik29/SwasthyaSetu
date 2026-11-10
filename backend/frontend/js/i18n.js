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
    autofillPending: 'उत्तराची प्रतीक्षा...',
    micTapToSpeak: 'माइक दाबून उत्तर बोला',
  },

  'gu-IN': {
    brandSubtitle: 'ક્લિનિકલ કમ્યુનિકેશન પોર્ટલ',
    doctorSettingsTooltip: 'ડૉક્ટર અને ઍપ સેટિંગ્સ',
    doctorCreds: 'MBBS, MD (જનરલ મેડિસિન)',
    primaryLangPrefix: 'પ્રાથમિક: ',
    searchPatientsPlaceholder: 'દર્દીનું નામ અથવા મોબાઇલ નંબર શોધો...',
    onboardPatientBtn: 'નવા દર્દી ઉમેરો',
    registeredPatientsTitle: 'નોંધાયેલા દર્દીઓ',
    registeredSuffix: ' નોંધાયેલા',
    noPatientsText: 'હજુ કોઈ દર્દી નોંધાયેલ નથી. નવા દર્દી નોંધવા "નવા દર્દી ઉમેરો" દબાવો.',
    patientProfileTitle: 'દર્દી પ્રોફાઇલ',
    preferredLangLabel: 'પસંદગીની ભાષા:',
    intakeSummaryLabel: 'ઇનટેક સારાંશ:',
    startConsultationBtn: 'કન્સલ્ટેશન શરૂ કરો',
    medicalHistoryTitle: 'તબીબી ઇતિહાસ અને અહેવાલો',
    noReportsText: 'આ દર્દી માટે હજી કોઈ ક્લિનિકલ રિપોર્ટ નથી.',
    viewFullReportBtn: 'સંપૂર્ણ રિપોર્ટ જુઓ',
    officialApprovedBadge: 'સત્તાવાર મંજૂર રેકોર્ડ',
    draftBadge: 'ડ્રાફ્ટ પ્રગતિમાં',
    consultationTitle: 'કન્સલ્ટેશન',
    activeSessionBadge: 'સક્રિય સત્ર',
    generateAiReportBtn: 'AI રિપોર્ટ બનાવો',
    patientSpeaksBtn: 'દર્દી બોલે છે',
    doctorSpeaksBtn: 'ડૉક્ટર બોલે છે',
    doctorSpeakingInLabel: 'ડૉક્ટર બોલવાની ભાષા:',
    turnDirectionDoctor: 'ડૉક્ટર બોલે છે ➔ દર્દી સાંભળે છે',
    turnDirectionPatient: 'દર્દી બોલે છે ➔ ડૉક્ટર સાંભળે છે',
    typeTurnBtn: 'ટાઇપ કરો',
    recordTurnInstruction: 'તમારી ભાષામાં બોલવા માટે માઇક દબાવો',
    reviewDraftTitle: 'ક્લિનિકલ ડ્રાફ્ટ રિવ્યૂ',
    aiDraftDisclaimerTitle: 'AI-જનરેટેડ ડ્રાફ્ટ — ડૉક્ટર રિવ્યૂ જરૂરી',
    aiDraftDisclaimerText: 'AI ક્યારેય સ્વતંત્ર રીતે નિદાન કે દવાઓ નક્કી કરતું નથી. ડૉક્ટર સમીક્ષા કાનૂની રીતે જરૂરી છે.',
    talkToAiTitle: 'AI ક્લિનિકલ આસિસ્ટન્ટ',
    talkToAiDesc: 'વાઇટલ્સ (વજન, ઊંચાઈ, BP, પલ્સ, તાપમાન) બોલો',
    talkToAiPlaceholder: 'દા.ત. વજન 70 કિલો, ઊંચાઈ 175 સેમી, BP 120/80...',
    sendBtn: 'મોકલો',
    patientVitalsTitle: 'દર્દી વાઇટલ્સ',
    patientVitalsSubtitle: 'સ્વતઃ ભરેલ / સંપાદનયોગ્ય',
    vitalsWeight: 'વજન (કિગ્રા)',
    vitalsHeight: 'ઊંચાઈ (સેમી)',
    vitalsBp: 'બ્લડ પ્રેશર (BP)',
    vitalsPulse: 'પલ્સ (bpm)',
    vitalsTemp: 'તાપમાન (°F)',
    vitalsSpo2: 'SpO2 (%)',
    recommendedNextConsultationTitle: 'આગામી મુલાકાતની ભલામણ',
    recommendedNextDateLabel: 'તારીખ:',
    symptomsTitle: 'દર્દીના લક્ષણો',
    physicianAssessmentTitle: 'ડૉક્ટરનું મૂલ્યાંકન',
    doctorDiagnosisLabel: 'ડૉક્ટરનું નિદાન *',
    doctorDiagnosisPlaceholder: 'પુષ્ટિ થયેલ નિદાન દાખલ કરો...',
    doctorNotesLabel: 'ડૉક્ટર ક્લિનિકલ નોંધો',
    doctorNotesPlaceholder: 'અવલોકનો, આરામ અને આહાર માર્ગદર્શન...',
    prescriptionsTitle: 'દવાઓ (પ્રિસ્ક્રિપ્શન)',
    addMedicineBtn: 'દવા ઉમેરો',
    approveRecordBtn: 'મંજૂર અને સાચવો',
    recordApprovedTitle: 'ક્લિનિકલ રેકોર્ડ મંજૂર',
    recordApprovedSubtitle: 'મેડિકલ રેકોર્ડ સુરક્ષિત રીતે અંગ્રેજીમાં સાચવેલ છે.',
    scheduleFollowupTitle: 'આગામી એપોઇન્ટમેન્ટ નક્કી કરો',
    followupDateLabel: 'તારીખ *',
    followupNotesLabel: 'સૂચનાઓ',
    followupNotesPlaceholder: 'દા.ત. 3 દિવસ પછી ફરી તપાસ',
    scheduleFollowupBtn: 'એપોઇન્ટમેન્ટ બુક કરો',
    returnDashboardBtn: 'ડૅશબોર્ડ પર પાછા જાઓ',
    reportModalTitle: 'સત્તાવાર તબીબી અહેવાલ',
    patientDetailsHeader: 'દર્દી વિગતો',
    attendingPhysicianHeader: 'તબીબ',
    printReportBtn: 'પ્રિન્ટ / PDF સાચવો',
    closeBtn: 'બંધ કરો',
    settingsModalTitle: 'ડૉક્ટર અને ઍપ સેટિંગ્સ',
    settingDocNameLabel: 'ડૉક્ટરનું પૂરું નામ',
    settingDocCredsLabel: 'ડિગ્રી અને વિગતો',
    settingDocLangLabel: 'ડૉક્ટરની પ્રાથમિક ભાષા',
    saveSettingsBtn: 'સેટિંગ્સ સાચવો',
    cancelBtn: 'રદ કરો',
    intakeHeaderSub: 'ભાષા: ગુજરાતી (ગુજરાતી)',
    changeLangBtn: 'ભાષા બદલો',
    listenAloudBtn: 'પ્રશ્ન સાંભળો',
    intakeTypePlaceholder: 'અથવા અહીં ઉત્તર લખો...',
    intakeNextBtn: 'આગળ',
    intakeCompleteBtn: 'ફોર્મ પૂર્ણ કરી સબમિટ કરો',
    autofillCardTitle: 'લાઇવ સ્વતઃ ભરેલ ઇનટેક ફોર્મ',
    autofillSyncBadge: 'લાઇવ સિંક',
    autofillLabelName: 'પૂરું નામ',
    autofillLabelAge: 'ઉંમર અને લિંગ',
    autofillLabelPhone: 'મોબાઇલ નંબર',
    autofillLabelComplaint: 'મુખ્ય ફરિયાદ / લક્ષણો',
    autofillLabelHistory: 'પાછલો તબીબી ઇતિહાસ',
    autofillLabelAllergies: 'એલર્જી અને દવાઓ',
    autofillPending: 'જવાબની રાહ જોઈ રહ્યા છીએ...',
    micTapToSpeak: 'માઇક દબાવી ઉત્તર બોલો',
  },

  'bn-IN': {
    brandSubtitle: 'ক্লিনিক্যাল কমিউনিকেশন পোর্টাল',
    doctorSettingsTooltip: 'ডাক্তার ও অ্যাপ সেটিংস',
    doctorCreds: 'MBBS, MD (জেনারেল মেডিসিন)',
    primaryLangPrefix: 'প্রাথমিক: ',
    searchPatientsPlaceholder: 'রোগীর নাম বা মোবাইল নম্বর খুঁজুন...',
    onboardPatientBtn: 'নতুন রোগী যোগ করুন',
    registeredPatientsTitle: 'নিবন্ধিত রোগী',
    registeredSuffix: ' নিবন্ধিত',
    noPatientsText: 'এখনও কোনো রোগী নিবন্ধিত নেই। "নতুন রোগী যোগ করুন" চাপুন।',
    patientProfileTitle: 'রোগীর প্রোফাইল',
    preferredLangLabel: 'পছন্দের ভাষা:',
    intakeSummaryLabel: 'সংক্ষিপ্ত বিবরণ:',
    startConsultationBtn: 'পরামর্শ শুরু করুন',
    medicalHistoryTitle: 'চিকিৎসার ইতিহাস ও রিপোর্ট',
    noReportsText: 'এই রোগীর এখনও কোনো রিপোর্ট নেই।',
    viewFullReportBtn: 'সম্পূর্ণ রিপোর্ট দেখুন',
    officialApprovedBadge: 'অনুমোদিত রেকর্ড',
    draftBadge: 'খসড়া চলছে',
    consultationTitle: 'পরামর্শ',
    activeSessionBadge: 'সক্রিয় সেশন',
    generateAiReportBtn: 'AI রিপোর্ট তৈরি করুন',
    patientSpeaksBtn: 'রোগী বলবেন',
    doctorSpeaksBtn: 'ডাক্তার বলবেন',
    doctorSpeakingInLabel: 'ডাক্তার বলার ভাষা:',
    turnDirectionDoctor: 'ডাক্তার বলছেন ➔ রোগী শুনছেন',
    turnDirectionPatient: 'রোগী বলছেন ➔ ডাক্তার শুনছেন',
    typeTurnBtn: 'টাইপ করুন',
    recordTurnInstruction: 'আপনার ভাষায় বলতে মাইক চাপুন',
    reviewDraftTitle: 'ক্লিনিক্যাল ড্রাফ্ট পর্যালোচনা',
    aiDraftDisclaimerTitle: 'AI-উৎপাদিত খসড়া — ডাক্তার পর্যালোচনা প্রয়োজন',
    aiDraftDisclaimerText: 'AI কখনোই স্বাধীনভাবে নির্ণয় বা প্রেসক্রিপশন দেয় না। ডাক্তারের পর্যালোচনা আইনত বাধ্যতামূলক।',
    talkToAiTitle: 'AI ক্লিনিক্যাল সহকারী',
    talkToAiDesc: 'ভাইটালস বা নোট বলুন',
    talkToAiPlaceholder: 'উদাঃ ওজন ৭০ কেজি, উচ্চতা ১৭৫ সেমি, বিপি ১২০/৮০...',
    sendBtn: 'পাঠান',
    patientVitalsTitle: 'রোগীর ভাইটালস',
    patientVitalsSubtitle: 'স্বয়ংক্রিয় পূরণ / সম্পাদনাযোগ্য',
    vitalsWeight: 'ওজন (কেজি)',
    vitalsHeight: 'উচ্চতা (সেমি)',
    vitalsBp: 'রক্তচাপ (BP)',
    vitalsPulse: 'পালস (bpm)',
    vitalsTemp: 'তাপমাত্রা (°F)',
    vitalsSpo2: 'SpO2 (%)',
    recommendedNextConsultationTitle: 'পরবর্তী পরামর্শের সুপারিশ',
    recommendedNextDateLabel: 'তারিখ:',
    symptomsTitle: 'উপসর্গ',
    physicianAssessmentTitle: 'চিকিৎসকের মূল্যায়ন',
    doctorDiagnosisLabel: 'ডাক্তারের নির্ণয় *',
    doctorDiagnosisPlaceholder: 'নিশ্চিত রোগ নির্ণয় লিখুন...',
    doctorNotesLabel: 'ডাক্তার ক্লিনিক্যাল নোট',
    doctorNotesPlaceholder: 'পর্যবেক্ষণ, বিশ্রাম ও পরামর্শ লিখুন...',
    prescriptionsTitle: 'প্রেসক্রিপশন',
    addMedicineBtn: 'ওষুধ যোগ করুন',
    approveRecordBtn: 'অনুমোদন ও সংরক্ষণ',
    recordApprovedTitle: 'ক্লিনিক্যাল রেকর্ড অনুমোদিত',
    recordApprovedSubtitle: 'মেডিকেল রেকর্ড নিরাপদে ইংরেজিতে সংরক্ষিত হয়েছে।',
    scheduleFollowupTitle: 'ফলো-আপ অ্যাপয়েন্টমেন্ট নির্ধারণ করুন',
    followupDateLabel: 'তারিখ *',
    followupNotesLabel: 'নির্দেশাবলী',
    followupNotesPlaceholder: 'উদাঃ ৩ দিন পর আবার দেখান',
    scheduleFollowupBtn: 'অ্যাপয়েন্টমেন্ট বুক করুন',
    returnDashboardBtn: 'ড্যাশবোর্ডে ফিরুন',
    reportModalTitle: 'অফিসিয়াল মেডিকেল রিপোর্ট',
    patientDetailsHeader: 'রোগীর বিবরণ',
    attendingPhysicianHeader: 'চিকিৎসক',
    printReportBtn: 'প্রিন্ট / PDF সংরক্ষণ',
    closeBtn: 'বন্ধ করুন',
    settingsModalTitle: 'ডাক্তার ও অ্যাপ সেটিংস',
    settingDocNameLabel: 'ডাক্তারের পুরো নাম',
    settingDocCredsLabel: 'ডিগ্রি ও তথ্য',
    settingDocLangLabel: 'ডাক্তারের প্রাথমিক ভাষা',
    saveSettingsBtn: 'সংরক্ষণ করুন',
    cancelBtn: 'বাতিল',
    intakeHeaderSub: 'ভাষা: বাংলা (বাংলা)',
    changeLangBtn: 'ভাষা পরিবর্তন',
    listenAloudBtn: 'প্রশ্ন শুনুন',
    intakeTypePlaceholder: 'অথবা এখানে উত্তর লিখুন...',
    intakeNextBtn: 'পরবর্তী',
    intakeCompleteBtn: 'ফর্ম সম্পন্ন ও জমা দিন',
    autofillCardTitle: 'লাইভ অটোফিল ইনটেক ফর্ম',
    autofillSyncBadge: 'লাইভ সিঙ্ক',
    autofillLabelName: 'পুরো নাম',
    autofillLabelAge: 'বয়স ও লিঙ্গ',
    autofillLabelPhone: 'মোবাইল নম্বর',
    autofillLabelComplaint: 'প্রধান সমস্যা / উপসর্গ',
    autofillLabelHistory: 'পূর্ববর্তী চিকিৎসার ইতিহাস',
    autofillLabelAllergies: 'অ্যালার্জি এবং ওষুধ',
    autofillPending: 'উত্তরের অপেক্ষায়...',
    micTapToSpeak: 'মাইক চেপে উত্তর বলুন',
  },

  'ta-IN': {
    brandSubtitle: 'மருத்துவ தொடர்பு போர்டல்',
    doctorSettingsTooltip: 'மருத்துவர் & பயன்பாட்டு அமைப்புகள்',
    doctorCreds: 'MBBS, MD (பொது மருத்துவம்)',
    primaryLangPrefix: 'முதன்மை: ',
    searchPatientsPlaceholder: 'நோயாளி பெயர் அல்லது கைபேசி எண் தேடவும்...',
    onboardPatientBtn: 'புதிய நோயாளி சேர்க்க',
    registeredPatientsTitle: 'பதிவுசெய்யப்பட்ட நோயாளிகள்',
    registeredSuffix: ' பதிவுசெய்யப்பட்டவர்',
    noPatientsText: 'நோயாளி எதுவும் இன்னும் பதிவு செய்யப்படவில்லை. "புதிய நோயாளி சேர்க்க" தட்டவும்.',
    patientProfileTitle: 'நோயாளி சுயவிவரம்',
    preferredLangLabel: 'விருப்பமான மொழி:',
    intakeSummaryLabel: 'சுருக்கம்:',
    startConsultationBtn: 'ஆலோசனை தொடங்கவும்',
    medicalHistoryTitle: 'மருத்துவ வரலாறு & அறிக்கைகள்',
    noReportsText: 'இந்த நோயாளிக்கு அறிக்கைகள் எதுவும் இல்லை.',
    viewFullReportBtn: 'முழு அறிக்கையைக் காண்க',
    officialApprovedBadge: 'அங்கீகரிக்கப்பட்ட பதிவு',
    draftBadge: 'வரைவு நடப்பில் உள்ளது',
    consultationTitle: 'ஆலோசனை',
    activeSessionBadge: 'செயலில் உள்ள அமர்வு',
    generateAiReportBtn: 'AI அறிக்கை உருவாக்கவும்',
    patientSpeaksBtn: 'நோயாளி பேசுகிறார்',
    doctorSpeaksBtn: 'மருத்துவர் பேசுகிறார்',
    doctorSpeakingInLabel: 'மருத்துவர் பேசும் மொழி:',
    turnDirectionDoctor: 'மருத்துவர் பேசுகிறார் ➔ நோயாளி கேட்கிறார்',
    turnDirectionPatient: 'நோயாளி பேசுகிறார் ➔ மருத்துவர் கேட்கிறார்',
    typeTurnBtn: 'தட்டச்சு செய்',
    recordTurnInstruction: 'உங்கள் மொழியில் பேச மைக் அழுத்தவும்',
    reviewDraftTitle: 'மருத்துவ வரைவு மதிப்பாய்வு',
    aiDraftDisclaimerTitle: 'AI-உருவாக்கிய வரைவு — மருத்துவர் மதிப்பாய்வு தேவை',
    aiDraftDisclaimerText: 'AI தானாகவே நோயறிதல் அல்லது மருந்துகளை பரிந்துரைக்காது. மருத்துவர் மதிப்பாய்வு கட்டாயமாகும்.',
    talkToAiTitle: 'AI மருத்துவ உதவியாளர்',
    talkToAiDesc: 'முக்கிய அளவீடுகளை கூறவும்',
    talkToAiPlaceholder: 'எ.கா. எடை 70 கிலோ, உயரம் 175 செ.மீ, BP 120/80...',
    sendBtn: 'அனுப்பு',
    patientVitalsTitle: 'நோயாளி முக்கிய அளவீடுகள்',
    patientVitalsSubtitle: 'தானாக நிரப்பப்பட்டது / திருத்தக்கூடியது',
    vitalsWeight: 'எடை (கிலோ)',
    vitalsHeight: 'உயரம் (செ.மீ)',
    vitalsBp: 'இரத்த அழுத்தம் (BP)',
    vitalsPulse: 'நாடித் துடிப்பு (bpm)',
    vitalsTemp: 'வெப்பநிலை (°F)',
    vitalsSpo2: 'SpO2 (%)',
    recommendedNextConsultationTitle: 'அடுத்த ஆலோசனை பரிந்துரை',
    recommendedNextDateLabel: 'தேதி:',
    symptomsTitle: 'அறிகுறிகள்',
    physicianAssessmentTitle: 'மருத்துவர் மதிப்பீடு',
    doctorDiagnosisLabel: 'மருத்துவர் நோயறிதல் *',
    doctorDiagnosisPlaceholder: 'உறுதிப்படுத்தப்பட்ட நோயறிதலை உள்ளிடவும்...',
    doctorNotesLabel: 'மருத்துவக் குறிப்புகள்',
    doctorNotesPlaceholder: 'கண்காணிப்பு, ஓய்வு மற்றும் உணவு ஆலோசனை...',
    prescriptionsTitle: 'மருந்துகள் (பிரிஸ்கிரிப்ஷன்)',
    addMedicineBtn: 'மருந்து சேர்க்க',
    approveRecordBtn: 'அங்கீகரித்து சேமி',
    recordApprovedTitle: 'மருத்துவ பதிவு அங்கீகரிக்கப்பட்டது',
    recordApprovedSubtitle: 'மருத்துவ பதிவு ஆங்கிலத்தில் பாதுகாப்பாக சேமிக்கப்பட்டுள்ளது.',
    scheduleFollowupTitle: 'அடுத்த சந்திப்பை திட்டமிடுங்கள்',
    followupDateLabel: 'தேதி *',
    followupNotesLabel: 'வழிமுறைகள்',
    followupNotesPlaceholder: 'எ.கா. 3 நாட்களுக்குப் பிறகு மீண்டும் வரவும்',
    scheduleFollowupBtn: 'சந்திப்பை பதிவு செய்',
    returnDashboardBtn: 'டாஷ்போர்டுக்கு திரும்பு',
    reportModalTitle: 'அதிகாரப்பூர்வ மருத்துவ அறிக்கை',
    patientDetailsHeader: 'நோயாளி விவரங்கள்',
    attendingPhysicianHeader: 'மருத்துவர்',
    printReportBtn: 'அச்சிடு / PDF சேமி',
    closeBtn: 'மூடு',
    settingsModalTitle: 'அமைப்புகள்',
    settingDocNameLabel: 'மருத்துவர் முழு பெயர்',
    settingDocCredsLabel: 'தகுதிகள்',
    settingDocLangLabel: 'முதன்மை மொழி',
    saveSettingsBtn: 'சேமி',
    cancelBtn: 'ரத்து செய்',
    intakeHeaderSub: 'மொழி: தமிழ் (தமிழ்)',
    changeLangBtn: 'மொழி மாற்றவும்',
    listenAloudBtn: 'கேள்வி கேளுங்கள்',
    intakeTypePlaceholder: 'அல்லது பதில் தட்டச்சு செய்க...',
    intakeNextBtn: 'அடுத்து',
    intakeCompleteBtn: 'படிவத்தை முடித்து சமர்ப்பிக்கவும்',
    autofillCardTitle: 'நேரலை தானியங்கு படிவம்',
    autofillSyncBadge: 'நேரலை ஒத்திசைவு',
    autofillLabelName: 'முழு பெயர்',
    autofillLabelAge: 'வயது மற்றும் பாலினம்',
    autofillLabelPhone: 'கைபேசி எண்',
    autofillLabelComplaint: 'முக்கிய பிரச்சனை / அறிகுறிகள்',
    autofillLabelHistory: 'முந்தைய மருத்துவ வரலாறு',
    autofillLabelAllergies: 'ஒவ்வாமை மற்றும் மருந்துகள்',
    autofillPending: 'பதிலுக்காக காத்திருக்கிறது...',
    micTapToSpeak: 'மைக் அழுத்தி பேசவும்',
  },

  'te-IN': {
    brandSubtitle: 'క్లినికల్ కమ్యూనికేషన్ పోర్టల్',
    doctorSettingsTooltip: 'డాక్టర్ & యాప్ సెట్టింగ్‌లు',
    doctorCreds: 'MBBS, MD (జనరల్ మెడిసిన్)',
    primaryLangPrefix: 'ప్రాథమిక: ',
    searchPatientsPlaceholder: 'రోగి పేరు లేదా మొబైల్ నంబర్ శోధించండి...',
    onboardPatientBtn: 'కొత్త రోగిని జోడించండి',
    registeredPatientsTitle: 'నమోదైన రోగులు',
    registeredSuffix: ' నమోదయ్యారు',
    noPatientsText: 'ఇంకా రోగులు ఎవరూ నమోదు కాలేదు. "కొత్త రోగిని జోడించండి" నొక్కండి.',
    patientProfileTitle: 'రోగి ప్రొఫైల్',
    preferredLangLabel: 'ప్రాధాన్య భాష:',
    intakeSummaryLabel: 'సారాంశం:',
    startConsultationBtn: 'సంప్రదింపులు ప్రారంభించండి',
    medicalHistoryTitle: 'వైద్య చరిత్ర & నివేదికలు',
    noReportsText: 'ఈ రోగికి ఇంకా నివేదికలు లేవు.',
    viewFullReportBtn: 'పూర్తి నివేదిక చూడండి',
    officialApprovedBadge: 'ఆమోదించబడిన రికార్డు',
    draftBadge: 'డ్రాఫ్ట్ పురోగతిలో ఉంది',
    consultationTitle: 'సంప్రదింపులు',
    activeSessionBadge: 'యాక్టివ్ సెషన్',
    generateAiReportBtn: 'AI నివేదిక రూపొందించండి',
    patientSpeaksBtn: 'రోగి మాట్లాడతారు',
    doctorSpeaksBtn: 'డాక్టర్ మాట్లాడతారు',
    doctorSpeakingInLabel: 'డాక్టర్ మాట్లాడే భాష:',
    turnDirectionDoctor: 'డాక్టర్ మాట్లాడుతున్నారు ➔ రోగి వింటున్నారు',
    turnDirectionPatient: 'రోగి మాట్లాడుతున్నారు ➔ డాక్టర్ వింటున్నారు',
    typeTurnBtn: 'టైప్ చేయండి',
    recordTurnInstruction: 'మీ భాషలో మాట్లాడటానికి మైక్ నొక్కండి',
    reviewDraftTitle: 'క్లినికల్ డ్రాఫ్ట్ సమీక్ష',
    aiDraftDisclaimerTitle: 'AI రూపొందించిన డ్రాఫ్ట్ — డాక్టర్ సమీక్ష అవసరం',
    aiDraftDisclaimerText: 'AI స్వయంచాలకంగా నిర్ధారణ లేదా మందులను సూచించదు. డాక్టర్ సమీక్ష చట్టబద్ధంగా అవసరం.',
    talkToAiTitle: 'AI క్లినికల్ సహాయకుడు',
    talkToAiDesc: 'వైటల్స్ లేదా నోట్స్ చెప్పండి',
    talkToAiPlaceholder: 'ఉదా. బరువు 70 కేజీలు, ఎత్తు 175 సెం.మీ, BP 120/80...',
    sendBtn: 'పంపండి',
    patientVitalsTitle: 'రోగి వైటల్స్',
    patientVitalsSubtitle: 'ఆటో-ఫిల్ / సవరించదగినది',
    vitalsWeight: 'బరువు (కేజీ)',
    vitalsHeight: 'ఎత్తు (సెం.మీ)',
    vitalsBp: 'రక్తపోటు (BP)',
    vitalsPulse: 'పల్స్ (bpm)',
    vitalsTemp: 'ఉష్ణోగ్రత (°F)',
    vitalsSpo2: 'SpO2 (%)',
    recommendedNextConsultationTitle: 'తదుపరి సంప్రదింపు సిఫార్సు',
    recommendedNextDateLabel: 'తేదీ:',
    symptomsTitle: 'లక్షణాలు',
    physicianAssessmentTitle: 'వైద్యుని అంచనా',
    doctorDiagnosisLabel: 'డాక్టర్ నిర్ధారణ *',
    doctorDiagnosisPlaceholder: 'నిర్ధారణను నమోదు చేయండి...',
    doctorNotesLabel: 'క్లినికల్ నోట్స్',
    doctorNotesPlaceholder: 'గమనికలు, విశ్రాంతి మరియు ఆహార సలహాలు...',
    prescriptionsTitle: 'మందులు (ప్రిస్క్రిప్షన్)',
    addMedicineBtn: 'మందు జోడించండి',
    approveRecordBtn: 'ఆమోదించి సేవ్ చేయండి',
    recordApprovedTitle: 'క్లినికల్ రికార్డు ఆమోదించబడింది',
    recordApprovedSubtitle: 'వైద్య రికార్డు ఇంగ్లీషులో భద్రపరచబడింది.',
    scheduleFollowupTitle: 'తదుపరి అపాయింట్‌మెంట్ షెడ్యూల్ చేయండి',
    followupDateLabel: 'తేదీ *',
    followupNotesLabel: 'సూచనలు',
    followupNotesPlaceholder: 'ఉదా. 3 రోజుల తర్వాత మళ్లీ సంప్రదించండి',
    scheduleFollowupBtn: 'అపాయింట్‌మెంట్ బుక్ చేయండి',
    returnDashboardBtn: 'డ్యాష్‌బోర్డ్‌కు తిరిగి వెళ్లండి',
    reportModalTitle: 'అధికారిక వైద్య నివేదిక',
    patientDetailsHeader: 'రోగి వివరాలు',
    attendingPhysicianHeader: 'వైద్యుడు',
    printReportBtn: 'ప్రింట్ / PDF సేవ్ చేయండి',
    closeBtn: 'మూసివేయి',
    settingsModalTitle: 'సెట్టింగ్‌లు',
    settingDocNameLabel: 'డాక్టర్ పూర్తి పేరు',
    settingDocCredsLabel: 'అర్హతలు',
    settingDocLangLabel: 'ప్రాథమిక భాష',
    saveSettingsBtn: 'సేవ్ చేయండి',
    cancelBtn: 'రద్దు చేయండి',
    intakeHeaderSub: 'భాష: తెలుగు (తెలుగు)',
    changeLangBtn: 'భాష మార్చండి',
    listenAloudBtn: 'ప్రశ్న వినండి',
    intakeTypePlaceholder: 'లేదా ఇక్కడ సమాధానం టైప్ చేయండి...',
    intakeNextBtn: 'తదుపరి',
    intakeCompleteBtn: 'ఫారమ్‌ను సమర్పించండి',
    autofillCardTitle: 'లైవ్ ఆటో-ఫిల్డ్ ఫారం',
    autofillSyncBadge: 'లైవ్ సింక్',
    autofillLabelName: 'పూర్తి పేరు',
    autofillLabelAge: 'వయస్సు & లింగం',
    autofillLabelPhone: 'మొబైల్ సంఖ్య',
    autofillLabelComplaint: 'ప్రధాన సమస్య / లక్షణాలు',
    autofillLabelHistory: 'గత వైద్య చరిత్ర',
    autofillLabelAllergies: 'అలెర్జీలు మరియు మందులు',
    autofillPending: 'సమాధానం కోసం వేచి ఉంది...',
    micTapToSpeak: 'మైక్ నొక్కి సమాధానం చెప్పండి',
  },

  'kn-IN': {
    brandSubtitle: 'ಕ್ಲಿನಿಕಲ್ ಸಂವಹನ ಪೋರ್ಟಲ್',
    doctorSettingsTooltip: 'ವೈದ್ಯರ & ಅಪ್ಲಿಕೇಶನ್ ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    doctorCreds: 'MBBS, MD (ಜನರಲ್ ಮೆಡಿಸಿನ್)',
    primaryLangPrefix: 'ಪ್ರಾಥಮಿಕ: ',
    searchPatientsPlaceholder: 'ರೋಗಿಯ ಹೆಸರು ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಹುಡುಕಿ...',
    onboardPatientBtn: 'ಹೊಸ ರೋಗಿಯನ್ನು ಸೇರಿಸಿ',
    registeredPatientsTitle: 'ನೋಂದಾಯಿತ ರೋಗಿಗಳು',
    registeredSuffix: ' ನೋಂದಾಯಿತರು',
    noPatientsText: 'ಇನ್ನೂ ಯಾವುದೇ ರೋಗಿ ನೋಂದಣಿಯಾಗಿಲ್ಲ. "ಹೊಸ ರೋಗಿಯನ್ನು ಸೇರಿಸಿ" ಒತ್ತಿರಿ.',
    patientProfileTitle: 'ರೋಗಿಯ ವಿವರ',
    preferredLangLabel: 'ಆದ್ಯತೆಯ ಭಾಷೆ:',
    intakeSummaryLabel: 'ಸಾರಾಂಶ:',
    startConsultationBtn: 'ಸಮಾಲೋಚನೆ ಪ್ರಾರಂಭಿಸಿ',
    medicalHistoryTitle: 'ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ ಮತ್ತು ವರದಿಗಳು',
    noReportsText: 'ಈ ರೋಗಿಗೆ ಯಾವುದೇ ವರದಿಗಳು ಲಭ್ಯವಿಲ್ಲ.',
    viewFullReportBtn: 'ಪೂರ್ಣ ವರದಿ ವೀಕ್ಷಿಸಿ',
    officialApprovedBadge: 'ಅಧಿಕೃತ ಅನುಮೋದಿತ ದಾಖಲೆ',
    draftBadge: 'ಕರಡು ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    consultationTitle: 'ಸಮಾಲೋಚನೆ',
    activeSessionBadge: 'ಸಕ್ರಿಯ ಅವಧಿ',
    generateAiReportBtn: 'AI ವರದಿ ರಚಿಸಿ',
    patientSpeaksBtn: 'ರೋಗಿ ಮಾತನಾಡುತ್ತಾರೆ',
    doctorSpeaksBtn: 'ವೈದ್ಯರು ಮಾತನಾಡುತ್ತಾರೆ',
    doctorSpeakingInLabel: 'ವೈದ್ಯರು ಮಾತನಾಡುವ ಭಾಷೆ:',
    turnDirectionDoctor: 'ವೈದ್ಯರು ಮಾತನಾಡುತ್ತಿದ್ದಾರೆ ➔ ರೋಗಿ ಕೇಳುತ್ತಿದ್ದಾರೆ',
    turnDirectionPatient: 'ರೋಗಿ ಮಾತನಾಡುತ್ತಿದ್ದಾರೆ ➔ ವೈದ್ಯರು ಕೇಳುತ್ತಿದ್ದಾರೆ',
    typeTurnBtn: 'ಟೈಪ್ ಮಾಡಿ',
    recordTurnInstruction: 'ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿರಿ',
    reviewDraftTitle: 'ಕ್ಲಿನಿಕಲ್ ಕರಡು ಪರಿಶೀಲನೆ',
    aiDraftDisclaimerTitle: 'AI ರಚಿತ ಕರಡು — ವೈದ್ಯರ ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ',
    aiDraftDisclaimerText: 'AI ಸ್ವತಂತ್ರವಾಗಿ ರೋಗನಿರ್ಣಯ ಅಥವಾ ಔಷಧಿಗಳನ್ನು ನೀಡುವುದಿಲ್ಲ. ವೈದ್ಯರ ಪರಿಶೀಲನೆ ಕಾನೂನುಬದ್ಧವಾಗಿ ಕಡ್ಡಾಯವಾಗಿದೆ.',
    talkToAiTitle: 'AI ಕ್ಲಿನಿಕಲ್ ಸಹಾಯಕ',
    talkToAiDesc: 'ಪ್ರಮುಖ ಅಳತೆಗಳನ್ನು ತಿಳಿಸಿ',
    talkToAiPlaceholder: 'ಉದಾ. ತೂಕ 70 ಕೆಜಿ, ಎತ್ತರ 175 ಸೆಂ.ಮೀ, BP 120/80...',
    sendBtn: 'ಕಳುಹಿಸಿ',
    patientVitalsTitle: 'ರೋಗಿಯ ಪ್ರಮುಖಾಂಶಗಳು',
    patientVitalsSubtitle: 'ಸ್ವಯಂ ಭರ್ತಿ / ತಿದ್ದಬಹುದಾದ',
    vitalsWeight: 'ತೂಕ (ಕೆಜಿ)',
    vitalsHeight: 'ಎತ್ತರ (ಸೆಂ.ಮೀ)',
    vitalsBp: 'ರಕ್ತದೊತ್ತಡ (BP)',
    vitalsPulse: 'ನಾಡಿ ಬಡಿತ (bpm)',
    vitalsTemp: 'ತಾಪಮಾನ (°F)',
    vitalsSpo2: 'SpO2 (%)',
    recommendedNextConsultationTitle: 'ಮುಂದಿನ ಸಮಾಲೋಚನೆ ಶಿಫಾರಸು',
    recommendedNextDateLabel: 'ದಿನಾಂಕ:',
    symptomsTitle: 'ರೋಗಲಕ್ಷಣಗಳು',
    physicianAssessmentTitle: 'ವೈದ್ಯರ ಮೌಲ್ಯಮಾಪನ',
    doctorDiagnosisLabel: 'ವೈದ್ಯರ ರೋಗನಿರ್ಣಯ *',
    doctorDiagnosisPlaceholder: 'ಖಚಿತ ರೋಗನಿರ್ಣಯ ನಮೂದಿಸಿ...',
    doctorNotesLabel: 'ಕ್ಲಿನಿಕಲ್ ಟಿಪ್ಪಣಿಗಳು',
    doctorNotesPlaceholder: 'ಅವಲೋಕನಗಳು, ವಿಶ್ರಾಂತಿ ಮತ್ತು ಆಹಾರ ಸಲಹೆ...',
    prescriptionsTitle: 'ಔಷಧಿಗಳು (ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್)',
    addMedicineBtn: 'ಔಷಧಿ ಸೇರಿಸಿ',
    approveRecordBtn: 'ಅನುಮೋದಿಸಿ ಮತ್ತು ಉಳಿಸಿ',
    recordApprovedTitle: 'ದಾಖಲೆ ಅನುಮೋದಿಸಲಾಗಿದೆ',
    recordApprovedSubtitle: 'ವೈದ್ಯಕೀಯ ದಾಖಲೆಯನ್ನು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಸುರಕ್ಷಿತವಾಗಿ ಆರ್ಕೈವ್ ಮಾಡಲಾಗಿದೆ.',
    scheduleFollowupTitle: 'ಮುಂದಿನ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ನಿಗದಿಪಡಿಸಿ',
    followupDateLabel: 'ದಿನಾಂಕ *',
    followupNotesLabel: 'ಸೂಚನೆಗಳು',
    followupNotesPlaceholder: 'ಉದಾ. 3 ದಿನಗಳ ನಂತರ ಮರುಪರಿಶೀಲನೆ',
    scheduleFollowupBtn: 'ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಕಾಯ್ದಿರಿಸಿ',
    returnDashboardBtn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ',
    reportModalTitle: 'ಅಧಿಕೃತ ವೈದ್ಯಕೀಯ ವರದಿ',
    patientDetailsHeader: 'ರೋಗಿಯ ವಿವರಗಳು',
    attendingPhysicianHeader: 'ವೈದ್ಯರು',
    printReportBtn: 'ಮುದ್ರಿಸಿ / PDF ಉಳಿಸಿ',
    closeBtn: 'ಮುಚ್ಚಿ',
    settingsModalTitle: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು',
    settingDocNameLabel: 'ವೈದ್ಯರ ಪೂರ್ಣ ಹೆಸರು',
    settingDocCredsLabel: 'ಅರ್ಹತೆಗಳು',
    settingDocLangLabel: 'ಪ್ರಾಥಮಿಕ ಭಾಷೆ',
    saveSettingsBtn: 'ಉಳಿಸಿ',
    cancelBtn: 'ರದ್ದುಮಾಡಿ',
    intakeHeaderSub: 'ಭಾಷೆ: ಕನ್ನಡ (ಕನ್ನಡ)',
    changeLangBtn: 'ಭಾಷೆ ಬದಲಿಸಿ',
    listenAloudBtn: 'ಪ್ರಶ್ನೆ ಕೇಳಿ',
    intakeTypePlaceholder: 'ಅಥವಾ ಉತ್ತರವನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ...',
    intakeNextBtn: 'ಮುಂದೆ',
    intakeCompleteBtn: 'ಫಾರ್ಮ್ ಪೂರ್ಣಗೊಳಿಸಿ ಮತ್ತು ಸಲ್ಲಿಸಿ',
    autofillCardTitle: 'ಲೈವ್ ಸ್ವಯಂಚಾಲಿತ ಭರ್ತಿ ಫಾರ್ಮ್',
    autofillSyncBadge: 'ಲೈವ್ ಸಿಂಕ್',
    autofillLabelName: 'ಪೂರ್ಣ ಹೆಸರು',
    autofillLabelAge: 'ವಯಸ್ಸು ಮತ್ತು ಲಿಂಗ',
    autofillLabelPhone: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ',
    autofillLabelComplaint: 'ಮುಖ್ಯ ಸಮಸ್ಯೆ / ಲಕ್ಷಣಗಳು',
    autofillLabelHistory: 'ಹಿಂದಿನ ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ',
    autofillLabelAllergies: 'ಅಲರ್ಜಿಗಳು ಮತ್ತು ಔಷಧಗಳು',
    autofillPending: 'ಉತ್ತರಕ್ಕಾಗಿ ಕಾಯಲಾಗುತ್ತಿದೆ...',
    micTapToSpeak: 'ಮೈಕ್ ಒತ್ತಿ ಉತ್ತರ ನೀಡಿ',
  },

  'ml-IN': {
    brandSubtitle: 'ക്ലിനിക്കൽ കമ്മ്യൂണിക്കേഷൻ പോർട്ടൽ',
    doctorSettingsTooltip: 'ഡോക്ടർ & ആപ്പ് ക്രമീകരണങ്ങൾ',
    doctorCreds: 'MBBS, MD (ജനറൽ മെഡിസിൻ)',
    primaryLangPrefix: 'പ്രധാന: ',
    searchPatientsPlaceholder: 'രോഗിയുടെ പേര് അല്ലെങ്കിൽ മൊബൈൽ നമ്പർ തിരയുക...',
    onboardPatientBtn: 'പുതിയ രോഗിയെ ചേർക്കുക',
    registeredPatientsTitle: 'രജിസ്റ്റർ ചെയ്ത രോഗികൾ',
    registeredSuffix: ' രജിസ്റ്റർ ചെയ്തു',
    noPatientsText: 'രോഗികളൊന്നും ഇതുവരെ രജിസ്റ്റർ ചെയ്തിട്ടില്ല. "പുതിയ രോഗിയെ ചേർക്കുക" അമർത്തുക.',
    patientProfileTitle: 'രോഗിയുടെ വിവരങ്ങൾ',
    preferredLangLabel: 'തിരഞ്ഞെടുത്ത ഭാഷ:',
    intakeSummaryLabel: 'സംഗ്രഹം:',
    startConsultationBtn: 'കൺസൾട്ടേഷൻ ആരംഭിക്കുക',
    medicalHistoryTitle: 'മെഡിക്കൽ ചരിത്രവും റിപ്പോർട്ടുകളും',
    noReportsText: 'ഈ രോഗിക്ക് റിപ്പോർട്ടുകളൊന്നും ലഭ്യമല്ല.',
    viewFullReportBtn: 'പൂർണ്ണ റിപ്പോർട്ട് കാണുക',
    officialApprovedBadge: 'അംഗീകൃത രേഖ',
    draftBadge: 'കരട് പുരോഗമിക്കുന്നു',
    consultationTitle: 'കൺസൾട്ടേഷൻ',
    activeSessionBadge: 'സജീവ സെഷൻ',
    generateAiReportBtn: 'AI റിപ്പോർട്ട് തയ്യാറാക്കുക',
    patientSpeaksBtn: 'രോഗി സംസാരിക്കുന്നു',
    doctorSpeaksBtn: 'ഡോക്ടർ സംസാരിക്കുന്നു',
    doctorSpeakingInLabel: 'ഡോക്ടർ സംസാരിക്കുന്ന ഭാഷ:',
    turnDirectionDoctor: 'ഡോക്ടർ സംസാരിക്കുന്നു ➔ രോഗി കേൾക്കുന്നു',
    turnDirectionPatient: 'രോഗി സംസാരിക്കുന്നു ➔ ഡോക്ടർ കേൾക്കുന്നു',
    typeTurnBtn: 'ടൈപ്പ് ചെയ്യുക',
    recordTurnInstruction: 'നിങ്ങളുടെ ഭാഷയിൽ സംസാരിക്കാൻ മൈക്ക് അമർത്തുക',
    reviewDraftTitle: 'ക്ലിനിക്കൽ കരട് അവലോകനം',
    aiDraftDisclaimerTitle: 'AI തയ്യാറാക്കിയ കരട് — ഡോക്ടറുടെ അവലോകനം ആവശ്യമാണ്',
    aiDraftDisclaimerText: 'AI സ്വയം രോഗനിർണയമോ മരുന്നുകളോ നിർദ്ദേശിക്കില്ല. ഡോക്ടറുടെ അവലോകനം നിയമപരമായി നിർബന്ധമാണ്.',
    talkToAiTitle: 'AI ക്ലിനിക്കൽ സഹായി',
    talkToAiDesc: 'പ്രധാന അളവുകൾ പറയുക',
    talkToAiPlaceholder: 'ഉദാ. ഭാരം 70 കിലോഗ്രാം, ഉയരം 175 സെ.മീ, BP 120/80...',
    sendBtn: 'അയക്കുക',
    patientVitalsTitle: 'രോഗിയുടെ വൈറ്റലുകൾ',
    patientVitalsSubtitle: 'സ്വയം പൂരിപ്പിച്ചത് / മാറ്റം വരുത്താവുന്നത്',
    vitalsWeight: 'ഭാരം (കിലോഗ്രാം)',
    vitalsHeight: 'ഉയരം (സെ.മീ)',
    vitalsBp: 'രക്തസമ്മർദ്ദം (BP)',
    vitalsPulse: 'നാഡിമിടിപ്പ് (bpm)',
    vitalsTemp: 'താപനില (°F)',
    vitalsSpo2: 'SpO2 (%)',
    recommendedNextConsultationTitle: 'അടുത്ത കൺസൾട്ടേഷൻ നിർദ്ദേശം',
    recommendedNextDateLabel: 'തീയതി:',
    symptomsTitle: 'രോഗലക്ഷണങ്ങൾ',
    physicianAssessmentTitle: 'ഡോക്ടറുടെ വിലയിരുത്തൽ',
    doctorDiagnosisLabel: 'ഡോക്ടറുടെ രോഗനിർണയം *',
    doctorDiagnosisPlaceholder: 'രോഗനിർണയം രേഖപ്പെടുത്തുക...',
    doctorNotesLabel: 'ക്ലിനിക്കൽ കുറിപ്പുകൾ',
    doctorNotesPlaceholder: 'നിരീക്ഷണങ്ങൾ, വിശ്രമം, ഭക്ഷണ നിർദ്ദേശങ്ങൾ...',
    prescriptionsTitle: 'മരുന്നുകൾ (കുറിപ്പടി)',
    addMedicineBtn: 'മരുന്ന് ചേർക്കുക',
    approveRecordBtn: 'അംഗീകരിച്ച് സൂക്ഷിക്കുക',
    recordApprovedTitle: 'രേഖ അംഗീകരിച്ചു',
    recordApprovedSubtitle: 'മെഡിക്കൽ രേഖ ഇംഗ്ലീഷിൽ സുരക്ഷിതമായി ആർക്കൈവ് ചെയ്തു.',
    scheduleFollowupTitle: 'അടുത്ത കൂടിക്കാഴ്ച നിശ്ചയിക്കുക',
    followupDateLabel: 'തീയതി *',
    followupNotesLabel: 'നിർദ്ദേശങ്ങൾ',
    followupNotesPlaceholder: 'ഉദാ. 3 ദിവസത്തിന് ശേഷം വീണ്ടും കാണുക',
    scheduleFollowupBtn: 'കൂടിക്കാഴ്ച ബുക്ക് ചെയ്യുക',
    returnDashboardBtn: 'ഡാഷ്‌ബോർഡിലേക്ക് മടങ്ങുക',
    reportModalTitle: 'ഔദ്യോഗിക മെഡിക്കൽ റിപ്പോർട്ട്',
    patientDetailsHeader: 'രോഗിയുടെ വിവരങ്ങൾ',
    attendingPhysicianHeader: 'ഡോക്ടർ',
    printReportBtn: 'പ്രിന്റ് / PDF സൂക്ഷിക്കുക',
    closeBtn: 'അടയ്ക്കുക',
    settingsModalTitle: 'ക്രമീകരണങ്ങൾ',
    settingDocNameLabel: 'ഡോക്ടറുടെ പേര്',
    settingDocCredsLabel: 'യോഗ്യതകൾ',
    settingDocLangLabel: 'പ്രധാന ഭാഷ',
    saveSettingsBtn: 'സൂക്ഷിക്കുക',
    cancelBtn: 'റദ്ദാക്കുക',
    intakeHeaderSub: 'ഭാഷ: മലയാളം (മലയാളം)',
    changeLangBtn: 'ഭാഷ മാറ്റുക',
    listenAloudBtn: 'ചോദ്യം കേൾക്കുക',
    intakeTypePlaceholder: 'അല്ലെങ്കിൽ ഉത്തരം ഇവിടെ ടൈപ്പ് ചെയ്യുക...',
    intakeNextBtn: 'അടുത്തത്',
    intakeCompleteBtn: 'ഫോം പൂർത്തിയാക്കി സമർപ്പിക്കുക',
    autofillCardTitle: 'ലൈവ് സ്വയം പൂരിപ്പിച്ച ഫോം',
    autofillSyncBadge: 'ലൈവ് സമന്വയം',
    autofillLabelName: 'പൂർണ്ണ പേര്',
    autofillLabelAge: 'പ്രായവും ലിംഗവും',
    autofillLabelPhone: 'മൊബൈൽ നമ്പർ',
    autofillLabelComplaint: 'പ്രധാന പ്രശ്നം / ലക്ഷണങ്ങൾ',
    autofillLabelHistory: 'മുൻകാല മെഡിക്കൽ ചരിത്രം',
    autofillLabelAllergies: 'അലർജികളും മരുന്നുകളും',
    autofillPending: 'മറുപടിക്കായി കാത്തിരിക്കുന്നു...',
    micTapToSpeak: 'മൈക്ക് അമർത്തി സംസാരിക്കുക',
  },

  'pa-IN': {
    brandSubtitle: 'ਕਲੀਨਿਕਲ ਸੰਚਾਰ ਪੋਰਟਲ',
    doctorSettingsTooltip: 'ਡਾਕਟਰ ਅਤੇ ਐਪ ਸੈਟਿੰਗਾਂ',
    doctorCreds: 'MBBS, MD (ਜਨਰਲ ਮੈਡੀਸਨ)',
    primaryLangPrefix: 'ਪ੍ਰਾਇਮਰੀ: ',
    searchPatientsPlaceholder: 'ਮਰੀਜ਼ ਦਾ ਨਾਮ ਜਾਂ ਮੋਬਾਈਲ ਨੰਬਰ ਖੋਜੋ...',
    onboardPatientBtn: 'ਨਵਾਂ ਮਰੀਜ਼ ਸ਼ਾਮਲ ਕਰੋ',
    registeredPatientsTitle: 'ਰਜਿਸਟਰਡ ਮਰੀਜ਼',
    registeredSuffix: ' ਰਜਿਸਟਰਡ',
    noPatientsText: 'ਅਜੇ ਕੋਈ ਮਰੀਜ਼ ਰਜਿਸਟਰਡ ਨਹੀਂ ਹੈ। "ਨਵਾਂ ਮਰੀਜ਼ ਸ਼ਾਮਲ ਕਰੋ" ਦਬਾਓ।',
    patientProfileTitle: 'ਮਰੀਜ਼ ਪ੍ਰੋਫਾਈਲ',
    preferredLangLabel: 'ਪਸੰਦੀਦਾ ਭਾਸ਼ਾ:',
    intakeSummaryLabel: 'ਸੰਖੇਪ:',
    startConsultationBtn: 'ਸਲਾਹ ਸ਼ੁਰੂ ਕਰੋ',
    medicalHistoryTitle: 'ਮੈਡੀਕਲ ਇਤਿਹਾਸ ਅਤੇ ਰਿਪੋਰਟਾਂ',
    noReportsText: 'ਇਸ ਮਰੀਜ਼ ਲਈ ਅਜੇ ਕੋਈ ਰਿਪੋਰਟ ਨਹੀਂ ਹੈ।',
    viewFullReportBtn: 'ਪੂਰੀ ਰਿਪੋਰਟ ਦੇਖੋ',
    officialApprovedBadge: 'ਪ੍ਰਵਾਨਿਤ ਰਿਕਾਰਡ',
    draftBadge: 'ਡਰਾਫਟ ਚੱਲ ਰਿਹਾ ਹੈ',
    consultationTitle: 'ਸਲਾਹ',
    activeSessionBadge: 'ਸਰਗਰਮ ਸੈਸ਼ਨ',
    generateAiReportBtn: 'AI ਰਿਪੋਰਟ ਤਿਆਰ ਕਰੋ',
    patientSpeaksBtn: 'ਮਰੀਜ਼ ਬੋਲਣਗੇ',
    doctorSpeaksBtn: 'ਡਾਕਟਰ ਬੋਲਣਗੇ',
    doctorSpeakingInLabel: 'ਡਾਕਟਰ ਦੇ ਬੋਲਣ ਦੀ ਭਾਸ਼ਾ:',
    turnDirectionDoctor: 'ਡਾਕਟਰ ਬੋਲ ਰਹੇ ਹਨ ➔ ਮਰੀਜ਼ ਸੁਣ ਰਹੇ ਹਨ',
    turnDirectionPatient: 'ਮਰੀਜ਼ ਬੋਲ ਰਹੇ ਹਨ ➔ ਡਾਕਟਰ ਸੁਣ ਰਹੇ ਹਨ',
    typeTurnBtn: 'ਟਾਈਪ ਕਰੋ',
    recordTurnInstruction: 'ਆਪਣੀ ਭਾਸ਼ਾ ਵਿੱਚ ਬੋਲਣ ਲਈ ਮਾਈਕ ਦਬਾਓ',
    reviewDraftTitle: 'ਕਲੀਨਿਕਲ ਡਰਾਫਟ ਸਮੀਖਿਆ',
    aiDraftDisclaimerTitle: 'AI-ਤਿਆਰ ਡਰਾਫਟ — ਡਾਕਟਰ ਸਮੀਖਿਆ ਲੋੜੀਂਦੀ ਹੈ',
    aiDraftDisclaimerText: 'AI ਕਦੇ ਵੀ ਖੁਦ ਨਿਦਾਨ ਜਾਂ ਦਵਾਈਆਂ ਤੈਅ ਨਹੀਂ ਕਰਦਾ। ਡਾਕਟਰ ਦੀ ਸਮੀਖਿਆ ਕਾਨੂੰਨੀ ਤੌਰ ਤੇ ਲਾਜ਼ਮੀ ਹੈ।',
    talkToAiTitle: 'AI ਕਲੀਨਿਕਲ ਸਹਾਇਕ',
    talkToAiDesc: 'ਵਾਈਟਲਸ ਜਾਂ ਨੋਟਸ ਬੋਲੋ',
    talkToAiPlaceholder: 'ਉਦਾਹਰਨ ਲਈ ਭਾਰ 70 ਕਿਲੋ, ਕੱਦ 175 ਸੈਮੀ, BP 120/80...',
    sendBtn: 'ਭੇਜੋ',
    patientVitalsTitle: 'ਮਰੀਜ਼ ਵਾਈਟਲਸ',
    patientVitalsSubtitle: 'ਸਵੈ-ਭਰਿਆ / ਸੰਪਾਦਨਯੋਗ',
    vitalsWeight: 'ਭਾਰ (ਕਿਲੋ)',
    vitalsHeight: 'ਕੱਦ (ਸੈਮੀ)',
    vitalsBp: 'ਬਲੱਡ ਪ੍ਰੈਸ਼ਰ (BP)',
    vitalsPulse: 'ਨਬਜ਼ (bpm)',
    vitalsTemp: 'ਤਾਪਮਾਨ (°F)',
    vitalsSpo2: 'SpO2 (%)',
    recommendedNextConsultationTitle: 'ਅਗਲੀ ਸਲਾਹ ਦੀ ਸਿਫਾਰਸ਼',
    recommendedNextDateLabel: 'ਤਾਰੀਖ:',
    symptomsTitle: 'ਲੱਛਣ',
    physicianAssessmentTitle: 'ਡਾਕਟਰ ਦਾ ਮੁਲਾਂਕਣ',
    doctorDiagnosisLabel: 'ਡਾਕਟਰ ਦਾ ਨਿਦਾਨ *',
    doctorDiagnosisPlaceholder: 'ਪੱਕਾ ਨਿਦਾਨ ਦਰਜ ਕਰੋ...',
    doctorNotesLabel: 'ਕਲੀਨਿਕਲ ਨੋਟਸ',
    doctorNotesPlaceholder: 'ਨਿਰੀਖਣ, ਆਰਾਮ ਅਤੇ ਖੁਰਾਕ ਸਲਾਹ...',
    prescriptionsTitle: 'ਦਵਾਈਆਂ (ਨੁਸਖ਼ਾ)',
    addMedicineBtn: 'ਦਵਾਈ ਸ਼ਾਮਲ ਕਰੋ',
    approveRecordBtn: 'ਮਨਜ਼ੂਰ ਅਤੇ ਸੁਰੱਖਿਅਤ ਕਰੋ',
    recordApprovedTitle: 'ਕਲੀਨਿਕਲ ਰਿਕਾਰਡ ਮਨਜ਼ੂਰ',
    recordApprovedSubtitle: 'ਮੈਡੀਕਲ ਰਿਕਾਰਡ ਸੁਰੱਖਿਅਤ ਢੰਗ ਨਾਲ ਅੰਗਰੇਜ਼ੀ ਵਿੱਚ ਸੁਰੱਖਿਅਤ ਕੀਤਾ ਗਿਆ ਹੈ।',
    scheduleFollowupTitle: 'ਅਗਲੀ ਮੁਲਾਕਾਤ ਤੈਅ ਕਰੋ',
    followupDateLabel: 'ਤਾਰੀਖ *',
    followupNotesLabel: 'ਹਿਦਾਇਤਾਂ',
    followupNotesPlaceholder: 'ਉਦਾਹਰਨ ਲਈ 3 ਦਿਨ ਬਾਅਦ ਦੁਬਾਰਾ ਚੈੱਕ ਕਰੋ',
    scheduleFollowupBtn: 'ਮੁਲਾਕਾਤ ਬੁੱਕ ਕਰੋ',
    returnDashboardBtn: 'ਡੈਸ਼ਬੋਰਡ ਤੇ ਵਾਪਸ ਜਾਓ',
    reportModalTitle: 'ਸਰਕਾਰੀ ਮੈਡੀਕਲ ਰਿਪੋਰਟ',
    patientDetailsHeader: 'ਮਰੀਜ਼ ਵੇਰਵੇ',
    attendingPhysicianHeader: 'ਡਾਕਟਰ',
    printReportBtn: 'ਪ੍ਰਿੰਟ / PDF ਸੇਵ ਕਰੋ',
    closeBtn: 'ਬੰਦ ਕਰੋ',
    settingsModalTitle: 'ਸੈਟਿੰਗਾਂ',
    settingDocNameLabel: 'ਡਾਕਟਰ ਦਾ ਪੂਰਾ ਨਾਮ',
    settingDocCredsLabel: 'ਡਿਗਰੀਆਂ',
    settingDocLangLabel: 'ਪ੍ਰਾਇਮਰੀ ਭਾਸ਼ਾ',
    saveSettingsBtn: 'ਸੇਵ ਕਰੋ',
    cancelBtn: 'ਰੱਦ ਕਰੋ',
    intakeHeaderSub: 'ਭਾਸ਼ਾ: ਪੰਜਾਬੀ (ਪੰਜਾਬੀ)',
    changeLangBtn: 'ਭਾਸ਼ਾ ਬਦਲੋ',
    listenAloudBtn: 'ਸਵਾਲ ਸੁਣੋ',
    intakeTypePlaceholder: 'ਜਾਂ ਇੱਥੇ ਜਵਾਬ ਲਿਖੋ...',
    intakeNextBtn: 'ਅਗਲਾ',
    intakeCompleteBtn: 'ਫਾਰਮ ਪੂਰਾ ਕਰੋ ਅਤੇ ਜਮ੍ਹਾਂ ਕਰੋ',
    autofillCardTitle: 'ਲਾਈਵ ਸਵੈ-ਭਰਿਆ ਇਨਟੇਕ ਫਾਰਮ',
    autofillSyncBadge: 'ਲਾਈਵ ਸਿੰਕ',
    autofillLabelName: 'ਪੂਰਾ ਨਾਮ',
    autofillLabelAge: 'ਉਮਰ ਅਤੇ ਲਿੰਗ',
    autofillLabelPhone: 'ਮੋਬਾਈਲ ਨੰਬਰ',
    autofillLabelComplaint: 'ਮੁੱਖ ਸਮੱਸਿਆ / ਲੱਛਣ',
    autofillLabelHistory: 'ਪਿਛਲਾ ਡਾਕਟਰੀ ਇਤਿਹਾਸ',
    autofillLabelAllergies: 'ਐਲਰਜੀ ਅਤੇ ਦਵਾਈਆਂ',
    autofillPending: 'ਜਵਾਬ ਦੀ ਉਡੀਕ...',
    micTapToSpeak: 'ਮਾਈਕ ਦਬਾ ਕੇ ਜਵਾਬ ਦਿਓ',
  },

  'or-IN': {
    brandSubtitle: 'କ୍ଲିନିକାଲ୍ ଯୋଗାଯୋଗ ପୋର୍ଟାଲ୍',
    doctorSettingsTooltip: 'ଡାକ୍ତର ଏବଂ ଆପ୍ ସେଟିଙ୍ଗ୍ସ',
    doctorCreds: 'MBBS, MD (ଜେନେରାଲ୍ ମେଡିସିନ୍)',
    primaryLangPrefix: 'ପ୍ରାଥମିକ: ',
    searchPatientsPlaceholder: 'ରୋଗୀଙ୍କ ନାମ କିମ୍ବା ମୋବାଇଲ୍ ନମ୍ବର ଖୋଜନ୍ତୁ...',
    onboardPatientBtn: 'ନୂଆ ରୋଗୀ ଯୋଡନ୍ତୁ',
    registeredPatientsTitle: 'ପଞ୍ଜୀକୃତ ରୋଗୀ',
    registeredSuffix: ' ପଞ୍ଜୀକୃତ',
    noPatientsText: 'ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ରୋଗୀ ପଞ୍ଜୀକୃତ ହୋଇନାହାଁନ୍ତି। "ନୂଆ ରୋଗୀ ଯୋଡନ୍ତୁ" ଦବାନ୍ତୁ।',
    patientProfileTitle: 'ରୋଗୀ ପ୍ରୋଫାଇଲ୍',
    preferredLangLabel: 'ପସନ୍ଦର ଭାଷା:',
    intakeSummaryLabel: 'ସାରାଂଶ:',
    startConsultationBtn: 'ପରାମର୍ଶ ଆରମ୍ଭ କରନ୍ତୁ',
    medicalHistoryTitle: 'ଡାକ୍ତରୀ ଇତିହାସ ଏବଂ ରିପୋର୍ଟ',
    noReportsText: 'ଏହି ରୋଗୀଙ୍କ ପାଇଁ ଏପର୍ଯ୍ୟନ୍ତ କୌଣସି ରିପୋର୍ଟ ନାହିଁ।',
    viewFullReportBtn: 'ସମ୍ପୂର୍ଣ୍ଣ ରିପୋର୍ଟ ଦେଖନ୍ତୁ',
    officialApprovedBadge: 'ଅନୁମୋଦିତ ରେକର୍ଡ',
    draftBadge: 'ଡ୍ରାଫ୍ଟ ଚାଲିଛି',
    consultationTitle: 'ପରାମର୍ଶ',
    activeSessionBadge: 'ସକ୍ରିୟ ଅଧିବେଶନ',
    generateAiReportBtn: 'AI ରିପୋର୍ଟ ପ୍ରସ୍ତୁତ କରନ୍ତୁ',
    patientSpeaksBtn: 'ରୋଗୀ କହିବେ',
    doctorSpeaksBtn: 'ଡାକ୍ତର କହିବେ',
    doctorSpeakingInLabel: 'ଡାକ୍ତର କହିବା ଭାଷା:',
    turnDirectionDoctor: 'ଡାକ୍ତର କହୁଛନ୍ତି ➔ ରୋଗୀ ଶୁଣୁଛନ୍ତି',
    turnDirectionPatient: 'ରୋଗୀ କହୁଛନ୍ତି ➔ ଡାକ୍ତର ଶୁଣୁଛନ୍ତି',
    typeTurnBtn: 'ଟାଇପ୍ କରନ୍ତୁ',
    recordTurnInstruction: 'ଆପଣଙ୍କ ଭାଷାରେ କହିବାକୁ ମାଇକ୍ ଦବାନ୍ତୁ',
    reviewDraftTitle: 'କ୍ଲିନିକାଲ୍ ଡ୍ରାଫ୍ଟ ସମୀକ୍ଷା',
    aiDraftDisclaimerTitle: 'AI ଦ୍ୱାରା ପ୍ରସ୍ତୁତ ଡ୍ରାଫ୍ଟ — ଡାକ୍ତରଙ୍କ ସମୀକ୍ଷା ଆବଶ୍ୟକ',
    aiDraftDisclaimerText: 'AI କେବେବି ନିଜେ ରୋଗ ନିର୍ଣ୍ଣୟ କିମ୍ବା ଔଷଧ ସ୍ଥିର କରେ ନାହିଁ। ଡାକ୍ତରଙ୍କ ସମୀକ୍ଷା ଆଇନଗତ ଭାବରେ ବାଧ୍ୟତାମୂଳକ।',
    talkToAiTitle: 'AI କ୍ଲିନିକାଲ୍ ସହାୟକ',
    talkToAiDesc: 'ଭାଇଟାଲ୍ସ କିମ୍ବା ନୋଟ୍ କୁହନ୍ତୁ',
    talkToAiPlaceholder: 'ଯଥା ଓଜନ ୭୦ କିଲୋ, ଉଚ୍ଚତା ୧୭୫ ସେମି, BP ୧୨୦/୮୦...',
    sendBtn: 'ପଠାନ୍ତୁ',
    patientVitalsTitle: 'ରୋଗୀଙ୍କ ଭାଇଟାଲ୍ସ',
    patientVitalsSubtitle: 'ସ୍ୱୟଂ ପୂରଣ / ସମ୍ପାଦନ ଯୋଗ୍ୟ',
    vitalsWeight: 'ଓଜନ (କିଲୋ)',
    vitalsHeight: 'ଉଚ୍ଚତା (ସେମି)',
    vitalsBp: 'ରକ୍ତଚାପ (BP)',
    vitalsPulse: 'ନାଡି ସ୍ପନ୍ଦନ (bpm)',
    vitalsTemp: 'ତାପମାତ୍ରା (°F)',
    vitalsSpo2: 'SpO2 (%)',
    recommendedNextConsultationTitle: 'ପରବର୍ତ୍ତୀ ପରାମର୍ଶ ସୁପାରିଶ',
    recommendedNextDateLabel: 'ତାରିଖ:',
    symptomsTitle: 'ଲକ୍ଷଣ',
    physicianAssessmentTitle: 'ଡାକ୍ତରଙ୍କ ମୂଲ୍ୟାଙ୍କନ',
    doctorDiagnosisLabel: 'ଡାକ୍ତରଙ୍କ ନିଦାନ *',
    doctorDiagnosisPlaceholder: 'ନିଶ୍ଚିତ ନିଦାନ ଲେଖନ୍ତୁ...',
    doctorNotesLabel: 'କ୍ଲିନିକାଲ୍ ନୋଟ୍ସ',
    doctorNotesPlaceholder: 'ନିରୀକ୍ଷଣ, ବିଶ୍ରାମ ଏବଂ ଖାଦ୍ୟ ପରାମର୍ଶ...',
    prescriptionsTitle: 'ଔଷଧ (ପ୍ରେସକ୍ରିପସନ୍)',
    addMedicineBtn: 'ଔଷଧ ଯୋଡନ୍ତୁ',
    approveRecordBtn: 'ଅନୁମୋଦନ ଏବଂ ସଂରକ୍ଷଣ',
    recordApprovedTitle: 'କ୍ଲିନିକାଲ୍ ରେକର୍ଡ ଅନୁମୋଦିତ',
    recordApprovedSubtitle: 'ମେଡିକାଲ୍ ରେକର୍ଡ ସୁରକ୍ଷିତ ଭାବରେ ଇଂରାଜୀରେ ସଂରକ୍ଷିତ ହୋଇଛି।',
    scheduleFollowupTitle: 'ପରବର୍ତ୍ତୀ ଆପଏଣ୍ଟମେଣ୍ଟ ଧାର୍ଯ୍ୟ କରନ୍ତୁ',
    followupDateLabel: 'ତାରିଖ *',
    followupNotesLabel: 'ନିର୍ଦ୍ଦେଶାବଳୀ',
    followupNotesPlaceholder: 'ଯଥା ୩ ଦିନ ପରେ ପୁନର୍ବାର ଦେଖାନ୍ତୁ',
    scheduleFollowupBtn: 'ଆପଏଣ୍ଟମେଣ୍ଟ ବୁକ୍ କରନ୍ତୁ',
    returnDashboardBtn: 'ଡ୍ୟାସବୋର୍ଡକୁ ଫେରନ୍ତୁ',
    reportModalTitle: 'ସରକାରୀ ମେଡିକାଲ୍ ରିପୋର୍ଟ',
    patientDetailsHeader: 'ରୋଗୀଙ୍କ ବିବରଣୀ',
    attendingPhysicianHeader: 'ଡାକ୍ତର',
    printReportBtn: 'ପ୍ରିଣ୍ଟ୍ / PDF ସେଭ୍ କରନ୍ତୁ',
    closeBtn: 'ବନ୍ଦ କରନ୍ତୁ',
    settingsModalTitle: 'ସେଟିଙ୍ଗ୍ସ',
    settingDocNameLabel: 'ଡାକ୍ତରଙ୍କ ପୂରା ନାମ',
    settingDocCredsLabel: 'ଡିଗ୍ରୀ ଏବଂ ବିବରଣୀ',
    settingDocLangLabel: 'ପ୍ରାଥମିକ ଭାଷା',
    saveSettingsBtn: 'ସେଭ୍ କରନ୍ତୁ',
    cancelBtn: 'ବାତିଲ୍ କରନ୍ତୁ',
    intakeHeaderSub: 'ଭାଷା: ଓଡ଼ିଆ (ଓଡ଼ିଆ)',
    changeLangBtn: 'ଭାଷା ବଦଳାନ୍ତୁ',
    listenAloudBtn: 'ପ୍ରଶ୍ନ ଶୁଣନ୍ତୁ',
    intakeTypePlaceholder: 'କିମ୍ବା ଉତ୍ତର ଏଠାରେ ଟାଇପ୍ କରନ୍ତୁ...',
    intakeNextBtn: 'ପରବର୍ତ୍ତୀ',
    intakeCompleteBtn: 'ଫର୍ମ ସମ୍ପୂର୍ଣ୍ଣ କରନ୍ତୁ ଏବଂ ଦାଖଲ କରନ୍ତୁ',
    autofillCardTitle: 'ଲାଇଭ୍ ସ୍ୱୟଂଚାଳିତ ଇନଟେକ୍ ଫର୍ମ',
    autofillSyncBadge: 'ଲାଇଭ୍ ସିଙ୍କ୍',
    autofillLabelName: 'ପୂରା ନାମ',
    autofillLabelAge: 'ବୟସ ଏବଂ ଲିଙ୍ଗ',
    autofillLabelPhone: 'ମୋବାଇଲ୍ ନମ୍ବର',
    autofillLabelComplaint: 'ମୁଖ୍ୟ ସମସ୍ୟା / ଲକ୍ଷଣ',
    autofillLabelHistory: 'ପୂର୍ବ ଚିକିତ୍ସା ଇତିହାସ',
    autofillLabelAllergies: 'ଆଲର୍ଜି ଏବଂ ଔଷଧ',
    autofillPending: 'ଉତ୍ତରକୁ ଅପେକ୍ଷା...',
    micTapToSpeak: 'ମାଇକ୍ ଦବାଇ ଉତ୍ତର କୁହନ୍ତୁ',
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

  // Update pending placeholders with native language text
  ['field-preview-name', 'field-preview-age-gender', 'field-preview-phone', 'field-preview-complaint', 'field-preview-history', 'field-preview-allergies'].forEach(id => {
    const el = document.getElementById(id);
    if (el && el.classList.contains('placeholder')) {
      el.textContent = dict.autofillPending || 'Pending response...';
    }
  });

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

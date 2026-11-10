import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';

class I18nService extends ChangeNotifier {
  static final I18nService _instance = I18nService._internal();
  factory I18nService() => _instance;
  I18nService._internal();

  String _currentLanguage = 'en-IN';
  String get currentLanguage => _currentLanguage;

  final Map<String, Map<String, String>> _dictionaries = {
    'en-IN': {
      'brandSubtitle': 'Clinical Communication Portal',
      'searchPatientsPlaceholder': 'Search patients by name or phone...',
      'onboardPatientBtn': 'Onboard Patient',
      'registeredPatientsTitle': 'Registered Patients',
      'registeredSuffix': ' registered',
      'noPatientsText': 'No patients registered yet. Tap "Onboard Patient" to register.',
      'startConsultationBtn': 'Start Consultation',
      'talkToAiTitle': 'Talk to AI Clinical Assistant',
      'talkToAiDesc': 'Dictate vitals (Weight, Height, BP, Pulse, Temp) or notes in English, Hindi, or Marathi',
      'patientVitalsTitle': 'Patient Vitals',
      'patientVitalsSubtitle': 'Auto-filled by AI / Editable',
      'prescriptionsTitle': 'Prescriptions',
      'addMedicineBtn': 'Add Medicine',
      'generateAiReportBtn': 'Generate AI Report',
      'approveRecordBtn': 'Approve & Finalize Record',
      'recordApprovedTitle': 'Clinical Record Approved',
      'scheduleFollowupTitle': 'Schedule Follow-up Appointment',
      'returnDashboardBtn': 'Return to Dashboard',
      'recordedPrefix': 'Recorded',
      'patientLabel': 'Patient',
      'doctorLabel': 'Attending Physician',
      'approvedBadge': 'Official Approved Record (Clinical English)',
      'draftBadge': 'Draft Record',
      'clinicalVitalsTitle': 'Clinical Vitals',
      'reportedSymptomsTitle': 'Reported Symptoms',
      'physicianNotesTitle': 'Physician Notes & Advisory',
      'followupPrefix': 'Follow-up Recommendation',
      'printSaveBtn': 'Print / Save',
      'closeBtn': 'Close',
      'recordExportedMsg': 'EHR record exported',
      'consultationTitle': 'Turn-by-Turn Consultation',
      'speakerDoctor': 'Doctor',
      'speakerPatient': 'Patient',
      'tapToSpeak': 'Tap mic to speak',
      'recordingActive': 'Listening... Tap to send',
      'proceedToReportBtn': 'Proceed to Clinical Report & Vitals',
      'doctorSettingsTitle': 'Doctor & App Settings',
      'preferredLanguageLabel': 'Doctor & UI Language',
      'saveSettingsBtn': 'Save Settings',
      'cancelBtn': 'Cancel',
      'vitalsWeight': 'Weight (kg)',
      'vitalsHeight': 'Height (cm)',
      'vitalsBP': 'Blood Pressure',
      'vitalsPulse': 'Pulse (bpm)',
      'vitalsTemp': 'Temperature (°F)',
      'vitalsSpO2': 'SpO2 (%)',
      'dictateVitalsTooltip': 'Dictate vitals using mic',
      'dictateRxTooltip': 'Dictate medicine prescriptions',
      'dictateNotesTooltip': 'Dictate clinical advisory & notes',
      'diagnosisLabel': 'Doctor Diagnosis',
      'notesLabel': 'Clinical Notes & Patient Advisory',
      'nextConsultationDate': 'Next Follow-up Consultation Date',
      'doctorFullName': 'Doctor Full Name',
      'credentialsSpecialty': 'Credentials & Specialty',
      'backendServerUrl': 'Backend Server URL / LAN IP',
      'allPatientsStoredEnglish': 'All patient clinical records are stored in canonical English in SQLite database',
    },
    'hi-IN': {
      'brandSubtitle': 'क्लिनिकल संचार एवं परामर्श पोर्टल',
      'searchPatientsPlaceholder': 'मरीज़ का नाम या मोबाइल नंबर खोजें...',
      'onboardPatientBtn': 'नया मरीज़ जोड़ें',
      'registeredPatientsTitle': 'पंजीकृत मरीज़',
      'registeredSuffix': ' पंजीकृत',
      'noPatientsText': 'अभी कोई मरीज़ पंजीकृत नहीं है। "नया मरीज़ जोड़ें" पर टैप करें।',
      'startConsultationBtn': 'परामर्श शुरू करें',
      'talkToAiTitle': 'एआई क्लिनिकल सहायक',
      'talkToAiDesc': 'व्हाइटल्स (वजन, ऊंचाई, बीपी, पल्स, तापमान) या नोट्स हिंदी, मराठी या अंग्रेजी में बोलें',
      'patientVitalsTitle': 'मरीज़ के मुख्य व्हाइटल्स',
      'patientVitalsSubtitle': 'एआई द्वारा स्वतः भरे / संपादन योग्य',
      'prescriptionsTitle': 'दवाएं (प्रिस्क्रिप्शन)',
      'addMedicineBtn': 'दवा जोड़ें',
      'generateAiReportBtn': 'एआई रिपोर्ट तैयार करें',
      'approveRecordBtn': 'रिकॉर्ड स्वीकृत और सुरक्षित करें',
      'recordApprovedTitle': 'क्लिनिकल रिकॉर्ड स्वीकृत',
      'scheduleFollowupTitle': 'अगली अपॉइंटमेंट निर्धारित करें',
      'returnDashboardBtn': 'डैशबोर्ड पर लौटें',
      'recordedPrefix': 'दिनांक',
      'patientLabel': 'मरीज़',
      'doctorLabel': 'चिकित्सक',
      'approvedBadge': 'आधिकारिक स्वीकृत रिकॉर्ड (क्लिनिकल)',
      'draftBadge': 'ड्राफ्ट रिकॉर्ड',
      'clinicalVitalsTitle': 'क्लिनिकल व्हाइटल्स',
      'reportedSymptomsTitle': 'लक्षण विवरण',
      'physicianNotesTitle': 'चिकित्सक नोट्स एवं परामर्श',
      'followupPrefix': 'अगला परामर्श',
      'printSaveBtn': 'प्रिंट / सुरक्षित करें',
      'closeBtn': 'बंद करें',
      'recordExportedMsg': 'ईएचआर रिकॉर्ड सुरक्षित किया गया',
      'consultationTitle': 'परामर्श (टर्न-बाय-टर्न)',
      'speakerDoctor': 'डॉक्टर',
      'speakerPatient': 'मरीज़',
      'tapToSpeak': 'बोलने के लिए माइक दबाएं',
      'recordingActive': 'सुन रहे हैं... भेजने के लिए दबाएं',
      'proceedToReportBtn': 'क्लिनिकल रिपोर्ट एवं व्हाइटल्स देखें',
      'doctorSettingsTitle': 'डॉक्टर एवं ऐप सेटिंग्स',
      'preferredLanguageLabel': 'डॉक्टर व ऐप की भाषा',
      'saveSettingsBtn': 'सेटिंग्स सुरक्षित करें',
      'cancelBtn': 'रद्द करें',
      'vitalsWeight': 'वजन (किग्रा)',
      'vitalsHeight': 'ऊंचाई (सेमी)',
      'vitalsBP': 'रक्तचाप (बीपी)',
      'vitalsPulse': 'नाड़ी (पल्स)',
      'vitalsTemp': 'तापमान (°F)',
      'vitalsSpO2': 'ऑक्सीजन SpO2 (%)',
      'dictateVitalsTooltip': 'माइक से व्हाइटल्स बोलें',
      'dictateRxTooltip': 'माइक से दवाएं बोलें',
      'dictateNotesTooltip': 'माइक से नोट्स बोलें',
      'diagnosisLabel': 'रोग निदान (डायग्नोसिस)',
      'notesLabel': 'क्लिनिकल नोट्स एवं परामर्श',
      'nextConsultationDate': 'अगली परामर्श तारीख',
      'doctorFullName': 'डॉक्टर का पूरा नाम',
      'credentialsSpecialty': 'योग्यता एवं विशेषता',
      'backendServerUrl': 'बैकएंड सर्वर यूआरएल / वाई-फाई आईपी',
      'allPatientsStoredEnglish': 'सभी मरीज़ रिकॉर्ड डेटाबेस में अंग्रेजी में सुरक्षित होते हैं',
    },
    'mr-IN': {
      'brandSubtitle': 'क्लिनिकल संवाद आणि डॉक्टरी सल्ला पोर्टल',
      'searchPatientsPlaceholder': 'रुग्णाचे नाव किंवा फोन नंबर शोधा...',
      'onboardPatientBtn': 'नवीन रुग्ण नोंदवा',
      'registeredPatientsTitle': 'नोंदणीकृत रुग्ण',
      'registeredSuffix': ' नोंदणीकृत',
      'noPatientsText': 'अद्याप कोणतेही रुग्ण नोंदणीकृत नाहीत. "नवीन रुग्ण नोंदवा" टॅप करा.',
      'startConsultationBtn': 'सल्लामसलत सुरू करा',
      'talkToAiTitle': 'एआई क्लिनिकल सहाय्यक',
      'talkToAiDesc': 'व्हाइटल्स (वजन, उंची, बीपी, नाडी, तापमान) किंवा नोंदी मराठी, हिंदी किंवा इंग्रजीत सांगा',
      'patientVitalsTitle': 'रुग्णाचे व्हाइटल्स',
      'patientVitalsSubtitle': 'एआई द्वारे भरलेले / बदलण्यायोग्य',
      'prescriptionsTitle': 'औषधोपचार (प्रिस्क्रिप्शन)',
      'addMedicineBtn': 'औषध जोडा',
      'generateAiReportBtn': 'एआई अहवाल तयार करा',
      'approveRecordBtn': 'अहवाल मंजूर आणि जतन करा',
      'recordApprovedTitle': 'क्लिनिकल रेकॉर्ड मंजूर',
      'scheduleFollowupTitle': 'पुढील अपॉइंटमेंट निश्चित करा',
      'returnDashboardBtn': 'डॅशबोर्डवर जा',
      'recordedPrefix': 'नोंदणी तारीख',
      'patientLabel': 'रुग्ण',
      'doctorLabel': 'डॉक्टर',
      'approvedBadge': 'अधिकृत मंजूर रेकॉर्ड (क्लिनिकल)',
      'draftBadge': 'मसुदा रेकॉर्ड',
      'clinicalVitalsTitle': 'क्लिनिकल व्हाइटल्स',
      'reportedSymptomsTitle': 'लक्षणे',
      'physicianNotesTitle': 'डॉक्टरांचा सल्ला आणि नोंदी',
      'followupPrefix': 'पुढील सल्लामसलत',
      'printSaveBtn': 'प्रिंट / जतन करा',
      'closeBtn': 'बंद करा',
      'recordExportedMsg': 'रेकॉर्ड जतन करण्यात आले',
      'consultationTitle': 'सल्लामसलत (टर्न-बाय-टर्न)',
      'speakerDoctor': 'डॉक्टर',
      'speakerPatient': 'रुग्ण',
      'tapToSpeak': 'बोलण्यासाठी माइक दाबा',
      'recordingActive': 'ऐकत आहे... पाठवण्यासाठी दाबा',
      'proceedToReportBtn': 'क्लिनिकल अहवाल आणि व्हाइटल्स पहा',
      'doctorSettingsTitle': 'डॉक्टर आणि अॅप सेटिंग्ज',
      'preferredLanguageLabel': 'डॉक्टर आणि अॅप भाषा',
      'saveSettingsBtn': 'सेटिंग्ज जतन करा',
      'cancelBtn': 'रद्द करा',
      'vitalsWeight': 'वजन (किलो)',
      'vitalsHeight': 'उंची (सेंमी)',
      'vitalsBP': 'रक्तदाब (बीपी)',
      'vitalsPulse': 'नाडी (पल्स)',
      'vitalsTemp': 'तापमान (°F)',
      'vitalsSpO2': 'ऑक्सिजन SpO2 (%)',
      'dictateVitalsTooltip': 'माइकद्वारे व्हाइटल्स सांगा',
      'dictateRxTooltip': 'माइकद्वारे औषधे सांगा',
      'dictateNotesTooltip': 'माइकद्वारे नोंदी सांगा',
      'diagnosisLabel': 'रोग निदान (डायग्नोसिस)',
      'notesLabel': 'क्लिनिकल नोंदी आणि सल्ला',
      'nextConsultationDate': 'पुढील सल्लामसलत तारीख',
      'doctorFullName': 'डॉक्टरांचे पूर्ण नाव',
      'credentialsSpecialty': 'पदवी आणि विशेषीकरण',
      'backendServerUrl': 'बॅकएंड सर्व्हर पत्ता / वाय-फाय आयपी',
      'allPatientsStoredEnglish': 'सर्व रुग्णांचे रेकॉर्ड डेटाबेसमध्ये इंग्रजीत जतन केले जातात',
    },
  };

  Future<void> init(ApiClient api, [String? initialDoctorLang]) async {
    final prefs = await SharedPreferences.getInstance();
    final savedLang = prefs.getString('swasthya_selected_lang') ?? initialDoctorLang;
    if (savedLang != null) {
      _currentLanguage = savedLang;
    }

    // Sync localized UI strings from SQLite database cache
    try {
      final dbCaches = await api.getUICaches();
      if (dbCaches.isNotEmpty) {
        dbCaches.forEach((lang, data) {
          if (data['translations'] is Map) {
            final trans = Map<String, dynamic>.from(data['translations']);
            _dictionaries[lang] = trans.map((k, v) => MapEntry(k, v.toString()));
          }
        });
      }
    } catch (e) {
      debugPrint('[I18nService] SQLite UI cache sync: $e');
    }
    notifyListeners();
  }

  Future<void> setLanguage(String langCode) async {
    _currentLanguage = langCode;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('swasthya_selected_lang', langCode);
    notifyListeners();
  }

  String t(String key, [Map<String, String>? params]) {
    String text = _dictionaries[_currentLanguage]?[key] ??
        _dictionaries['en-IN']?[key] ??
        key;

    if (params != null) {
      params.forEach((paramKey, paramVal) {
        text = text.replaceAll('{$paramKey}', paramVal);
      });
    }
    return text;
  }
}

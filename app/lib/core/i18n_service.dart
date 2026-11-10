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
    },
  };

  Future<void> init(ApiClient api) async {
    final prefs = await SharedPreferences.getInstance();
    final savedLang = prefs.getString('swasthya_selected_lang');
    if (savedLang != null) {
      _currentLanguage = savedLang;
    }

    // Attempt to sync localized UI strings from SQLite database cache
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
      debugPrint('[I18nService] SQLite UI cache sync fallback: $e');
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

class Doctor {
  final String id;
  final String name;
  final String credentials;
  final String preferredLanguage;
  final String spokenLanguages;
  final String doctorVoice;
  final String patientVoice;

  Doctor({
    required this.id,
    required this.name,
    required this.credentials,
    required this.preferredLanguage,
    required this.spokenLanguages,
    this.doctorVoice = 'Deven (Male)',
    this.patientVoice = 'Auto (Matches Gender)',
  });

  factory Doctor.fromJson(Map<String, dynamic> json) {
    return Doctor(
      id: json['id'] ?? 'default_doctor',
      name: json['name'] ?? 'Dr. John Doe',
      credentials: json['credentials'] ?? 'MBBS, MD (General Medicine)',
      preferredLanguage: json['preferred_language'] ?? 'en-IN',
      spokenLanguages: json['spoken_languages'] ?? 'en-IN,mr-IN,hi-IN',
      doctorVoice: json['doctor_voice'] ?? 'Deven (Male)',
      patientVoice: json['patient_voice'] ?? 'Auto (Matches Gender)',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'credentials': credentials,
      'preferred_language': preferredLanguage,
      'spoken_languages': spokenLanguages,
      'doctor_voice': doctorVoice,
      'patient_voice': patientVoice,
    };
  }

  List<String> get spokenLanguageCodes {
    return spokenLanguages.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
  }
}


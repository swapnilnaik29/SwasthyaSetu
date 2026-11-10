class Doctor {
  final String id;
  final String name;
  final String credentials;
  final String preferredLanguage;
  final String spokenLanguages;

  Doctor({
    required this.id,
    required this.name,
    required this.credentials,
    required this.preferredLanguage,
    required this.spokenLanguages,
  });

  factory Doctor.fromJson(Map<String, dynamic> json) {
    return Doctor(
      id: json['id'] ?? 'default_doctor',
      name: json['name'] ?? 'Dr. Swapnil Naik',
      credentials: json['credentials'] ?? 'MBBS, MD (General Medicine)',
      preferredLanguage: json['preferred_language'] ?? 'en-IN',
      spokenLanguages: json['spoken_languages'] ?? 'en-IN,mr-IN,hi-IN',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'credentials': credentials,
      'preferred_language': preferredLanguage,
      'spoken_languages': spokenLanguages,
    };
  }

  List<String> get spokenLanguageCodes {
    return spokenLanguages.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
  }
}


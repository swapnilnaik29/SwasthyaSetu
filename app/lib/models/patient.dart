import '../core/name_localizer.dart';

class Patient {
  final String id;
  final String name;
  final int? age;
  final String? gender;
  final String mobileNumber;
  final String preferredLanguage;
  final String? chiefComplaint;
  final String? symptomsDuration;
  final String? knownAllergies;
  final String? currentMedications;
  final String? pastMedicalHistory;
  final String? intakeSummaryEnglish;
  final DateTime? createdAt;

  Patient({
    required this.id,
    required this.name,
    this.age,
    this.gender,
    required this.mobileNumber,
    required this.preferredLanguage,
    this.chiefComplaint,
    this.symptomsDuration,
    this.knownAllergies,
    this.currentMedications,
    this.pastMedicalHistory,
    this.intakeSummaryEnglish,
    this.createdAt,
  });

  factory Patient.fromJson(Map<String, dynamic> json) {
    DateTime? parsedDate;
    if (json['created_at'] != null) {
      parsedDate = DateTime.tryParse(json['created_at'].toString());
    }
    return Patient(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      age: json['age'] != null ? int.tryParse(json['age'].toString()) : null,
      gender: json['gender'],
      mobileNumber: json['mobile_number'] ?? '',
      preferredLanguage: json['preferred_language'] ?? 'hi-IN',
      chiefComplaint: json['chief_complaint'],
      symptomsDuration: json['symptoms_duration'],
      knownAllergies: json['known_allergies'],
      currentMedications: json['current_medications'],
      pastMedicalHistory: json['past_medical_history'],
      intakeSummaryEnglish: json['intake_summary_english'],
      createdAt: parsedDate,
    );
  }

  /// Returns patient name in the doctor's preferred language while database retains canonical English
  String localizedName(String doctorLanguage) {
    return NameLocalizer.localize(name, doctorLanguage);
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      if (age != null) 'age': age,
      if (gender != null) 'gender': gender,
      'mobile_number': mobileNumber,
      'preferred_language': preferredLanguage,
      if (chiefComplaint != null) 'chief_complaint': chiefComplaint,
      if (symptomsDuration != null) 'symptoms_duration': symptomsDuration,
      if (knownAllergies != null) 'known_allergies': knownAllergies,
      if (currentMedications != null) 'current_medications': currentMedications,
      if (pastMedicalHistory != null) 'past_medical_history': pastMedicalHistory,
      if (intakeSummaryEnglish != null) 'intake_summary_english': intakeSummaryEnglish,
    };
  }
}


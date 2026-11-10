class Consultation {
  final String id;
  final String doctorId;
  final String patientId;
  final String patientLanguage;
  final String doctorLanguage;
  final String status; // 'IN_PROGRESS', 'COMPLETED'
  final String mode; // 'TURN_BY_TURN'
  final DateTime createdAt;

  Consultation({
    required this.id,
    required this.doctorId,
    required this.patientId,
    required this.patientLanguage,
    required this.doctorLanguage,
    this.status = 'IN_PROGRESS',
    this.mode = 'TURN_BY_TURN',
    DateTime? createdAt,
  }) : createdAt = createdAt ?? DateTime.now();

  factory Consultation.fromJson(Map<String, dynamic> json) {
    return Consultation(
      id: json['id'] ?? '',
      doctorId: json['doctor_id'] ?? '',
      patientId: json['patient_id'] ?? '',
      patientLanguage: json['patient_language'] ?? 'hi-IN',
      doctorLanguage: json['doctor_language'] ?? 'en-IN',
      status: json['status'] ?? 'IN_PROGRESS',
      mode: json['mode'] ?? 'TURN_BY_TURN',
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}


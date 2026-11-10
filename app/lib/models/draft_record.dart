class Vitals {
  double? weightKg;
  double? heightCm;
  String? bloodPressure;
  int? pulseBpm;
  double? temperatureF;
  int? spo2Percent;

  Vitals({
    this.weightKg,
    this.heightCm,
    this.bloodPressure,
    this.pulseBpm,
    this.temperatureF,
    this.spo2Percent,
  });

  factory Vitals.fromJson(Map<String, dynamic> json) {
    return Vitals(
      weightKg: json['weight_kg'] != null ? double.tryParse(json['weight_kg'].toString()) : null,
      heightCm: json['height_cm'] != null ? double.tryParse(json['height_cm'].toString()) : null,
      bloodPressure: json['blood_pressure']?.toString(),
      pulseBpm: json['pulse_bpm'] != null ? int.tryParse(json['pulse_bpm'].toString()) : null,
      temperatureF: json['temperature_f'] != null ? double.tryParse(json['temperature_f'].toString()) : null,
      spo2Percent: json['spo2_percent'] != null ? int.tryParse(json['spo2_percent'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'weight_kg': weightKg,
      'height_cm': heightCm,
      'blood_pressure': bloodPressure,
      'pulse_bpm': pulseBpm,
      'temperature_f': temperatureF,
      'spo2_percent': spo2Percent,
    };
  }
}

class PrescriptionItem {
  String medicine;
  String? strength;
  String? dose;
  String? frequency;
  String? duration;
  String? instructions;

  PrescriptionItem({
    required this.medicine,
    this.strength,
    this.dose,
    this.frequency,
    this.duration,
    this.instructions,
  });

  factory PrescriptionItem.fromJson(Map<String, dynamic> json) {
    return PrescriptionItem(
      medicine: json['medicine'] ?? '',
      strength: json['strength'],
      dose: json['dose'],
      frequency: json['frequency'],
      duration: json['duration'],
      instructions: json['instructions'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'medicine': medicine,
      'strength': strength,
      'dose': dose,
      'frequency': frequency,
      'duration': duration,
      'instructions': instructions,
    };
  }
}

class SymptomItem {
  final String symptom;
  final String? duration;
  final String? severity;
  final String? sourceSnippet;

  SymptomItem({
    required this.symptom,
    this.duration,
    this.severity,
    this.sourceSnippet,
  });

  factory SymptomItem.fromJson(Map<String, dynamic> json) {
    return SymptomItem(
      symptom: json['symptom'] ?? '',
      duration: json['duration'],
      severity: json['severity'],
      sourceSnippet: json['source_snippet'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'symptom': symptom,
      'duration': duration,
      'severity': severity,
      'source_snippet': sourceSnippet,
    };
  }
}

class DraftRecord {
  final String id;
  final String consultationId;
  String doctorDiagnosis;
  String doctorNotes;
  List<SymptomItem> symptoms;
  Vitals vitals;
  List<PrescriptionItem> prescriptions;
  String? followUpRecommendation;
  int? followUpDays;
  String? recommendedNextVisitDate;
  String status; // 'DRAFT', 'APPROVED'

  DraftRecord({
    required this.id,
    required this.consultationId,
    required this.doctorDiagnosis,
    required this.doctorNotes,
    required this.symptoms,
    required this.vitals,
    required this.prescriptions,
    this.followUpRecommendation,
    this.followUpDays,
    this.recommendedNextVisitDate,
    this.status = 'DRAFT',
  });

  factory DraftRecord.fromJson(Map<String, dynamic> json) {
    final payload = json['structured_payload'] is Map<String, dynamic>
        ? json['structured_payload'] as Map<String, dynamic>
        : json;

    final symptomsList = (payload['patient_reported_symptoms'] as List? ?? [])
        .map((s) => SymptomItem.fromJson(Map<String, dynamic>.from(s)))
        .toList();

    final prescList = (payload['prescriptions'] as List? ?? [])
        .map((p) => PrescriptionItem.fromJson(Map<String, dynamic>.from(p)))
        .toList();

    final vitalsObj = payload['vitals'] is Map<String, dynamic>
        ? Vitals.fromJson(payload['vitals'])
        : Vitals();

    return DraftRecord(
      id: json['id'] ?? '',
      consultationId: json['consultation_id'] ?? '',
      doctorDiagnosis: payload['doctor_diagnosis'] ?? '',
      doctorNotes: payload['doctor_notes'] ?? '',
      symptoms: symptomsList,
      vitals: vitalsObj,
      prescriptions: prescList,
      followUpRecommendation: payload['follow_up_recommendation'],
      followUpDays: payload['follow_up_days'] != null
          ? int.tryParse(payload['follow_up_days'].toString())
          : null,
      recommendedNextVisitDate: payload['recommended_next_visit_date'],
      status: json['status'] ?? payload['record_status'] ?? 'DRAFT',
    );
  }

  Map<String, dynamic> toStructuredPayload() {
    return {
      'doctor_diagnosis': doctorDiagnosis,
      'doctor_notes': doctorNotes,
      'patient_reported_symptoms': symptoms.map((s) => s.toJson()).toList(),
      'vitals': vitals.toJson(),
      'prescriptions': prescriptions.map((p) => p.toJson()).toList(),
      'follow_up_recommendation': followUpRecommendation,
      'follow_up_days': followUpDays,
      'recommended_next_visit_date': recommendedNextVisitDate,
      'record_status': status,
    };
  }
}


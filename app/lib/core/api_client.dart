import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/doctor.dart';
import '../models/patient.dart';
import '../models/consultation.dart';
import '../models/transcript.dart';
import '../models/draft_record.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  String _baseUrl = 'http://localhost:8000';

  String get baseUrl => _baseUrl;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('swasthya_api_url');
    if (saved != null && saved.trim().isNotEmpty) {
      _baseUrl = saved.trim();
    } else {
      // Default to localhost:8000 (which works for physical phone via ADB reverse, desktop, and web)
      _baseUrl = 'http://localhost:8000';
      if (!kIsWeb && Platform.isAndroid) {
        // Test localhost:8000 first (ADB reverse)
        try {
          final res = await http.get(Uri.parse('http://localhost:8000/health')).timeout(const Duration(milliseconds: 1500));
          if (res.statusCode == 200) {
            _baseUrl = 'http://localhost:8000';
            return;
          }
        } catch (_) {}

        // If localhost didn't respond, test 10.0.2.2:8000 (Android Emulator)
        try {
          final emuRes = await http.get(Uri.parse('http://10.0.2.2:8000/health')).timeout(const Duration(milliseconds: 1500));
          if (emuRes.statusCode == 200) {
            _baseUrl = 'http://10.0.2.2:8000';
            return;
          }
        } catch (_) {}
      }
    }
  }

  Future<void> setBaseUrl(String url) async {
    String clean = url.trim();
    if (clean.endsWith('/')) {
      clean = clean.substring(0, clean.length - 1);
    }
    _baseUrl = clean;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('swasthya_api_url', _baseUrl);
  }

  String resolveAudioUrl(String path) {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return '$_baseUrl$path';
  }

  // Health Check
  Future<bool> checkHealth() async {
    try {
      final res = await http.get(Uri.parse('$_baseUrl/health')).timeout(const Duration(seconds: 4));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  // Doctor Settings
  Future<Doctor> getDoctorSettings() async {
    final res = await http.get(Uri.parse('$_baseUrl/api/v1/doctor/settings')).timeout(const Duration(seconds: 4));
    if (res.statusCode == 200) {
      return Doctor.fromJson(jsonDecode(utf8.decode(res.bodyBytes)));
    }
    throw Exception('Failed to load doctor settings: ${res.statusCode}');
  }

  Future<Doctor> updateDoctorSettings(Doctor doc) async {
    final res = await http.put(
      Uri.parse('$_baseUrl/api/v1/doctor/settings'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(doc.toJson()),
    );
    if (res.statusCode == 200) {
      return Doctor.fromJson(jsonDecode(utf8.decode(res.bodyBytes)));
    }
    throw Exception('Failed to update doctor settings: ${res.statusCode}');
  }

  // Patients
  Future<List<Patient>> getPatients([String query = '']) async {
    final uri = query.trim().isNotEmpty
        ? Uri.parse('$_baseUrl/api/v1/patients?q=${Uri.encodeComponent(query.trim())}')
        : Uri.parse('$_baseUrl/api/v1/patients');
    final res = await http.get(uri).timeout(const Duration(seconds: 4));
    if (res.statusCode == 200) {
      final List list = jsonDecode(utf8.decode(res.bodyBytes));
      return list.map((p) => Patient.fromJson(p)).toList();
    }
    throw Exception('Failed to load patients: ${res.statusCode}');
  }

  Future<Patient> createPatient(Map<String, dynamic> data) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/v1/patients'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    if (res.statusCode == 201 || res.statusCode == 200) {
      return Patient.fromJson(jsonDecode(utf8.decode(res.bodyBytes)));
    }
    throw Exception('Failed to create patient: ${res.statusCode} ${res.body}');
  }

  // Intake Validation
  Future<Map<String, dynamic>> validateIntakeAnswer({
    required String stepId,
    required String questionText,
    required String userUtterance,
    required String language,
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/v1/patients/intake/validate'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'step_id': stepId,
        'question_text': questionText,
        'user_utterance': userUtterance,
        'language': language,
      }),
    );
    if (res.statusCode == 200) {
      return jsonDecode(utf8.decode(res.bodyBytes));
    }
    throw Exception('Intake validation failed: ${res.statusCode}');
  }

  // Direct TTS
  Future<String?> synthesizeSpeech(String text, String language, {String voiceGender = 'female'}) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/v1/audio/synthesize'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'text': text,
        'language': language,
        'voice_gender': voiceGender,
      }),
    );
    if (res.statusCode == 200) {
      final data = jsonDecode(utf8.decode(res.bodyBytes));
      if (data['audio_url'] != null) {
        return resolveAudioUrl(data['audio_url'].toString());
      }
    }
    return null;
  }

  // Direct STT from recorded audio bytes or path
  Future<String> transcribeAudio(List<int> bytes, String language, {String filename = 'audio.wav'}) async {
    final request = http.MultipartRequest('POST', Uri.parse('$_baseUrl/api/v1/audio/transcribe'));
    request.fields['language'] = language;
    request.files.add(http.MultipartFile.fromBytes(
      'audio',
      bytes,
      filename: filename,
      contentType: MediaType('audio', 'wav'),
    ));

    final streamedRes = await request.send();
    final res = await http.Response.fromStream(streamedRes);
    if (res.statusCode == 200) {
      final data = jsonDecode(utf8.decode(res.bodyBytes));
      return data['transcript'] ?? '';
    }
    throw Exception('Transcription failed: ${res.statusCode}');
  }

  // Consultation Lifecycle
  Future<Consultation> createConsultation({
    required String patientId,
    required String patientLanguage,
    required String doctorLanguage,
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/v1/consultations'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'patient_id': patientId,
        'patient_language': patientLanguage,
        'doctor_language': doctorLanguage,
        'mode': 'TURN_BY_TURN',
      }),
    );
    if (res.statusCode == 201 || res.statusCode == 200) {
      return Consultation.fromJson(jsonDecode(utf8.decode(res.bodyBytes)));
    }
    throw Exception('Failed to create consultation: ${res.statusCode}');
  }

  // Text Turn
  Future<TranscriptTurn> processTextTurn({
    required String consultationId,
    required String speaker,
    required String sourceLanguage,
    required String targetLanguage,
    required String text,
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/v1/consultations/$consultationId/turns/text'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'speaker': speaker,
        'source_language': sourceLanguage,
        'target_language': targetLanguage,
        'text': text,
      }),
    );
    if (res.statusCode == 200) {
      return TranscriptTurn.fromJson(jsonDecode(utf8.decode(res.bodyBytes)));
    }
    throw Exception('Failed to process text turn: ${res.statusCode}');
  }

  // Audio Turn
  Future<TranscriptTurn> processAudioTurn({
    required String consultationId,
    required String speaker,
    required String sourceLanguage,
    required String targetLanguage,
    required List<int> audioBytes,
    String filename = 'turn.wav',
  }) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$_baseUrl/api/v1/consultations/$consultationId/turns/audio'),
    );
    request.fields['speaker'] = speaker;
    request.fields['source_language'] = sourceLanguage;
    request.fields['target_language'] = targetLanguage;
    request.files.add(http.MultipartFile.fromBytes(
      'audio',
      audioBytes,
      filename: filename,
      contentType: MediaType('audio', 'wav'),
    ));

    final streamedRes = await request.send();
    final res = await http.Response.fromStream(streamedRes);
    if (res.statusCode == 200) {
      return TranscriptTurn.fromJson(jsonDecode(utf8.decode(res.bodyBytes)));
    }
    throw Exception('Failed to process audio turn: ${res.statusCode}');
  }

  // AI Draft Generation
  Future<DraftRecord> generateDraft(String consultationId) async {
    final res = await http.post(Uri.parse('$_baseUrl/api/v1/consultations/$consultationId/draft'));
    if (res.statusCode == 200) {
      return DraftRecord.fromJson(jsonDecode(utf8.decode(res.bodyBytes)));
    }
    throw Exception('Failed to generate draft: ${res.statusCode}');
  }

  // Doctor AI Assist (Vitals dictation)
  Future<Map<String, dynamic>> doctorAIAssist({
    required String consultationId,
    required String doctorUtterance,
    required String doctorLanguage,
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/v1/consultations/$consultationId/doctor-assist'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'doctor_utterance': doctorUtterance,
        'doctor_language': doctorLanguage,
      }),
    );
    if (res.statusCode == 200) {
      return jsonDecode(utf8.decode(res.bodyBytes));
    }
    throw Exception('Doctor AI assist error: ${res.statusCode}');
  }

  // Record Approval
  Future<Map<String, dynamic>> approveRecord(String consultationId, Map<String, dynamic> payload) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/v1/consultations/$consultationId/approve'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'structured_payload': payload}),
    );
    if (res.statusCode == 200) {
      return jsonDecode(utf8.decode(res.bodyBytes));
    }
    throw Exception('Record approval failed: ${res.statusCode}');
  }

  // Follow-up Scheduling
  Future<Map<String, dynamic>> scheduleFollowup({
    required String consultationId,
    required String patientId,
    required String scheduledDate,
    String? instructions,
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/api/v1/consultations/$consultationId/followup'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'consultation_id': consultationId,
        'patient_id': patientId,
        'scheduled_date': scheduledDate,
        'instructions': instructions ?? '',
      }),
    );
    if (res.statusCode == 201 || res.statusCode == 200) {
      return jsonDecode(utf8.decode(res.bodyBytes));
    }
    throw Exception('Failed to schedule follow-up: ${res.statusCode}');
  }

  // Patient Medical Reports
  Future<List<dynamic>> getPatientReports(String patientId) async {
    final res = await http.get(Uri.parse('$_baseUrl/api/v1/patients/$patientId/reports'));
    if (res.statusCode == 200) {
      return jsonDecode(utf8.decode(res.bodyBytes));
    }
    return [];
  }

  // SQLite Database UI Cache
  Future<Map<String, dynamic>> getUICaches() async {
    final res = await http.get(Uri.parse('$_baseUrl/api/v1/cache/ui')).timeout(const Duration(seconds: 4));
    if (res.statusCode == 200) {
      return jsonDecode(utf8.decode(res.bodyBytes));
    }
    return {};
  }
}


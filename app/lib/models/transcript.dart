class TranscriptTurn {
  final String id;
  final String consultationId;
  final String speaker; // 'PATIENT' or 'DOCTOR'
  final String sourceLanguage;
  final String targetLanguage;
  final String recognizedSourceText;
  final String translatedText;
  final String? audioUrl;
  final bool cacheHit;
  final DateTime timestamp;

  TranscriptTurn({
    required this.id,
    required this.consultationId,
    required this.speaker,
    required this.sourceLanguage,
    required this.targetLanguage,
    required this.recognizedSourceText,
    required this.translatedText,
    this.audioUrl,
    this.cacheHit = false,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  factory TranscriptTurn.fromJson(Map<String, dynamic> json) {
    return TranscriptTurn(
      id: json['id'] ?? '',
      consultationId: json['consultation_id'] ?? '',
      speaker: json['speaker'] ?? 'PATIENT',
      sourceLanguage: json['source_language'] ?? '',
      targetLanguage: json['recipient_language'] ?? json['target_language'] ?? '',
      recognizedSourceText: json['recognized_source_text'] ?? json['original_text'] ?? '',
      translatedText: json['translated_text'] ?? '',
      audioUrl: json['audio_url'],
      cacheHit: json['cache_hit'] == true,
      timestamp: json['timestamp'] != null
          ? DateTime.tryParse(json['timestamp'].toString()) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}


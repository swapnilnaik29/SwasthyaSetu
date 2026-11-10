import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/audio_service.dart';
import '../core/theme.dart';
import '../models/doctor.dart';
import '../models/patient.dart';
import '../models/consultation.dart';
import '../models/transcript.dart';
import '../models/draft_record.dart';
import '../widgets/soundwave_visualizer.dart';
import 'draft_review_screen.dart';

class ConsultationScreen extends StatefulWidget {
  final ApiClient api;
  final Doctor doctor;
  final Patient patient;

  const ConsultationScreen({
    super.key,
    required this.api,
    required this.doctor,
    required this.patient,
  });

  @override
  State<ConsultationScreen> createState() => _ConsultationScreenState();
}

class _ConsultationScreenState extends State<ConsultationScreen> {
  final AudioService _audio = AudioService();
  Consultation? _consultation;
  bool _isInit = true;
  String _activeSpeaker = 'PATIENT'; // 'PATIENT' or 'DOCTOR'
  String _doctorSpeakLang = 'en-IN';
  final List<TranscriptTurn> _turns = [];
  bool _isProcessingTurn = false;

  // Patient Vitals state
  final TextEditingController _weightController = TextEditingController();
  final TextEditingController _heightController = TextEditingController();
  final TextEditingController _bpController = TextEditingController();
  final TextEditingController _pulseController = TextEditingController();
  final TextEditingController _tempController = TextEditingController();
  final TextEditingController _spo2Controller = TextEditingController();

  // Prescriptions state
  final List<PrescriptionItem> _prescriptions = [];

  // Doctor AI Assist state
  final TextEditingController _aiAssistController = TextEditingController();
  bool _isAiAssistLoading = false;
  String? _aiAssistReply;

  @override
  void initState() {
    super.initState();
    _audio.init();
    _doctorSpeakLang = widget.doctor.preferredLanguage;
    _startSession();
  }

  @override
  void dispose() {
    _audio.stopAudio();
    super.dispose();
  }

  Future<void> _startSession() async {
    setState(() => _isInit = true);
    try {
      final c = await widget.api.createConsultation(
        patientId: widget.patient.id,
        patientLanguage: widget.patient.preferredLanguage,
        doctorLanguage: widget.doctor.preferredLanguage,
      );
      setState(() {
        _consultation = c;
        _isInit = false;
      });
    } catch (e) {
      setState(() => _isInit = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to start consultation: $e')),
        );
      }
    }
  }

  Future<void> _handleTurnAudio() async {
    if (_consultation == null || _isProcessingTurn) return;

    if (_audio.isRecording) {
      final bytes = await _audio.stopRecording();
      if (bytes != null && bytes.isNotEmpty) {
        setState(() => _isProcessingTurn = true);
        try {
          final isPatient = _activeSpeaker == 'PATIENT';
          final sourceLang = isPatient ? widget.patient.preferredLanguage : _doctorSpeakLang;
          final targetLang = isPatient ? widget.doctor.preferredLanguage : widget.patient.preferredLanguage;

          final turn = await widget.api.processAudioTurn(
            consultationId: _consultation!.id,
            speaker: _activeSpeaker,
            sourceLanguage: sourceLang,
            targetLanguage: targetLang,
            audioBytes: bytes,
          );

          setState(() {
            _turns.add(turn);
            _activeSpeaker = isPatient ? 'DOCTOR' : 'PATIENT';
            _isProcessingTurn = false;
          });

          // Auto-play synthesized translation for recipient
          if (turn.audioUrl != null) {
            await _audio.playAudio(widget.api.resolveAudioUrl(turn.audioUrl!));
          }
        } catch (e) {
          setState(() => _isProcessingTurn = false);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Turn error: $e')));
          }
        }
      }
    } else {
      await _audio.startRecording();
    }
  }

  Future<void> _handleTurnText(String text) async {
    final clean = text.trim();
    if (_consultation == null || clean.isEmpty || _isProcessingTurn) return;

    setState(() => _isProcessingTurn = true);
    try {
      final isPatient = _activeSpeaker == 'PATIENT';
      final sourceLang = isPatient ? widget.patient.preferredLanguage : _doctorSpeakLang;
      final targetLang = isPatient ? widget.doctor.preferredLanguage : widget.patient.preferredLanguage;

      final turn = await widget.api.processTextTurn(
        consultationId: _consultation!.id,
        speaker: _activeSpeaker,
        sourceLanguage: sourceLang,
        targetLanguage: targetLang,
        text: clean,
      );

      setState(() {
        _turns.add(turn);
        _activeSpeaker = isPatient ? 'DOCTOR' : 'PATIENT';
        _isProcessingTurn = false;
      });

      if (turn.audioUrl != null) {
        await _audio.playAudio(widget.api.resolveAudioUrl(turn.audioUrl!));
      }
    } catch (e) {
      setState(() => _isProcessingTurn = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Turn error: $e')));
      }
    }
  }

  void _showTypeTurnDialog() {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          'Type Utterance (${_activeSpeaker == "PATIENT" ? "Patient" : "Doctor"})',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
        ),
        content: TextField(
          controller: controller,
          maxLines: 3,
          decoration: const InputDecoration(hintText: 'Enter spoken sentence in native language...'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _handleTurnText(controller.text);
            },
            child: const Text('Submit Turn'),
          ),
        ],
      ),
    );
  }

  Future<void> _handleDoctorAIAssist() async {
    final text = _aiAssistController.text.trim();
    if (_consultation == null || text.isEmpty || _isAiAssistLoading) return;

    setState(() {
      _isAiAssistLoading = true;
      _aiAssistReply = null;
    });

    try {
      final res = await widget.api.doctorAIAssist(
        consultationId: _consultation!.id,
        doctorUtterance: text,
        doctorLanguage: _doctorSpeakLang,
      );

      final payload = res['updated_payload'] is Map ? Map<String, dynamic>.from(res['updated_payload']) : {};
      final vitals = payload['vitals'] is Map ? Map<String, dynamic>.from(payload['vitals']) : {};

      setState(() {
        if (vitals['weight_kg'] != null) _weightController.text = vitals['weight_kg'].toString();
        if (vitals['height_cm'] != null) _heightController.text = vitals['height_cm'].toString();
        if (vitals['blood_pressure'] != null) _bpController.text = vitals['blood_pressure'].toString();
        if (vitals['pulse_bpm'] != null) _pulseController.text = vitals['pulse_bpm'].toString();
        if (vitals['temperature_f'] != null) _tempController.text = vitals['temperature_f'].toString();
        if (vitals['spo2_percent'] != null) _spo2Controller.text = vitals['spo2_percent'].toString();

        _aiAssistReply = res['ai_reply'] ?? 'Vitals and details updated successfully.';
        _aiAssistController.clear();
        _isAiAssistLoading = false;
      });
    } catch (e) {
      setState(() => _isAiAssistLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('AI Assist error: $e')));
      }
    }
  }

  void _showAddPrescriptionDialog() {
    final med = TextEditingController();
    final strength = TextEditingController(text: '500mg');
    final dose = TextEditingController(text: '1 tablet');
    final freq = TextEditingController(text: 'Twice daily');
    final dur = TextEditingController(text: '3 days');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Add Prescription', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: med, decoration: const InputDecoration(labelText: 'Medicine Name *')),
              const SizedBox(height: 8),
              TextField(controller: strength, decoration: const InputDecoration(labelText: 'Strength')),
              const SizedBox(height: 8),
              TextField(controller: dose, decoration: const InputDecoration(labelText: 'Dose')),
              const SizedBox(height: 8),
              TextField(controller: freq, decoration: const InputDecoration(labelText: 'Frequency')),
              const SizedBox(height: 8),
              TextField(controller: dur, decoration: const InputDecoration(labelText: 'Duration')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              if (med.text.trim().isNotEmpty) {
                setState(() {
                  _prescriptions.add(PrescriptionItem(
                    medicine: med.text.trim(),
                    strength: strength.text.trim(),
                    dose: dose.text.trim(),
                    frequency: freq.text.trim(),
                    duration: dur.text.trim(),
                  ));
                });
                Navigator.pop(context);
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  Future<void> _generateAIReport() async {
    if (_consultation == null) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: Card(
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(color: AppColors.primaryGreen),
                SizedBox(height: 16),
                Text('Generating clinical report with GPT-6 Luna...', style: TextStyle(fontWeight: FontWeight.w700)),
              ],
            ),
          ),
        ),
      ),
    );

    try {
      final draft = await widget.api.generateDraft(_consultation!.id);

      // Merge current consultation screen vitals & prescriptions into draft
      if (_weightController.text.isNotEmpty) draft.vitals.weightKg = double.tryParse(_weightController.text);
      if (_heightController.text.isNotEmpty) draft.vitals.heightCm = double.tryParse(_heightController.text);
      if (_bpController.text.isNotEmpty) draft.vitals.bloodPressure = _bpController.text;
      if (_pulseController.text.isNotEmpty) draft.vitals.pulseBpm = int.tryParse(_pulseController.text);
      if (_tempController.text.isNotEmpty) draft.vitals.temperatureF = double.tryParse(_tempController.text);
      if (_spo2Controller.text.isNotEmpty) draft.vitals.spo2Percent = int.tryParse(_spo2Controller.text);

      if (_prescriptions.isNotEmpty) {
        draft.prescriptions = List.from(_prescriptions);
      }

      if (mounted) {
        Navigator.pop(context); // Close loading dialog
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => DraftReviewScreen(
              api: widget.api,
              doctor: widget.doctor,
              patient: widget.patient,
              draft: draft,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to generate report: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isInit) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AppColors.primaryGreen)),
      );
    }

    final isDoctor = _activeSpeaker == 'DOCTOR';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.patient.name, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            Text(
              'Patient: ${widget.patient.preferredLanguage} • Attending: ${widget.doctor.name}',
              style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
            ),
          ],
        ),
        actions: [
          ElevatedButton.icon(
            icon: const Icon(Icons.description, size: 16),
            label: const Text('Generate Report', style: TextStyle(fontSize: 12)),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              backgroundColor: AppColors.primaryGreenDeep,
            ),
            onPressed: _generateAIReport,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Speaker Selector Row
            Row(
              children: [
                Expanded(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: () => setState(() => _activeSpeaker = 'PATIENT'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: !isDoctor ? AppColors.patientBg : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: !isDoctor ? AppColors.patientBlue : AppColors.border,
                          width: !isDoctor ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.person, color: !isDoctor ? AppColors.patientBlue : AppColors.textMuted, size: 18),
                          const SizedBox(width: 6),
                          Text(
                            'PATIENT SPEAKS',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: !isDoctor ? FontWeight.w800 : FontWeight.w600,
                              color: !isDoctor ? AppColors.patientBlue : AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: InkWell(
                    borderRadius: BorderRadius.circular(12),
                    onTap: () => setState(() => _activeSpeaker = 'DOCTOR'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: isDoctor ? AppColors.doctorBg : Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDoctor ? AppColors.doctorGreen : AppColors.border,
                          width: isDoctor ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.medical_services, color: isDoctor ? AppColors.doctorGreen : AppColors.textMuted, size: 18),
                          const SizedBox(width: 6),
                          Text(
                            'DOCTOR SPEAKS',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: isDoctor ? FontWeight.w800 : FontWeight.w600,
                              color: isDoctor ? AppColors.doctorGreen : AppColors.textMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Doctor Speaking Language Selector (Shown when Doctor Speaks)
            if (isDoctor) ...[
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: AppColors.greenSubtle,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.greenBorder),
                ),
                child: Row(
                  children: [
                    const Text('Doctor Speaking In:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primaryGreenDeep)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: DropdownButton<String>(
                        value: _doctorSpeakLang,
                        isDense: true,
                        underline: const SizedBox.shrink(),
                        items: const [
                          DropdownMenuItem(value: 'en-IN', child: Text('English')),
                          DropdownMenuItem(value: 'mr-IN', child: Text('मराठी (Marathi)')),
                          DropdownMenuItem(value: 'hi-IN', child: Text('हिंदी (Hindi)')),
                          DropdownMenuItem(value: 'gu-IN', child: Text('ગુજરાતી (Gujarati)')),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _doctorSpeakLang = val);
                        },
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 10),
            ],

            // Direction Banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: isDoctor ? AppColors.greenLight : AppColors.patientBg,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(Icons.swap_horiz, size: 18, color: isDoctor ? AppColors.primaryGreen : AppColors.patientBlue),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      isDoctor
                          ? 'Doctor Speaks ($_doctorSpeakLang) ➔ Patient Listens (${widget.patient.preferredLanguage})'
                          : 'Patient Speaks (${widget.patient.preferredLanguage}) ➔ Doctor Listens (${widget.doctor.preferredLanguage})',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: isDoctor ? AppColors.primaryGreenDeep : AppColors.patientBlue,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Transcript Timeline
            Container(
              constraints: const BoxConstraints(minHeight: 140, maxHeight: 260),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: _turns.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.mic_none, size: 36, color: Color(0xFFCBD5E1)),
                          SizedBox(height: 6),
                          Text('Turn-by-Turn Consultation Ready', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.textMain)),
                          Text('Tap the mic button below to record speech.', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                        ],
                      ),
                    )
                  : ListView.builder(
                      itemCount: _turns.length,
                      itemBuilder: (context, index) {
                        final t = _turns[index];
                        final isTurnPatient = t.speaker == 'PATIENT';
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: isTurnPatient ? AppColors.patientBg : AppColors.greenLight,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: isTurnPatient ? const Color(0xFFBAE6FD) : AppColors.greenBorder),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    isTurnPatient ? 'PATIENT' : 'DOCTOR',
                                    style: TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.w800,
                                      color: isTurnPatient ? AppColors.patientBlue : AppColors.primaryGreen,
                                    ),
                                  ),
                                  if (t.cacheHit)
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(color: Colors.amber.shade100, borderRadius: BorderRadius.circular(4)),
                                      child: const Text('CACHED', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w800, color: Colors.amber)),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text('Spoken: "${t.recognizedSourceText}"', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
                              const SizedBox(height: 2),
                              Text(
                                'Translated: "${t.translatedText}"',
                                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textMain),
                              ),
                              if (t.audioUrl != null) ...[
                                const SizedBox(height: 6),
                                InkWell(
                                  onTap: () => _audio.playAudio(widget.api.resolveAudioUrl(t.audioUrl!)),
                                  child: const Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(Icons.volume_up, size: 14, color: AppColors.primaryGreen),
                                      SizedBox(width: 4),
                                      Text('Play TTS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primaryGreen)),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        );
                      },
                    ),
            ),
            const SizedBox(height: 14),

            // Large Microphone & Controls Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      OutlinedButton.icon(
                        icon: const Icon(Icons.keyboard, size: 16),
                        label: const Text('Type'),
                        onPressed: _showTypeTurnDialog,
                      ),
                      const SizedBox(width: 24),
                      ListenableBuilder(
                        listenable: _audio,
                        builder: (context, _) {
                          final isRec = _audio.isRecording;
                          return InkWell(
                            borderRadius: BorderRadius.circular(40),
                            onTap: _handleTurnAudio,
                            child: Container(
                              width: 64,
                              height: 64,
                              decoration: BoxDecoration(
                                color: isRec ? AppColors.errorRed : AppColors.primaryGreen,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: (isRec ? AppColors.errorRed : AppColors.primaryGreen).withValues(alpha: 0.3),
                                    blurRadius: 14,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Icon(isRec ? Icons.stop : Icons.mic, color: Colors.white, size: 30),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  ListenableBuilder(
                    listenable: _audio,
                    builder: (context, _) {
                      if (_audio.isRecording) {
                        return Column(
                          children: [
                            Text(
                              _audio.formattedTimer,
                              style: const TextStyle(fontWeight: FontWeight.w800, color: AppColors.errorRed, fontSize: 13),
                            ),
                            const SizedBox(height: 4),
                            const SoundwaveVisualizer(isAnimating: true, height: 20),
                          ],
                        );
                      }
                      if (_isProcessingTurn) {
                        return const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryGreen)),
                            SizedBox(width: 8),
                            Text('Translating speech with GPT-6 Luna...', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                          ],
                        );
                      }
                      return const Text(
                        'Tap mic to speak turn in native language',
                        style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Talk to AI Clinical Assistant (Dictate Vitals & Notes)
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.greenSubtle,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.greenBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.auto_awesome, color: AppColors.primaryGreen, size: 20),
                      SizedBox(width: 8),
                      Text(
                        'Talk to AI Clinical Assistant',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                      ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Dictate vitals (Weight, Height, BP, Pulse, Temp) or notes in English, Hindi, or Marathi',
                    style: TextStyle(fontSize: 11, color: AppColors.primaryGreen),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _aiAssistController,
                          decoration: const InputDecoration(
                            hintText: 'e.g. Weight 70 kg, BP 120/80, pulse 74...',
                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          ),
                          onSubmitted: (_) => _handleDoctorAIAssist(),
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (_isAiAssistLoading)
                        const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryGreen))
                      else
                        ElevatedButton(
                          onPressed: _handleDoctorAIAssist,
                          child: const Text('Send'),
                        ),
                    ],
                  ),
                  if (_aiAssistReply != null) ...[
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.greenBorder),
                      ),
                      child: Text(
                        _aiAssistReply!,
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primaryGreenDeep),
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Patient Vitals Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Patient Vitals', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep)),
                      Text('Auto-filled / Editable', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 3,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 8,
                    crossAxisSpacing: 8,
                    childAspectRatio: 1.8,
                    children: [
                      _vitalInput('Weight (kg)', _weightController, 'e.g. 70'),
                      _vitalInput('Height (cm)', _heightController, 'e.g. 175'),
                      _vitalInput('Blood Pressure', _bpController, '120/80'),
                      _vitalInput('Pulse (bpm)', _pulseController, 'e.g. 74'),
                      _vitalInput('Temp (°F)', _tempController, 'e.g. 98.6'),
                      _vitalInput('SpO2 (%)', _spo2Controller, 'e.g. 98'),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),

            // Prescriptions Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Prescriptions', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep)),
                      OutlinedButton.icon(
                        icon: const Icon(Icons.add, size: 14),
                        label: const Text('Add Medicine', style: TextStyle(fontSize: 11)),
                        style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6)),
                        onPressed: _showAddPrescriptionDialog,
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (_prescriptions.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Text(
                        'No medicines prescribed yet. Tap "+ Add Medicine" to prescribe.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: AppColors.textMuted),
                      ),
                    )
                  else
                    ..._prescriptions.map((p) {
                      return Container(
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.greenSubtle,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.greenBorder),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('${p.medicine} ${p.strength ?? ""}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                                Text('${p.dose ?? ""} • ${p.frequency ?? ""} • ${p.duration ?? ""}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                              ],
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.errorRed),
                              onPressed: () => setState(() => _prescriptions.remove(p)),
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _vitalInput(String label, TextEditingController controller, String hint) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
        const SizedBox(height: 2),
        Expanded(
          child: TextField(
            controller: controller,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
            decoration: InputDecoration(
              hintText: hint,
              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            ),
          ),
        ),
      ],
    );
  }
}

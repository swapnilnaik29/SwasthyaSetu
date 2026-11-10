import 'dart:async';
import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/audio_service.dart';
import '../core/theme.dart';
import '../core/i18n_service.dart';
import '../models/doctor.dart';
import '../models/patient.dart';
import '../models/consultation.dart';
import '../models/transcript.dart';
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
  final I18nService _i18n = I18nService();

  Consultation? _consultation;
  final List<TranscriptTurn> _turns = [];
  bool _isInit = true;
  bool _isProcessingTurn = false;
  String _activeSpeaker = 'DOCTOR'; // 'DOCTOR' or 'PATIENT'
  String _doctorSpeakLang = 'en-IN';

  // Duration timer
  int _consultationSeconds = 0;
  Timer? _consultationTimer;

  @override
  void initState() {
    super.initState();
    _i18n.addListener(_onLocaleChange);
    _audio.init();
    _doctorSpeakLang = widget.doctor.preferredLanguage;
    _startConsultation();

    _consultationTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() => _consultationSeconds++);
      }
    });
  }

  void _onLocaleChange() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _i18n.removeListener(_onLocaleChange);
    _consultationTimer?.cancel();
    _audio.stopAudio();
    super.dispose();
  }

  String get _formattedConsultationTime {
    final mins = (_consultationSeconds ~/ 60).toString().padLeft(2, '0');
    final secs = (_consultationSeconds % 60).toString().padLeft(2, '0');
    return '$mins:$secs';
  }

  Future<void> _startConsultation() async {
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
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Turn text error: $e')));
      }
    }
  }

  void _showTypeTurnDialog() {
    final isPatient = _activeSpeaker == 'PATIENT';
    final speakerName = isPatient ? _i18n.t('speakerPatient') : _i18n.t('speakerDoctor');
    final controller = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('$speakerName Turn Input', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'Type $speakerName utterance here...',
            border: const OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text(_i18n.t('cancelBtn'))),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _handleTurnText(controller.text);
            },
            child: const Text('Send Turn'),
          ),
        ],
      ),
    );
  }

  Future<void> _proceedToReport() async {
    if (_consultation == null) return;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => Center(
        child: Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: const Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                CircularProgressIndicator(color: AppColors.primaryGreen),
                SizedBox(height: 16),
                Text('Generating clinical report & extracting vitals...', style: TextStyle(fontWeight: FontWeight.w700)),
              ],
            ),
          ),
        ),
      ),
    );

    try {
      final draft = await widget.api.generateDraft(_consultation!.id);

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
              consultationId: _consultation!.id,
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
        body: Center(
          child: CircularProgressIndicator(color: AppColors.primaryGreen),
        ),
      );
    }

    final isDoctor = _activeSpeaker == 'DOCTOR';

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _i18n.t('consultationTitle'),
              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
            ),
            Text(
              '${widget.patient.name} (${widget.patient.age ?? "--"} / ${widget.patient.gender ?? "--"})',
              style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.greenLight,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.greenBorder),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.timer_outlined, size: 14, color: AppColors.primaryGreen),
                const SizedBox(width: 4),
                Text(
                  _formattedConsultationTime,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primaryGreenDeep),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // Doctor Speaking Language Selector & Speaker Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            color: Colors.white,
            child: Row(
              children: [
                // Doctor Speaking Language
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _doctorSpeakLang,
                        isDense: true,
                        icon: const Icon(Icons.language, size: 16, color: AppColors.primaryGreen),
                        items: const [
                          DropdownMenuItem(value: 'en-IN', child: Text('Dr: English [en-IN]', style: TextStyle(fontSize: 12))),
                          DropdownMenuItem(value: 'mr-IN', child: Text('Dr: मराठी [mr-IN]', style: TextStyle(fontSize: 12))),
                          DropdownMenuItem(value: 'hi-IN', child: Text('Dr: हिंदी [hi-IN]', style: TextStyle(fontSize: 12))),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _doctorSpeakLang = val);
                        },
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                // Speaker Segmented Toggle
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    _speakerPill(
                      label: _i18n.t('speakerDoctor'),
                      isSelected: isDoctor,
                      activeColor: AppColors.primaryGreen,
                      onTap: () => setState(() => _activeSpeaker = 'DOCTOR'),
                    ),
                    const SizedBox(width: 6),
                    _speakerPill(
                      label: _i18n.t('speakerPatient'),
                      isSelected: !isDoctor,
                      activeColor: AppColors.patientBlue,
                      onTap: () => setState(() => _activeSpeaker = 'PATIENT'),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Active Mode Pill
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            color: isDoctor ? AppColors.greenLight : AppColors.patientBg,
            child: Row(
              children: [
                Icon(Icons.swap_horiz, size: 16, color: isDoctor ? AppColors.primaryGreen : AppColors.patientBlue),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    isDoctor
                        ? 'Doctor Speaks ($_doctorSpeakLang) ➔ Patient Listens (${widget.patient.preferredLanguage})'
                        : 'Patient Speaks (${widget.patient.preferredLanguage}) ➔ Doctor Listens (${widget.doctor.preferredLanguage})',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isDoctor ? AppColors.primaryGreenDeep : AppColors.patientBlue,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Transcript Timeline (Takes majority of screen)
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: _turns.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.forum_outlined, size: 48, color: Colors.grey.shade300),
                          const SizedBox(height: 10),
                          Text(
                            _i18n.t('consultationTitle'),
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.textMain),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _i18n.t('tapToSpeak'),
                            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      physics: const BouncingScrollPhysics(),
                      itemCount: _turns.length,
                      itemBuilder: (context, index) {
                        final t = _turns[index];
                        final isTurnPatient = t.speaker == 'PATIENT';
                        return Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(12),
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
                                    isTurnPatient ? _i18n.t('speakerPatient').toUpperCase() : _i18n.t('speakerDoctor').toUpperCase(),
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
          ),

          // Speech Controls Card (Mic + Visualizer)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 10, offset: const Offset(0, -3)),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    OutlinedButton.icon(
                      icon: const Icon(Icons.keyboard, size: 16),
                      label: const Text('Type'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      ),
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
                              color: isRec ? AppColors.errorRed : (isDoctor ? AppColors.primaryGreen : AppColors.patientBlue),
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
                const SizedBox(height: 8),
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
                          const SoundwaveVisualizer(isAnimating: true, height: 18),
                        ],
                      );
                    }
                    if (_isProcessingTurn) {
                      return const Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryGreen)),
                          SizedBox(width: 8),
                          Text('Translating speech with GPT-6 Luna...', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                        ],
                      );
                    }
                    return Text(
                      _i18n.t('tapToSpeak'),
                      style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                    );
                  },
                ),
                const SizedBox(height: 12),
                // Prominent Bottom Button: Proceed to Report & Vitals
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    icon: const Icon(Icons.description_outlined, size: 18),
                    label: Text(
                      _i18n.t('proceedToReportBtn'),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                    ),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: AppColors.primaryGreenDeep,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: _proceedToReport,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _speakerPill({
    required String label,
    required bool isSelected,
    required Color activeColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? activeColor : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? activeColor : AppColors.border),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: isSelected ? Colors.white : AppColors.textMuted,
          ),
        ),
      ),
    );
  }
}

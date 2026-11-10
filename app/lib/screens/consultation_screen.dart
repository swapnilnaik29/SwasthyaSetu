import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
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
  final ScrollController _scrollController = ScrollController();

  Consultation? _consultation;
  final List<TranscriptTurn> _turns = [];
  bool _isInit = true;
  bool _isProcessingTurn = false;
  String _activeSpeaker = 'DOCTOR'; // 'DOCTOR' or 'PATIENT'
  String _doctorSpeakLang = 'en-IN';

  @override
  void initState() {
    super.initState();
    _i18n.addListener(_onLocaleChange);
    _audio.init();
    _doctorSpeakLang = widget.doctor.preferredLanguage;
    _startConsultation();
  }

  void _onLocaleChange() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _i18n.removeListener(_onLocaleChange);
    _audio.stopAudio();
    _scrollController.dispose();
    super.dispose();
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

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
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
          _scrollToBottom();

          // Auto-play synthesized translation for recipient via loudspeaker
          if (turn.audioUrl != null && turn.audioUrl!.isNotEmpty) {
            final resolved = widget.api.resolveAudioUrl(turn.audioUrl!);
            await _audio.playAudio(resolved);
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
      _scrollToBottom();

      if (turn.audioUrl != null && turn.audioUrl!.isNotEmpty) {
        final resolved = widget.api.resolveAudioUrl(turn.audioUrl!);
        await _audio.playAudio(resolved);
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
    final localizedPatientName = widget.patient.localizedName(widget.doctor.preferredLanguage);

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        title: Row(
          children: [
            CircleAvatar(
              backgroundColor: AppColors.greenLight,
              radius: 18,
              child: const Icon(Icons.person, color: AppColors.primaryGreen, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    localizedPatientName,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.textMain),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    '${widget.patient.age ?? "--"} yrs • ${widget.patient.gender ?? "--"} • ${widget.patient.preferredLanguage}',
                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 14),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: AppColors.greenLight,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppColors.greenBorder),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.fiber_manual_record, color: AppColors.primaryGreen, size: 10),
                SizedBox(width: 5),
                Text(
                  'Live Turn-by-Turn',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                ),
              ],
            ),
          ),
        ],
      ),
      body: Container(
        color: const Color(0xFFF8FAFC),
        child: Column(
          children: [
            // Clinical Communication Context Bar
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
              ),
              child: Row(
                children: [
                  // Doctor Speaking Language Selector Dropdown
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _doctorSpeakLang,
                        isDense: true,
                        icon: const Icon(Icons.arrow_drop_down, size: 18, color: AppColors.primaryGreen),
                        items: const [
                          DropdownMenuItem(value: 'en-IN', child: Text('Dr: English', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700))),
                          DropdownMenuItem(value: 'mr-IN', child: Text('Dr: मराठी', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700))),
                          DropdownMenuItem(value: 'hi-IN', child: Text('Dr: हिंदी', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700))),
                        ],
                        onChanged: (val) {
                          if (val != null) setState(() => _doctorSpeakLang = val);
                        },
                      ),
                    ),
                  ),
                  const Spacer(),
                  // Speaker Switch Pill
                  Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.border),
                    ),
                    padding: const EdgeInsets.all(2),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _speakerToggleItem(
                          label: _i18n.t('speakerDoctor'),
                          icon: Icons.medical_services_outlined,
                          isSelected: isDoctor,
                          activeColor: AppColors.primaryGreen,
                          onTap: () => setState(() => _activeSpeaker = 'DOCTOR'),
                        ),
                        _speakerToggleItem(
                          label: _i18n.t('speakerPatient'),
                          icon: Icons.person_outline,
                          isSelected: !isDoctor,
                          activeColor: AppColors.patientBlue,
                          onTap: () => setState(() => _activeSpeaker = 'PATIENT'),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Transcript Timeline Area
            Expanded(
              child: _turns.isEmpty
                  ? Center(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: const BoxDecoration(
                                color: AppColors.greenLight,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.record_voice_over, size: 36, color: AppColors.primaryGreen),
                            ),
                            const SizedBox(height: 14),
                            Text(
                              _i18n.t('consultationTitle'),
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.textMain),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Tap the microphone below to speak. AI translates each turn automatically in real-time.',
                              textAlign: TextAlign.center,
                              style: const TextStyle(fontSize: 12, color: AppColors.textMuted, height: 1.4),
                            ),
                          ],
                        ),
                      ),
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      physics: const BouncingScrollPhysics(),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                      itemCount: _turns.length,
                      itemBuilder: (context, index) {
                        return _buildChatBubble(_turns[index], localizedPatientName);
                      },
                    ),
            ),

            // Bottom Audio Controls Card
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
                      // Type button
                      OutlinedButton.icon(
                        icon: const Icon(Icons.keyboard, size: 16),
                        label: const Text('Type', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        onPressed: _showTypeTurnDialog,
                      ),
                      const SizedBox(width: 24),
                      // Large Interactive Microphone Button
                      ListenableBuilder(
                        listenable: _audio,
                        builder: (context, _) {
                          final isRec = _audio.isRecording;
                          return InkWell(
                            borderRadius: BorderRadius.circular(40),
                            onTap: _handleTurnAudio,
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 200),
                              width: 68,
                              height: 68,
                              decoration: BoxDecoration(
                                color: isRec ? AppColors.errorRed : (isDoctor ? AppColors.primaryGreen : AppColors.patientBlue),
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: (isRec ? AppColors.errorRed : (isDoctor ? AppColors.primaryGreen : AppColors.patientBlue))
                                        .withValues(alpha: 0.35),
                                    blurRadius: isRec ? 20 : 12,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                              ),
                              child: Icon(isRec ? Icons.stop : Icons.mic, color: Colors.white, size: 32),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Status / Soundwave Feedback
                  ListenableBuilder(
                    listenable: _audio,
                    builder: (context, _) {
                      if (_audio.isRecording) {
                        return const Column(
                          children: [
                            SoundwaveVisualizer(isAnimating: true, height: 18),
                            SizedBox(height: 4),
                            Text(
                              'Listening... Tap stop when finished speaking',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.errorRed),
                            ),
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
                        isDoctor ? 'Doctor turn: Speak in $_doctorSpeakLang' : 'Patient turn: Speak in ${widget.patient.preferredLanguage}',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted),
                      );
                    },
                  ),
                  const SizedBox(height: 12),

                  // Prominent Proceed to Report Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.description_outlined, size: 18),
                      label: Text(
                        _i18n.t('proceedToReportBtn'),
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                      ),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 13),
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
      ),
    );
  }

  Widget _speakerToggleItem({
    required String label,
    required IconData icon,
    required bool isSelected,
    required Color activeColor,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isSelected ? activeColor : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: isSelected ? Colors.white : AppColors.textMuted),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isSelected ? Colors.white : AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Modern Medical Chat Bubble Widget
  Widget _buildChatBubble(TranscriptTurn turn, String patientName) {
    final isDoctor = turn.speaker == 'DOCTOR';
    final timeStr = DateFormat('hh:mm a').format(turn.timestamp);

    return Align(
      alignment: isDoctor ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.84),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isDoctor ? AppColors.greenLight : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(14),
            topRight: const Radius.circular(14),
            bottomLeft: isDoctor ? const Radius.circular(14) : const Radius.circular(2),
            bottomRight: isDoctor ? const Radius.circular(2) : const Radius.circular(14),
          ),
          border: Border.all(
            color: isDoctor ? AppColors.greenBorder : const Color(0xFFE2E8F0),
            width: 1.2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Speaker Identity Row
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  isDoctor ? Icons.medical_services : Icons.person,
                  size: 13,
                  color: isDoctor ? AppColors.primaryGreen : AppColors.patientBlue,
                ),
                const SizedBox(width: 5),
                Text(
                  isDoctor ? widget.doctor.name : patientName,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: isDoctor ? AppColors.primaryGreenDeep : AppColors.patientBlue,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '($timeStr)',
                  style: const TextStyle(fontSize: 10, color: AppColors.textMuted),
                ),
              ],
            ),
            const SizedBox(height: 6),

            // Spoken text
            Text(
              'Spoken: "${turn.recognizedSourceText}"',
              style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontStyle: FontStyle.italic),
            ),
            const SizedBox(height: 4),

            // Translated text
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isDoctor ? Colors.white : AppColors.patientBg,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 2),
                    child: Icon(Icons.translate, size: 13, color: AppColors.primaryGreen),
                  ),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(
                      turn.translatedText.isNotEmpty ? turn.translatedText : turn.recognizedSourceText,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textMain, height: 1.3),
                    ),
                  ),
                ],
              ),
            ),

            // TTS Playback Pill Button
            if (turn.audioUrl != null && turn.audioUrl!.isNotEmpty) ...[
              const SizedBox(height: 8),
              InkWell(
                onTap: () => _audio.playAudio(widget.api.resolveAudioUrl(turn.audioUrl!)),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: isDoctor ? AppColors.greenSubtle : const Color(0xFFE0F2FE),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isDoctor ? AppColors.greenBorder : const Color(0xFFBAE6FD),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.volume_up, size: 14, color: isDoctor ? AppColors.primaryGreen : AppColors.patientBlue),
                      const SizedBox(width: 5),
                      Text(
                        'Play Audio',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isDoctor ? AppColors.primaryGreenDeep : AppColors.patientBlue,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

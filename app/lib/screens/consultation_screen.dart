import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/api_client.dart';
import '../core/audio_service.dart';
import '../core/theme.dart';
import '../core/i18n_service.dart';
import '../core/language_names.dart';
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
  String _activeSpeaker = 'PATIENT'; // 'PATIENT' or 'DOCTOR'
  String _consultationMode = 'CONVERSATION'; // 'CONVERSATION' or 'SCRIBE'
  bool _isScribeRecording = false;
  bool _isProcessingScribe = false;
  Timer? _scribeTimer;
  int _scribeSeconds = 0;

  @override
  void initState() {
    super.initState();
    _i18n.addListener(_onLocaleChange);
    _audio.init();
    _startConsultation();
  }

  void _onLocaleChange() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _scribeTimer?.cancel();
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
          final sourceLang = isPatient ? widget.patient.preferredLanguage : 'en-IN';
          final targetLang = isPatient ? 'en-IN' : widget.patient.preferredLanguage;

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
      final sourceLang = isPatient ? widget.patient.preferredLanguage : 'en-IN';
      final targetLang = isPatient ? 'en-IN' : widget.patient.preferredLanguage;

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

  Future<void> _startScribeRecording() async {
    if (_isScribeRecording || _isProcessingScribe) return;
    try {
      await _audio.startRecording();
      _scribeSeconds = 0;
      _scribeTimer?.cancel();
      _scribeTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        if (mounted) setState(() => _scribeSeconds++);
      });
      setState(() => _isScribeRecording = true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to start scribe recording: $e')));
      }
    }
  }

  Future<void> _stopScribeAndGenerateReport() async {
    if (!_isScribeRecording || _isProcessingScribe || _consultation == null) return;
    _scribeTimer?.cancel();
    _scribeTimer = null;
    setState(() {
      _isScribeRecording = false;
      _isProcessingScribe = true;
    });

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
                Text(
                  'Processing consultation audio and generating clinical report...',
                  style: TextStyle(fontWeight: FontWeight.w700),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );

    try {
      final bytes = await _audio.stopRecording();
      if (bytes == null || bytes.isEmpty) {
        throw Exception('No ambient audio recorded. Please record the consultation dialogue first.');
      }

      final draft = await widget.api.processScribeAudio(
        consultationId: _consultation!.id,
        audioBytes: bytes,
        doctorLanguage: widget.doctor.preferredLanguage,
        patientLanguage: widget.patient.preferredLanguage,
      );

      if (mounted) {
        Navigator.pop(context); // close progress dialog
        setState(() => _isProcessingScribe = false);
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
        Navigator.pop(context); // close progress dialog
        setState(() => _isProcessingScribe = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Scribe Error: $e')));
      }
    }
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
                    widget.patient.name,
                    style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.textMain),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    '${widget.patient.age ?? "--"} yrs • ${widget.patient.gender ?? "--"} • ${LanguageNames.getName(widget.patient.preferredLanguage)}',
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
              color: _consultationMode == 'SCRIBE' ? const Color(0xFFFEF2F2) : AppColors.greenLight,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: _consultationMode == 'SCRIBE' ? const Color(0xFFFECACA) : AppColors.greenBorder,
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.fiber_manual_record,
                  color: _consultationMode == 'SCRIBE' ? AppColors.errorRed : AppColors.primaryGreen,
                  size: 10,
                ),
                const SizedBox(width: 5),
                Text(
                  _consultationMode == 'SCRIBE' ? 'Ambient Scribe' : 'Live Turn-by-Turn',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    color: _consultationMode == 'SCRIBE' ? AppColors.errorRed : AppColors.primaryGreenDeep,
                  ),
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
            // Mode Selector Bar: Conversation vs Scribe Mode
            _buildModeSelector(),

            if (_consultationMode == 'SCRIBE')
              _buildScribeView()
            else ...[
            // BIG Speaker Selector: Doctor vs Patient
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
              ),
              child: Row(
                children: [
                  _buildBigSpeakerButton(
                    title: 'Doctor',
                    subtitle: 'English',
                    icon: Icons.medical_services,
                    isSelected: isDoctor,
                    activeColor: AppColors.primaryGreen,
                    onTap: () => setState(() => _activeSpeaker = 'DOCTOR'),
                  ),
                  const SizedBox(width: 10),
                  _buildBigSpeakerButton(
                    title: 'Patient',
                    subtitle: LanguageNames.getName(widget.patient.preferredLanguage),
                    icon: Icons.person,
                    isSelected: !isDoctor,
                    activeColor: AppColors.patientBlue,
                    onTap: () => setState(() => _activeSpeaker = 'PATIENT'),
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
                        return _buildChatBubble(_turns[index], widget.patient.name);
                      },
                    ),
            ),

            // Bottom Audio Controls Card with SafeArea to avoid bottom phone navigation bar clipping
            SafeArea(
              top: false,
              bottom: true,
              child: Container(
                padding: EdgeInsets.fromLTRB(16, 12, 16, 16 + MediaQuery.of(context).viewPadding.bottom),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 10, offset: const Offset(0, -3)),
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
                              Text('Translating...', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                            ],
                          );
                        }
                        return Text(
                          isDoctor ? 'Doctor turn: Speak in English' : 'Patient turn: Speak in ${LanguageNames.getName(widget.patient.preferredLanguage)}',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textMuted),
                        );
                      },
                    ),
                    const SizedBox(height: 12),

                    // Prominent Proceed to Report Button
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.description_outlined, size: 20),
                        label: Text(
                          _i18n.t('proceedToReportBtn'),
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryGreenDeep,
                          elevation: 2,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                        onPressed: _proceedToReport,
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

  Widget _buildModeSelector() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: const Color(0xFFE2E8F0),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: InkWell(
              onTap: () {
                if (_isScribeRecording) return;
                setState(() => _consultationMode = 'CONVERSATION');
              },
              borderRadius: BorderRadius.circular(10),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: _consultationMode == 'CONVERSATION' ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: _consultationMode == 'CONVERSATION'
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : [],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.forum_outlined,
                      size: 16,
                      color: _consultationMode == 'CONVERSATION' ? AppColors.primaryGreen : AppColors.textMuted,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Conversation Mode',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: _consultationMode == 'CONVERSATION' ? AppColors.primaryGreenDeep : AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 4),
          Expanded(
            child: InkWell(
              onTap: () {
                if (_audio.isRecording) return;
                setState(() => _consultationMode = 'SCRIBE');
              },
              borderRadius: BorderRadius.circular(10),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(vertical: 8),
                decoration: BoxDecoration(
                  color: _consultationMode == 'SCRIBE' ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(10),
                  boxShadow: _consultationMode == 'SCRIBE'
                      ? [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          ),
                        ]
                      : [],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.mic_none,
                      size: 16,
                      color: _consultationMode == 'SCRIBE' ? AppColors.errorRed : AppColors.textMuted,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'Ambient Scribe Mode',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: _consultationMode == 'SCRIBE' ? AppColors.errorRed : AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScribeView() {
    final minutes = (_scribeSeconds ~/ 60).toString().padLeft(2, '0');
    final seconds = (_scribeSeconds % 60).toString().padLeft(2, '0');

    return Expanded(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Scribe Overview Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: _isScribeRecording ? const Color(0xFFFEE2E2) : AppColors.greenLight,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          _isScribeRecording ? Icons.mic : Icons.hearing,
                          color: _isScribeRecording ? AppColors.errorRed : AppColors.primaryGreenDeep,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _isScribeRecording ? 'Listening Ambiently' : 'Ambient Scribe Mode',
                              style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16, color: AppColors.textMain),
                            ),
                            Text(
                              _isScribeRecording
                                  ? 'Recording doctor-patient conversation in real-time'
                                  : 'Continuous listening without turn-taking',
                              style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(Icons.info_outline, size: 18, color: AppColors.primaryGreen),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Doctor and patient can converse freely in any language. The system translates everything to English and extracts the structured clinical report, vitals, and prescription.',
                            style: const TextStyle(fontSize: 11, color: AppColors.textMain, height: 1.35),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 20),

            // Central Visualizer & Duration Timer
            Container(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: _isScribeRecording ? AppColors.errorRed.withValues(alpha: 0.3) : AppColors.border,
                  width: _isScribeRecording ? 2 : 1,
                ),
                boxShadow: [
                  BoxShadow(
                    color: _isScribeRecording ? AppColors.errorRed.withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.04),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Pulsing Status Pill
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: _isScribeRecording ? const Color(0xFFFEE2E2) : const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.fiber_manual_record,
                          size: 10,
                          color: _isScribeRecording ? AppColors.errorRed : AppColors.textMuted,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          _isScribeRecording ? 'RECORDING AMBIENT AUDIO' : 'STANDBY - READY TO RECORD',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: _isScribeRecording ? AppColors.errorRed : AppColors.textMuted,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Digital Timer Display
                  Text(
                    '$minutes:$seconds',
                    style: TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.w900,
                      letterSpacing: 2,
                      color: _isScribeRecording ? AppColors.textMain : AppColors.textMuted,
                    ),
                  ),

                  const SizedBox(height: 14),

                  // Soundwave visualizer
                  SoundwaveVisualizer(
                    isAnimating: _isScribeRecording,
                    height: 24,
                  ),

                  const SizedBox(height: 16),
                  Text(
                    _isScribeRecording
                        ? 'Listening to dialogue between doctor and ${widget.patient.name}...'
                        : 'Tap "Start Recording" to begin consultation listening',
                    style: const TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Two Big Scribe Buttons
            Row(
              children: [
                // 1. Start Recording Button
                Expanded(
                  child: SizedBox(
                    height: 56,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.play_arrow_rounded, size: 26),
                      label: const Text(
                        'Start Recording',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryGreen,
                        foregroundColor: Colors.white,
                        elevation: _isScribeRecording ? 0 : 3,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        disabledBackgroundColor: const Color(0xFFE2E8F0),
                        disabledForegroundColor: AppColors.textMuted,
                      ),
                      onPressed: _isScribeRecording ? null : _startScribeRecording,
                    ),
                  ),
                ),

                const SizedBox(width: 12),

                // 2. Stop & Generate Report Button
                Expanded(
                  child: SizedBox(
                    height: 56,
                    child: ElevatedButton.icon(
                      icon: const Icon(Icons.stop_circle_outlined, size: 24),
                      label: const Text(
                        'Stop & Generate',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.errorRed,
                        foregroundColor: Colors.white,
                        elevation: _isScribeRecording ? 4 : 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        disabledBackgroundColor: const Color(0xFFF1F5F9),
                        disabledForegroundColor: AppColors.textMuted,
                      ),
                      onPressed: _isScribeRecording ? _stopScribeAndGenerateReport : null,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBigSpeakerButton({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool isSelected,
    required Color activeColor,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 180),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
            decoration: BoxDecoration(
              color: isSelected ? activeColor : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isSelected ? activeColor : AppColors.border,
                width: isSelected ? 2 : 1,
              ),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: activeColor.withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 3),
                      ),
                    ]
                  : [],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.white.withValues(alpha: 0.22) : Colors.white,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    icon,
                    size: 20,
                    color: isSelected ? Colors.white : AppColors.textMain,
                  ),
                ),
                const SizedBox(width: 8),
                Flexible(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: isSelected ? Colors.white : AppColors.textMain,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        subtitle,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: isSelected ? Colors.white.withValues(alpha: 0.9) : AppColors.textMuted,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
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

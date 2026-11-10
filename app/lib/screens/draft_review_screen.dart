import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/api_client.dart';
import '../core/audio_service.dart';
import '../core/theme.dart';
import '../core/i18n_service.dart';
import '../models/doctor.dart';
import '../models/patient.dart';
import '../models/draft_record.dart';
import '../widgets/soundwave_visualizer.dart';
import 'approval_screen.dart';

class DraftReviewScreen extends StatefulWidget {
  final ApiClient api;
  final Doctor doctor;
  final Patient patient;
  final DraftRecord draft;
  final String consultationId;

  const DraftReviewScreen({
    super.key,
    required this.api,
    required this.doctor,
    required this.patient,
    required this.draft,
    required this.consultationId,
  });

  @override
  State<DraftReviewScreen> createState() => _DraftReviewScreenState();
}

class _DraftReviewScreenState extends State<DraftReviewScreen> {
  final AudioService _audio = AudioService();
  final I18nService _i18n = I18nService();

  late TextEditingController _diagController;
  late TextEditingController _notesController;
  late TextEditingController _followupController;

  // Vitals Controllers
  late TextEditingController _weightController;
  late TextEditingController _heightController;
  late TextEditingController _bpController;
  late TextEditingController _pulseController;
  late TextEditingController _tempController;
  late TextEditingController _spo2Controller;

  // Prescriptions List
  late List<PrescriptionItem> _prescriptions;

  // AI Assist
  final TextEditingController _aiAssistController = TextEditingController();
  bool _isAiAssistLoading = false;
  String? _aiAssistReply;

  // Voice dictation target ('none', 'ai_assist', 'vitals', 'rx', 'notes')
  String _activeDictationTarget = 'none';

  DateTime? _selectedNextDate;
  bool _isApproving = false;

  @override
  void initState() {
    super.initState();
    _audio.init();

    _diagController = TextEditingController(text: widget.draft.doctorDiagnosis);
    _notesController = TextEditingController(text: widget.draft.doctorNotes);
    _followupController = TextEditingController(
      text: widget.draft.followUpRecommendation ?? 'Review in 3-5 days if symptoms persist',
    );

    final v = widget.draft.vitals;
    _weightController = TextEditingController(text: v.weightKg != null ? v.weightKg.toString() : '');
    _heightController = TextEditingController(text: v.heightCm != null ? v.heightCm.toString() : '');
    _bpController = TextEditingController(text: v.bloodPressure ?? '');
    _pulseController = TextEditingController(text: v.pulseBpm != null ? v.pulseBpm.toString() : '');
    _tempController = TextEditingController(text: v.temperatureF != null ? v.temperatureF.toString() : '');
    _spo2Controller = TextEditingController(text: v.spo2Percent != null ? v.spo2Percent.toString() : '');

    _prescriptions = List.from(widget.draft.prescriptions);

    if (widget.draft.recommendedNextVisitDate != null) {
      _selectedNextDate = DateTime.tryParse(widget.draft.recommendedNextVisitDate!);
    }
    _selectedNextDate ??= DateTime.now().add(Duration(days: widget.draft.followUpDays ?? 3));
  }

  @override
  void dispose() {
    _audio.stopAudio();
    _diagController.dispose();
    _notesController.dispose();
    _followupController.dispose();
    _weightController.dispose();
    _heightController.dispose();
    _bpController.dispose();
    _pulseController.dispose();
    _tempController.dispose();
    _spo2Controller.dispose();
    _aiAssistController.dispose();
    super.dispose();
  }

  // Voice Dictation Handler for any field or AI Assist
  Future<void> _toggleDictation(String target) async {
    if (_audio.isRecording) {
      final bytes = await _audio.stopRecording();
      final currentTarget = _activeDictationTarget;
      setState(() => _activeDictationTarget = 'none');

      if (bytes != null && bytes.isNotEmpty) {
        setState(() => _isAiAssistLoading = true);
        try {
          final transcribed = await widget.api.transcribeAudio(bytes, widget.doctor.preferredLanguage);
          if (transcribed.trim().isNotEmpty) {
            if (currentTarget == 'ai_assist' || currentTarget == 'vitals' || currentTarget == 'rx') {
              // Send through Doctor AI Assist to parse and update fields
              await _processAIAssistText(transcribed.trim());
            } else if (currentTarget == 'notes') {
              setState(() {
                final currentNotes = _notesController.text.trim();
                _notesController.text = currentNotes.isEmpty ? transcribed.trim() : '$currentNotes. ${transcribed.trim()}';
                _isAiAssistLoading = false;
              });
            }
          } else {
            setState(() => _isAiAssistLoading = false);
          }
        } catch (e) {
          setState(() => _isAiAssistLoading = false);
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Dictation error: $e')));
          }
        }
      }
    } else {
      final started = await _audio.startRecording();
      if (started) {
        setState(() => _activeDictationTarget = target);
      }
    }
  }

  Future<void> _processAIAssistText(String text) async {
    final clean = text.trim();
    if (clean.isEmpty) return;

    setState(() {
      _isAiAssistLoading = true;
      _aiAssistReply = null;
    });

    try {
      final res = await widget.api.doctorAIAssist(
        consultationId: widget.consultationId,
        doctorUtterance: clean,
        doctorLanguage: widget.doctor.preferredLanguage,
      );

      final payload = res['updated_payload'] is Map ? Map<String, dynamic>.from(res['updated_payload']) : {};
      final vitals = payload['vitals'] is Map ? Map<String, dynamic>.from(payload['vitals']) : {};
      final rxList = payload['prescriptions'] is List ? payload['prescriptions'] as List : [];

      setState(() {
        if (vitals['weight_kg'] != null) _weightController.text = vitals['weight_kg'].toString();
        if (vitals['height_cm'] != null) _heightController.text = vitals['height_cm'].toString();
        if (vitals['blood_pressure'] != null) _bpController.text = vitals['blood_pressure'].toString();
        if (vitals['pulse_bpm'] != null) _pulseController.text = vitals['pulse_bpm'].toString();
        if (vitals['temperature_f'] != null) _tempController.text = vitals['temperature_f'].toString();
        if (vitals['spo2_percent'] != null) _spo2Controller.text = vitals['spo2_percent'].toString();

        if (rxList.isNotEmpty) {
          for (final item in rxList) {
            if (item is Map) {
              _prescriptions.add(PrescriptionItem(
                medicine: item['medicine']?.toString() ?? 'Medication',
                strength: item['strength']?.toString() ?? '',
                dose: item['dose']?.toString() ?? '',
                frequency: item['frequency']?.toString() ?? '',
                duration: item['duration']?.toString() ?? '',
              ));
            }
          }
        }

        _aiAssistReply = res['ai_reply'] ?? 'Report and vitals updated successfully.';
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
        title: Text(_i18n.t('addMedicineBtn'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
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
          TextButton(onPressed: () => Navigator.pop(context), child: Text(_i18n.t('cancelBtn'))),
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

  Future<void> _approve() async {
    setState(() => _isApproving = true);
    try {
      widget.draft.doctorDiagnosis = _diagController.text.trim();
      widget.draft.doctorNotes = _notesController.text.trim();
      widget.draft.followUpRecommendation = _followupController.text.trim();
      if (_selectedNextDate != null) {
        widget.draft.recommendedNextVisitDate = DateFormat('yyyy-MM-dd').format(_selectedNextDate!);
      }

      // Sync vitals from controllers
      final v = widget.draft.vitals;
      if (_weightController.text.isNotEmpty) v.weightKg = double.tryParse(_weightController.text);
      if (_heightController.text.isNotEmpty) v.heightCm = double.tryParse(_heightController.text);
      if (_bpController.text.isNotEmpty) v.bloodPressure = _bpController.text.trim();
      if (_pulseController.text.isNotEmpty) v.pulseBpm = int.tryParse(_pulseController.text);
      if (_tempController.text.isNotEmpty) v.temperatureF = double.tryParse(_tempController.text);
      if (_spo2Controller.text.isNotEmpty) v.spo2Percent = int.tryParse(_spo2Controller.text);

      widget.draft.prescriptions = List.from(_prescriptions);

      await widget.api.approveRecord(widget.consultationId, widget.draft.toStructuredPayload());

      if (mounted) {
        setState(() => _isApproving = false);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => ApprovalScreen(
              api: widget.api,
              doctor: widget.doctor,
              patient: widget.patient,
              consultationId: widget.consultationId,
              initialDate: _selectedNextDate ?? DateTime.now().add(const Duration(days: 3)),
              initialNotes: _followupController.text.trim(),
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isApproving = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Approval failed: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _i18n.t('generateAiReportBtn'),
          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Canonical English Storage Badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.greenLight,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.greenBorder),
              ),
              child: Row(
                children: [
                  const Icon(Icons.verified, color: AppColors.primaryGreen, size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _i18n.t('allPatientsStoredEnglish'),
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primaryGreenDeep),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // 1. TALK TO AI CLINICAL ASSISTANT (With Voice Dictation & Text)
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.auto_awesome, color: AppColors.primaryGreen, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            _i18n.t('talkToAiTitle'),
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                          ),
                        ],
                      ),
                      // Mic Dictation for AI Clinical Assistant
                      _micButton(
                        target: 'ai_assist',
                        tooltip: 'Dictate updates to AI',
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _i18n.t('talkToAiDesc'),
                    style: const TextStyle(fontSize: 11, color: AppColors.primaryGreen),
                  ),
                  if (_activeDictationTarget == 'ai_assist' && _audio.isRecording) ...[
                    const SizedBox(height: 8),
                    const SoundwaveVisualizer(isAnimating: true, height: 18),
                  ],
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _aiAssistController,
                          decoration: const InputDecoration(
                            hintText: 'e.g. Weight 68 kg, BP 120/80, add Paracetamol...',
                            contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          ),
                          onSubmitted: (val) => _processAIAssistText(val),
                        ),
                      ),
                      const SizedBox(width: 8),
                      if (_isAiAssistLoading)
                        const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primaryGreen))
                      else
                        ElevatedButton(
                          onPressed: () => _processAIAssistText(_aiAssistController.text),
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
            const SizedBox(height: 16),

            // 2. PATIENT VITALS CARD (Editable + Voice Dictation Mic)
            Container(
              padding: const EdgeInsets.all(14),
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
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _i18n.t('patientVitalsTitle'),
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                          ),
                          Text(_i18n.t('patientVitalsSubtitle'), style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                        ],
                      ),
                      _micButton(
                        target: 'vitals',
                        tooltip: _i18n.t('dictateVitalsTooltip'),
                      ),
                    ],
                  ),
                  if (_activeDictationTarget == 'vitals' && _audio.isRecording) ...[
                    const SizedBox(height: 8),
                    const SoundwaveVisualizer(isAnimating: true, height: 18),
                  ],
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _vitalField(_weightController, _i18n.t('vitalsWeight'), 'e.g. 70')),
                      const SizedBox(width: 10),
                      Expanded(child: _vitalField(_heightController, _i18n.t('vitalsHeight'), 'e.g. 172')),
                      const SizedBox(width: 10),
                      Expanded(child: _vitalField(_bpController, _i18n.t('vitalsBP'), '120/80')),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(child: _vitalField(_pulseController, _i18n.t('vitalsPulse'), 'e.g. 74')),
                      const SizedBox(width: 10),
                      Expanded(child: _vitalField(_tempController, _i18n.t('vitalsTemp'), 'e.g. 98.6')),
                      const SizedBox(width: 10),
                      Expanded(child: _vitalField(_spo2Controller, _i18n.t('vitalsSpO2'), 'e.g. 99')),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 3. PRESCRIPTIONS CARD (Editable List + Voice Dictation Mic)
            Container(
              padding: const EdgeInsets.all(14),
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
                      Text(
                        _i18n.t('prescriptionsTitle'),
                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                      ),
                      Row(
                        children: [
                          _micButton(
                            target: 'rx',
                            tooltip: _i18n.t('dictateRxTooltip'),
                          ),
                          const SizedBox(width: 8),
                          OutlinedButton.icon(
                            icon: const Icon(Icons.add, size: 14),
                            label: Text(_i18n.t('addMedicineBtn'), style: const TextStyle(fontSize: 11)),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            ),
                            onPressed: _showAddPrescriptionDialog,
                          ),
                        ],
                      ),
                    ],
                  ),
                  if (_activeDictationTarget == 'rx' && _audio.isRecording) ...[
                    const SizedBox(height: 8),
                    const SoundwaveVisualizer(isAnimating: true, height: 18),
                  ],
                  const SizedBox(height: 10),
                  if (_prescriptions.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 8),
                      child: Text('No medicines prescribed yet. Tap "Add Medicine" or speak via mic.', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                    )
                  else
                    ..._prescriptions.asMap().entries.map((entry) {
                      final idx = entry.key;
                      final p = entry.value;
                      return Container(
                        margin: const EdgeInsets.only(bottom: 6),
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.greenSubtle,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.greenBorder),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.medication, color: AppColors.primaryGreen, size: 20),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${p.medicine} ${p.strength != null && p.strength!.isNotEmpty ? "(${p.strength})" : ""}',
                                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  Text(
                                    '${p.dose ?? ""} • ${p.frequency ?? ""} ${p.duration != null && p.duration!.isNotEmpty ? "• ${p.duration}" : ""}',
                                    style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.errorRed),
                              padding: EdgeInsets.zero,
                              constraints: const BoxConstraints(),
                              onPressed: () {
                                setState(() => _prescriptions.removeAt(idx));
                              },
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 4. DIAGNOSIS & CLINICAL NOTES
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _i18n.t('diagnosisLabel'),
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textMain),
                  ),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _diagController,
                    decoration: const InputDecoration(hintText: 'Enter confirmed clinical diagnosis...'),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _i18n.t('notesLabel'),
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textMain),
                      ),
                      _micButton(
                        target: 'notes',
                        tooltip: _i18n.t('dictateNotesTooltip'),
                      ),
                    ],
                  ),
                  if (_activeDictationTarget == 'notes' && _audio.isRecording) ...[
                    const SizedBox(height: 8),
                    const SoundwaveVisualizer(isAnimating: true, height: 18),
                  ],
                  const SizedBox(height: 4),
                  TextField(
                    controller: _notesController,
                    maxLines: 4,
                    decoration: const InputDecoration(hintText: 'Clinical observations, rest advisory, diet instructions...'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 5. RECOMMENDED NEXT CONSULTATION DATE
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _i18n.t('nextConsultationDate'),
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _followupController,
                    decoration: const InputDecoration(labelText: 'Follow-up Recommendation'),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Text('Follow-up Date: ', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                      Text(
                        _selectedNextDate != null ? DateFormat('dd MMM yyyy').format(_selectedNextDate!) : 'Not set',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.primaryGreen),
                      ),
                      const Spacer(),
                      OutlinedButton.icon(
                        icon: const Icon(Icons.calendar_month, size: 16),
                        label: const Text('Change Date'),
                        onPressed: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: _selectedNextDate ?? DateTime.now().add(const Duration(days: 3)),
                            firstDate: DateTime.now(),
                            lastDate: DateTime.now().add(const Duration(days: 365)),
                          );
                          if (picked != null) {
                            setState(() => _selectedNextDate = picked);
                          }
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // APPROVE & FINALIZE BUTTON
            ElevatedButton.icon(
              icon: _isApproving
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.check_circle),
              label: Text(
                _isApproving ? 'Approving & Finalizing...' : _i18n.t('approveRecordBtn'),
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
              ),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.all(16),
                backgroundColor: AppColors.primaryGreen,
              ),
              onPressed: _isApproving ? null : _approve,
            ),
          ],
        ),
      ),
    );
  }

  Widget _micButton({required String target, required String tooltip}) {
    final isThisRecording = _activeDictationTarget == target && _audio.isRecording;
    return InkWell(
      onTap: () => _toggleDictation(target),
      borderRadius: BorderRadius.circular(20),
      child: Tooltip(
        message: tooltip,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: isThisRecording ? AppColors.errorRed : AppColors.greenLight,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: isThisRecording ? AppColors.errorRed : AppColors.greenBorder),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                isThisRecording ? Icons.stop : Icons.mic,
                size: 16,
                color: isThisRecording ? Colors.white : AppColors.primaryGreen,
              ),
              const SizedBox(width: 4),
              Text(
                isThisRecording ? 'Stop' : 'Dictate',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: isThisRecording ? Colors.white : AppColors.primaryGreenDeep,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _vitalField(TextEditingController controller, String label, String hint) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: 4),
        TextField(
          controller: controller,
          decoration: InputDecoration(
            hintText: hint,
            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          ),
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
        ),
      ],
    );
  }
}

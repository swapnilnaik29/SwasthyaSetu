import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/api_client.dart';
import '../core/theme.dart';
import '../models/doctor.dart';
import '../models/patient.dart';
import '../models/draft_record.dart';
import 'approval_screen.dart';

class DraftReviewScreen extends StatefulWidget {
  final ApiClient api;
  final Doctor doctor;
  final Patient patient;
  final DraftRecord draft;

  const DraftReviewScreen({
    super.key,
    required this.api,
    required this.doctor,
    required this.patient,
    required this.draft,
  });

  @override
  State<DraftReviewScreen> createState() => _DraftReviewScreenState();
}

class _DraftReviewScreenState extends State<DraftReviewScreen> {
  late TextEditingController _diagController;
  late TextEditingController _notesController;
  late TextEditingController _followupController;
  DateTime? _selectedNextDate;
  bool _isApproving = false;

  @override
  void initState() {
    super.initState();
    _diagController = TextEditingController(text: widget.draft.doctorDiagnosis);
    _notesController = TextEditingController(text: widget.draft.doctorNotes);
    _followupController = TextEditingController(text: widget.draft.followUpRecommendation ?? 'Review in 3-5 days if symptoms persist');

    if (widget.draft.recommendedNextVisitDate != null) {
      _selectedNextDate = DateTime.tryParse(widget.draft.recommendedNextVisitDate!);
    }
    _selectedNextDate ??= DateTime.now().add(Duration(days: widget.draft.followUpDays ?? 3));
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

      await widget.api.approveRecord(widget.draft.consultationId, widget.draft.toStructuredPayload());

      if (mounted) {
        setState(() => _isApproving = false);
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => ApprovalScreen(
              api: widget.api,
              doctor: widget.doctor,
              patient: widget.patient,
              consultationId: widget.draft.consultationId,
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
        title: const Text('Review Clinical Draft'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Physician Supervision Banner
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.greenLight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.greenBorder),
              ),
              child: const Row(
                children: [
                  Icon(Icons.shield_outlined, color: AppColors.primaryGreen, size: 22),
                  SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'AI-Synthesized Draft • Attending Physician Review',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                        ),
                        Text(
                          'Review and edit diagnosis, prescriptions, and advice before final approval.',
                          style: TextStyle(fontSize: 11, color: AppColors.primaryGreen),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Doctor Diagnosis
            const Text('Primary Clinical Diagnosis *', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textMain)),
            const SizedBox(height: 4),
            TextField(
              controller: _diagController,
              decoration: const InputDecoration(hintText: 'Enter confirmed clinical diagnosis...'),
            ),
            const SizedBox(height: 14),

            // Doctor Notes
            const Text('Physician Notes & Patient Advisory (English)', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textMain)),
            const SizedBox(height: 4),
            TextField(
              controller: _notesController,
              maxLines: 4,
              decoration: const InputDecoration(hintText: 'Clinical observations, rest advisory, diet instructions...'),
            ),
            const SizedBox(height: 16),

            // Recommended Next Consultation Date
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
                  const Text('Recommended Next Consultation', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep)),
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
            const SizedBox(height: 16),

            // Symptoms Summary
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
                  const Text('Patient-Reported Symptoms', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  if (widget.draft.symptoms.isEmpty)
                    const Text('No distinct symptoms extracted.', style: TextStyle(fontSize: 12, color: AppColors.textMuted))
                  else
                    ...widget.draft.symptoms.map((s) => Padding(
                          padding: const EdgeInsets.only(bottom: 4),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle_outline, color: AppColors.primaryGreen, size: 16),
                              const SizedBox(width: 8),
                              Text('${s.symptom} ${s.duration != null ? "(${s.duration})" : ""}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                            ],
                          ),
                        )),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Prescriptions Summary
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
                  const Text('Prescriptions', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
                  const SizedBox(height: 8),
                  if (widget.draft.prescriptions.isEmpty)
                    const Text('No medicines prescribed.', style: TextStyle(fontSize: 12, color: AppColors.textMuted))
                  else
                    ...widget.draft.prescriptions.map((p) => Container(
                          margin: const EdgeInsets.only(bottom: 6),
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: AppColors.greenSubtle, borderRadius: BorderRadius.circular(8)),
                          child: Row(
                            children: [
                              const Icon(Icons.medication, color: AppColors.primaryGreen, size: 18),
                              const SizedBox(width: 8),
                              Text('${p.medicine} ${p.strength ?? ""} • ${p.dose ?? ""} • ${p.frequency ?? ""}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                            ],
                          ),
                        )),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Approve Button
            ElevatedButton.icon(
              icon: _isApproving
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.check_circle),
              label: Text(_isApproving ? 'Approving & Finalizing...' : 'Approve & Finalize Record'),
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
}


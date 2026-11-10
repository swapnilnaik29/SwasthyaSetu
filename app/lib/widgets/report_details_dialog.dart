import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/theme.dart';

class ReportDetailsDialog extends StatelessWidget {
  final Map<String, dynamic> report;

  const ReportDetailsDialog({super.key, required this.report});

  static void show(BuildContext context, Map<String, dynamic> report) {
    showDialog(
      context: context,
      builder: (context) => ReportDetailsDialog(report: report),
    );
  }

  @override
  Widget build(BuildContext context) {
    final diagnosis = report['doctor_diagnosis'] ?? 'Clinical Consultation Record';
    final doctorName = report['doctor_name'] ?? 'Dr. Swapnil Naik';
    final patientName = report['patient_name'] ?? 'Patient';
    final notes = report['doctor_notes'] ?? '';
    final dateStr = report['date'] != null
        ? DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.tryParse(report['date'].toString()) ?? DateTime.now())
        : DateFormat('dd MMM yyyy').format(DateTime.now());

    final vitals = report['vitals'] is Map ? Map<String, dynamic>.from(report['vitals']) : {};
    final prescriptions = report['prescriptions'] is List ? report['prescriptions'] as List : [];
    final symptoms = report['symptoms'] is List ? report['symptoms'] as List : [];
    final followUp = report['follow_up_recommendation']?.toString();
    final isApproved = report['status'] == 'APPROVED';

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      backgroundColor: Colors.white,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 550, maxHeight: 700),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          diagnosis,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primaryGreenDeep,
                          ),
                        ),
                        Text(
                          'Recorded: $dateStr',
                          style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(height: 24),

              // Scrollable Body
              Expanded(
                child: SingleChildScrollView(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Patient and Doctor Meta Row
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('PATIENT', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
                                  Text(patientName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textMain)),
                                ],
                              ),
                            ),
                            Container(width: 1, height: 32, color: AppColors.border),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('ATTENDING PHYSICIAN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
                                  Text(doctorName, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.primaryGreen)),
                                  const Text('MBBS, MD (General Medicine)', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Status Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: isApproved ? AppColors.greenLight : AppColors.warningBg,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: isApproved ? AppColors.greenBorder : const Color(0xFFFDE68A)),
                        ),
                        child: Row(
                          children: [
                            Icon(isApproved ? Icons.check_circle : Icons.schedule, size: 16, color: isApproved ? AppColors.primaryGreen : AppColors.warningAmber),
                            const SizedBox(width: 8),
                            Text(
                              isApproved ? 'Official Approved Record (Clinical English)' : 'Draft Record',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                                color: isApproved ? AppColors.primaryGreenDeep : AppColors.warningAmber,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      // Vitals
                      if (vitals.isNotEmpty) ...[
                        const Text('CLINICAL VITALS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: [
                            if (vitals['blood_pressure'] != null)
                              _chip('BP: ${vitals['blood_pressure']}'),
                            if (vitals['weight_kg'] != null)
                              _chip('Weight: ${vitals['weight_kg']} kg'),
                            if (vitals['pulse_bpm'] != null)
                              _chip('Pulse: ${vitals['pulse_bpm']} bpm'),
                            if (vitals['temperature_f'] != null)
                              _chip('Temp: ${vitals['temperature_f']} °F'),
                            if (vitals['spo2_percent'] != null)
                              _chip('SpO2: ${vitals['spo2_percent']}%'),
                          ],
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Symptoms
                      if (symptoms.isNotEmpty) ...[
                        const Text('REPORTED SYMPTOMS', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
                        const SizedBox(height: 6),
                        ...symptoms.map((s) {
                          final sym = s is Map ? s['symptom'] ?? '' : s.toString();
                          final dur = s is Map && s['duration'] != null ? ' (${s['duration']})' : '';
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Row(
                              children: [
                                const Icon(Icons.circle, size: 6, color: AppColors.primaryGreen),
                                const SizedBox(width: 8),
                                Text('$sym$dur', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          );
                        }),
                        const SizedBox(height: 14),
                      ],

                      // Doctor Notes
                      if (notes.isNotEmpty) ...[
                        const Text('PHYSICIAN NOTES & ADVISORY', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
                        const SizedBox(height: 6),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Text(
                            notes,
                            style: const TextStyle(fontSize: 13, color: AppColors.textMain, height: 1.4),
                          ),
                        ),
                        const SizedBox(height: 14),
                      ],

                      // Prescriptions
                      if (prescriptions.isNotEmpty) ...[
                        const Text('PRESCRIBED MEDICINES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
                        const SizedBox(height: 6),
                        ...prescriptions.map((p) {
                          final med = p['medicine'] ?? 'Medicine';
                          final strength = p['strength'] ?? '';
                          final dose = p['dose'] ?? '';
                          final freq = p['frequency'] ?? '';
                          final dur = p['duration'] ?? '';
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
                                      Text('$med ${strength.isNotEmpty ? "($strength)" : ""}', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                                      Text('$dose • $freq ${dur.isNotEmpty ? "• $dur" : ""}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                        const SizedBox(height: 14),
                      ],

                      // Follow-up
                      if (followUp != null && followUp.isNotEmpty) ...[
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.greenLight,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.greenBorder),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.calendar_today, size: 16, color: AppColors.primaryGreen),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Follow-up Recommendation: $followUp',
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primaryGreenDeep),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),
              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.print, size: 18),
                      label: const Text('Print / Save'),
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('EHR record exported')),
                        );
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Close'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _chip(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppColors.border),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
      ),
    );
  }
}


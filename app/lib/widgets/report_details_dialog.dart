import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/theme.dart';
import '../core/i18n_service.dart';
import '../core/report_printer.dart';
import '../models/patient.dart';
import '../models/doctor.dart';

class ReportDetailsDialog extends StatelessWidget {
  final Map<String, dynamic> report;
  final Patient? patient;
  final Doctor? doctor;

  const ReportDetailsDialog({
    super.key,
    required this.report,
    this.patient,
    this.doctor,
  });

  static void show(BuildContext context, Map<String, dynamic> report, {Patient? patient, Doctor? doctor}) {
    showDialog(
      context: context,
      builder: (context) => ReportDetailsDialog(report: report, patient: patient, doctor: doctor),
    );
  }

  @override
  Widget build(BuildContext context) {
    final i18n = I18nService();
    final diagnosis = report['doctor_diagnosis'] ?? 'Clinical Consultation Record';
    final doctorName = report['doctor_name'] ?? 'Dr. John Doe';
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

    final mediaWidth = MediaQuery.of(context).size.width;
    final mediaHeight = MediaQuery.of(context).size.height;

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      backgroundColor: Colors.white,
      clipBehavior: Clip.antiAlias,
      insetPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 20),
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: mediaWidth > 600 ? 540 : mediaWidth,
          maxHeight: mediaHeight * 0.88,
        ),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Header
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          diagnosis,
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primaryGreenDeep,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${i18n.t("recordedPrefix")}: $dateStr',
                          style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(height: 20),

              // Scrollable Body
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Patient and Doctor Meta Container
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              flex: 5,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    i18n.t('patientLabel').toUpperCase(),
                                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    patientName,
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.textMain),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            Container(width: 1, height: 30, color: AppColors.border, margin: const EdgeInsets.symmetric(horizontal: 8)),
                            Expanded(
                              flex: 6,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    i18n.t('doctorLabel').toUpperCase(),
                                    style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    doctorName,
                                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.primaryGreen),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const Text(
                                    'MBBS, MD',
                                    style: TextStyle(fontSize: 10, color: AppColors.textMuted),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 10),

                      // Status Badge (Guaranteed no overflow)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                        decoration: BoxDecoration(
                          color: isApproved ? AppColors.greenLight : AppColors.warningBg,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: isApproved ? AppColors.greenBorder : const Color(0xFFFDE68A)),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              isApproved ? Icons.check_circle : Icons.schedule,
                              size: 15,
                              color: isApproved ? AppColors.primaryGreen : AppColors.warningAmber,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                isApproved ? i18n.t('approvedBadge') : i18n.t('draftBadge'),
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  color: isApproved ? AppColors.primaryGreenDeep : AppColors.warningAmber,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Vitals
                      if (vitals.isNotEmpty) ...[
                        Text(
                          i18n.t('clinicalVitalsTitle').toUpperCase(),
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                        ),
                        const SizedBox(height: 6),
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            if (vitals['blood_pressure'] != null || vitals['bp'] != null)
                              _chip('BP: ${vitals['blood_pressure'] ?? vitals['bp']}'),
                            if (vitals['weight_kg'] != null || vitals['weight'] != null)
                              _chip('Wt: ${(vitals['weight_kg'] ?? vitals['weight']).toString().replaceAll('kg', '').trim()} kg'),
                            if (vitals['pulse_bpm'] != null || vitals['pulse'] != null)
                              _chip('Pulse: ${(vitals['pulse_bpm'] ?? vitals['pulse']).toString().replaceAll('bpm', '').trim()} bpm'),
                            if (vitals['temperature_f'] != null || vitals['temperature'] != null || vitals['temp'] != null)
                              _chip('Temp: ${(vitals['temperature_f'] ?? vitals['temperature'] ?? vitals['temp']).toString().replaceAll('°F', '').trim()} °F'),
                            if (vitals['spo2_percent'] != null || vitals['spo2'] != null)
                              _chip('SpO2: ${(vitals['spo2_percent'] ?? vitals['spo2']).toString().replaceAll('%', '').trim()}%'),
                          ],
                        ),
                        const SizedBox(height: 12),
                      ],

                      // Symptoms
                      if (symptoms.isNotEmpty) ...[
                        Text(
                          i18n.t('reportedSymptomsTitle').toUpperCase(),
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                        ),
                        const SizedBox(height: 6),
                        ...symptoms.map((s) {
                          final sym = s is Map ? s['symptom'] ?? '' : s.toString();
                          final dur = s is Map && s['duration'] != null ? ' (${s['duration']})' : '';
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 4),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Padding(
                                  padding: EdgeInsets.only(top: 5),
                                  child: Icon(Icons.circle, size: 5, color: AppColors.primaryGreen),
                                ),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    '$sym$dur',
                                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                        const SizedBox(height: 12),
                      ],

                      // Doctor Notes
                      if (notes.isNotEmpty) ...[
                        Text(
                          i18n.t('physicianNotesTitle').toUpperCase(),
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF8FAFC),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: Text(
                            notes,
                            style: const TextStyle(fontSize: 12, color: AppColors.textMain, height: 1.35),
                          ),
                        ),
                        const SizedBox(height: 12),
                      ],

                      // Prescriptions
                      if (prescriptions.isNotEmpty) ...[
                        Text(
                          i18n.t('prescriptionsTitle').toUpperCase(),
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                        ),
                        const SizedBox(height: 6),
                        ...prescriptions.map((p) {
                          final med = p['medicine'] ?? 'Medicine';
                          final strength = p['strength'] ?? '';
                          final dose = p['dose'] ?? '';
                          final freq = p['frequency'] ?? '';
                          final dur = p['duration'] ?? '';
                          return Container(
                            margin: const EdgeInsets.only(bottom: 6),
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.greenSubtle,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: AppColors.greenBorder),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.medication, color: AppColors.primaryGreen, size: 18),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        '$med ${strength.isNotEmpty ? "($strength)" : ""}',
                                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      Text(
                                        '$dose • $freq ${dur.isNotEmpty ? "• $dur" : ""}',
                                        style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        }),
                        const SizedBox(height: 12),
                      ],

                      // Follow-up
                      if (followUp != null && followUp.isNotEmpty) ...[
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.greenLight,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: AppColors.greenBorder),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.calendar_today, size: 15, color: AppColors.primaryGreen),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  '${i18n.t("followupPrefix")}: $followUp',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primaryGreenDeep),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
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

              const SizedBox(height: 12),
              // Action Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.print, size: 16),
                      label: Text(i18n.t('printSaveBtn'), style: const TextStyle(fontSize: 12)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                      onPressed: () async {
                        try {
                          await ReportPrinter.printReport(report, patient: patient, doctor: doctor);
                        } catch (e) {
                          if (context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text('Print error: $e')),
                            );
                          }
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                      onPressed: () => Navigator.pop(context),
                      child: Text(i18n.t('closeBtn'), style: const TextStyle(fontSize: 12)),
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
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppColors.border),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
      ),
    );
  }
}

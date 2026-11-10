import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/api_client.dart';
import '../core/theme.dart';
import '../core/language_names.dart';
import '../models/doctor.dart';
import '../models/patient.dart';
import '../widgets/report_details_dialog.dart';
import 'consultation_screen.dart';

class PatientDetailScreen extends StatefulWidget {
  final ApiClient api;
  final Doctor doctor;
  final Patient patient;

  const PatientDetailScreen({
    super.key,
    required this.api,
    required this.doctor,
    required this.patient,
  });

  @override
  State<PatientDetailScreen> createState() => _PatientDetailScreenState();
}

class _PatientDetailScreenState extends State<PatientDetailScreen> {
  List<dynamic> _reports = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    setState(() => _isLoading = true);
    try {
      final reports = await widget.api.getPatientReports(widget.patient.id);
      setState(() {
        _reports = reports;
        _isLoading = false;
      });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.patient;
    final displayName = p.name;

    return Scaffold(
      appBar: AppBar(
        title: Text(displayName),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Patient Profile Card
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
                    children: [
                      CircleAvatar(
                        backgroundColor: AppColors.greenLight,
                        radius: 26,
                        child: const Icon(Icons.person, color: AppColors.primaryGreen, size: 30),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(displayName, style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
                            Text('${p.age ?? ""} yrs • ${p.gender ?? ""} • ${p.mobileNumber}', style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.greenLight,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                'Preferred Language: ${LanguageNames.getName(p.preferredLanguage)}',
                                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.primaryGreen),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  if (p.intakeSummaryEnglish != null && p.intakeSummaryEnglish!.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.greenSubtle,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppColors.greenBorder),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Pre-Consultation Intake Briefing',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            p.intakeSummaryEnglish!,
                            style: const TextStyle(fontSize: 13, color: Color(0xFF166534), height: 1.4),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Start Consultation CTA
            ElevatedButton.icon(
              icon: const Icon(Icons.play_arrow),
              label: const Text('Start New Consultation'),
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ConsultationScreen(
                      api: widget.api,
                      doctor: widget.doctor,
                      patient: p,
                    ),
                  ),
                );
              },
            ),
            const SizedBox(height: 24),

            // Medical Reports History Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Medical History & Reports',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                ),
                Text(
                  '${_reports.length} saved',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textMuted),
                ),
              ],
            ),
            const SizedBox(height: 12),

            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(color: AppColors.primaryGreen),
                ),
              )
            else if (_reports.isEmpty)
              Container(
                padding: const EdgeInsets.all(28),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.folder_open, size: 36, color: Color(0xFFCBD5E1)),
                    SizedBox(height: 8),
                    Text(
                      'No clinical reports recorded yet for this patient.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: AppColors.textMuted, fontSize: 13),
                    ),
                  ],
                ),
              )
            else
              ..._reports.map((r) => _buildReportItem(r)),
          ],
        ),
      ),
    );
  }

  Widget _buildReportItem(dynamic reportMap) {
    final r = Map<String, dynamic>.from(reportMap);
    final diagnosis = r['doctor_diagnosis'] ?? 'Clinical Record';
    final dateStr = r['date'] != null
        ? DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.tryParse(r['date'].toString()) ?? DateTime.now())
        : '';
    final isApproved = r['status'] == 'APPROVED';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isApproved ? AppColors.greenBorder : const Color(0xFFFDE68A),
          width: 1.5,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  diagnosis,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.textMain),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isApproved ? AppColors.greenLight : AppColors.warningBg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  isApproved ? 'Approved' : 'Draft',
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: isApproved ? AppColors.primaryGreen : AppColors.warningAmber),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(dateStr, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerRight,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.description_outlined, size: 14),
              label: const Text('View Full Report', style: TextStyle(fontSize: 11)),
              style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6)),
              onPressed: () => ReportDetailsDialog.show(context, r, patient: widget.patient, doctor: widget.doctor),
            ),
          ),
        ],
      ),
    );
  }
}


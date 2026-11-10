import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/api_client.dart';
import '../core/theme.dart';
import '../core/report_printer.dart';
import '../models/doctor.dart';
import '../models/patient.dart';

class ApprovalScreen extends StatefulWidget {
  final ApiClient api;
  final Doctor doctor;
  final Patient patient;
  final String consultationId;
  final DateTime initialDate;
  final String initialNotes;

  const ApprovalScreen({
    super.key,
    required this.api,
    required this.doctor,
    required this.patient,
    required this.consultationId,
    required this.initialDate,
    required this.initialNotes,
  });

  @override
  State<ApprovalScreen> createState() => _ApprovalScreenState();
}

class _ApprovalScreenState extends State<ApprovalScreen> {
  late DateTime _followupDate;
  late TextEditingController _notesController;
  bool _isSavingFollowup = false;
  bool _followupScheduled = false;

  @override
  void initState() {
    super.initState();
    _followupDate = widget.initialDate;
    _notesController = TextEditingController(text: widget.initialNotes);
  }

  Future<void> _scheduleFollowup() async {
    setState(() => _isSavingFollowup = true);
    try {
      await widget.api.scheduleFollowup(
        consultationId: widget.consultationId,
        patientId: widget.patient.id,
        scheduledDate: DateFormat('yyyy-MM-dd').format(_followupDate),
        instructions: _notesController.text.trim(),
      );
      setState(() {
        _isSavingFollowup = false;
        _followupScheduled = true;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Follow-up scheduled successfully!')),
        );
      }
    } catch (e) {
      setState(() => _isSavingFollowup = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to schedule follow-up: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Record Approved'),
        automaticallyImplyLeading: false,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Success Card
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.greenLight,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.greenBorder, width: 2),
              ),
              child: Column(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: const BoxDecoration(
                      color: AppColors.primaryGreen,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.check, color: Colors.white, size: 32),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Clinical Record Approved',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Medical record safely archived in canonical English strictly.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, color: AppColors.primaryGreen, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Schedule Follow-up Appointment Card
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
                  const Text(
                    'Schedule Follow-up Appointment',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                  ),
                  const SizedBox(height: 12),
                  const Text('Follow-up Date *', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
                  const SizedBox(height: 4),
                  InkWell(
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _followupDate,
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 365)),
                      );
                      if (picked != null) {
                        setState(() => _followupDate = picked);
                      }
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.border),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(DateFormat('dd MMMM yyyy').format(_followupDate), style: const TextStyle(fontWeight: FontWeight.w700)),
                          const Icon(Icons.calendar_today, size: 18, color: AppColors.primaryGreen),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text('Follow-up Instructions (Appointment Only)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
                  const SizedBox(height: 4),
                  TextField(
                    controller: _notesController,
                    decoration: const InputDecoration(hintText: 'e.g. Review if fever persists after 3 days'),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton.icon(
                    icon: _isSavingFollowup
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : Icon(_followupScheduled ? Icons.done_all : Icons.calendar_month, size: 18),
                    label: Text(_followupScheduled ? 'Follow-up Scheduled' : 'Schedule Follow-up'),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      backgroundColor: _followupScheduled ? AppColors.primaryGreenDark : AppColors.primaryGreen,
                    ),
                    onPressed: _isSavingFollowup || _followupScheduled ? null : _scheduleFollowup,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Print Prescription & Clinical Record
            ElevatedButton.icon(
              icon: const Icon(Icons.print, size: 20),
              label: const Text('Print Prescription / Clinical Report'),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.all(14),
                backgroundColor: AppColors.primaryGreen,
              ),
              onPressed: () async {
                try {
                  final reports = await widget.api.getPatientReports(widget.patient.id);
                  if (reports.isNotEmpty) {
                    await ReportPrinter.printReport(
                      Map<String, dynamic>.from(reports.first),
                      patient: widget.patient,
                      doctor: widget.doctor,
                    );
                  } else {
                    // Build on-the-fly report map if needed
                    await ReportPrinter.printReport(
                      {
                        'doctor_name': widget.doctor.name,
                        'doctor_credentials': widget.doctor.credentials,
                        'patient_name': widget.patient.name,
                        'patient_age': widget.patient.age,
                        'patient_gender': widget.patient.gender,
                        'patient_phone': widget.patient.mobileNumber,
                        'chief_complaint': widget.patient.chiefComplaint,
                        'doctor_diagnosis': 'Consultation Completed',
                        'doctor_notes': widget.initialNotes,
                        'date': DateTime.now().toIso8601String(),
                      },
                      patient: widget.patient,
                      doctor: widget.doctor,
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Print error: $e')),
                    );
                  }
                }
              },
            ),
            const SizedBox(height: 12),

            // Return to Dashboard Action
            OutlinedButton.icon(
              icon: const Icon(Icons.home),
              label: const Text('Return to Dashboard'),
              style: OutlinedButton.styleFrom(padding: const EdgeInsets.all(14)),
              onPressed: () {
                Navigator.of(context).popUntil((route) => route.isFirst);
              },
            ),
          ],
        ),
      ),
    );
  }
}


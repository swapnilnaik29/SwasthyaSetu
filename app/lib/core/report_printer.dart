import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../models/patient.dart';
import '../models/doctor.dart';
import 'language_names.dart';

class ReportPrinter {
  static Future<void> printReport(
    Map<String, dynamic> report, {
    Patient? patient,
    Doctor? doctor,
  }) async {
    final doc = pw.Document();

    final diagnosis = report['doctor_diagnosis'] ?? 'Clinical Consultation Record';
    final doctorName = doctor?.name ?? report['doctor_name'] ?? 'Dr. John Doe';
    final doctorCreds = doctor?.credentials ?? report['doctor_credentials'] ?? 'MBBS, MD (General Medicine)';
    
    final patientName = patient?.name ?? report['patient_name'] ?? 'Patient';
    final patientAge = (patient?.age ?? report['patient_age'])?.toString() ?? 'N/A';
    final patientGender = (patient?.gender ?? report['patient_gender'])?.toString() ?? 'N/A';
    final patientPhone = (patient?.mobileNumber ?? report['patient_phone'])?.toString() ?? 'N/A';
    final patientLang = LanguageNames.getName(patient?.preferredLanguage ?? report['patient_language']?.toString());
    
    final chiefComplaint = (patient?.chiefComplaint ?? report['chief_complaint'])?.toString() ?? 'General Health Consultation';
    final medHistory = (patient?.pastMedicalHistory ?? report['medical_history'] ?? report['past_medical_history'])?.toString() ?? 'None reported';
    final allergies = (patient?.knownAllergies ?? report['allergies'] ?? report['known_allergies'])?.toString() ?? 'None';
    
    final notes = report['doctor_notes']?.toString() ?? '';
    final followUp = report['follow_up_recommendation']?.toString() ?? 'As advised';
    final nextVisit = report['recommended_next_visit_date']?.toString();

    final dateStr = report['date'] != null
        ? DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.tryParse(report['date'].toString()) ?? DateTime.now())
        : DateFormat('dd MMM yyyy, hh:mm a').format(DateTime.now());

    final vitals = report['vitals'] is Map ? Map<String, dynamic>.from(report['vitals']) : <String, dynamic>{};
    final prescriptions = report['prescriptions'] is List ? report['prescriptions'] as List : [];
    final symptoms = report['symptoms'] is List ? report['symptoms'] as List : [];

    doc.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(28),
        build: (pw.Context context) {
          return [
            // CLINIC & DOCTOR HEADER
            pw.Container(
              padding: const pw.EdgeInsets.only(bottom: 10),
              decoration: const pw.BoxDecoration(
                border: pw.Border(bottom: pw.BorderSide(color: PdfColors.teal, width: 2)),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text(
                        'SWASTHYASETU MEDICAL CLINIC',
                        style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold, color: PdfColors.teal900),
                      ),
                      pw.SizedBox(height: 2),
                      pw.Text(
                        'Multilingual Digital Clinical Consultation Record',
                        style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700),
                      ),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text(
                        doctorName,
                        style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: PdfColors.black),
                      ),
                      pw.Text(
                        doctorCreds,
                        style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700),
                      ),
                      pw.Text(
                        'Date: $dateStr',
                        style: const pw.TextStyle(fontSize: 8.5, color: PdfColors.grey600),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            pw.SizedBox(height: 10),

            // PATIENT DEMOGRAPHICS & CLINICAL INTAKE BOX
            pw.Container(
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                color: PdfColors.grey100,
                borderRadius: pw.BorderRadius.circular(6),
                border: pw.Border.all(color: PdfColors.grey300),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text('Patient Name: $patientName', style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold)),
                      pw.Text('Age / Gender: $patientAge yrs • $patientGender', style: const pw.TextStyle(fontSize: 10)),
                    ],
                  ),
                  pw.SizedBox(height: 4),
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text('Contact: $patientPhone', style: const pw.TextStyle(fontSize: 9.5, color: PdfColors.grey800)),
                      pw.Text('Language: $patientLang', style: pw.TextStyle(fontSize: 9.5, fontWeight: pw.FontWeight.bold, color: PdfColors.teal800)),
                    ],
                  ),
                  pw.SizedBox(height: 6),
                  pw.Divider(color: PdfColors.grey300, height: 1),
                  pw.SizedBox(height: 6),
                  pw.RichText(
                    text: pw.TextSpan(
                      text: 'Chief Complaint: ',
                      style: pw.TextStyle(fontSize: 9.5, fontWeight: pw.FontWeight.bold, color: PdfColors.black),
                      children: [
                        pw.TextSpan(text: chiefComplaint, style: pw.TextStyle(fontWeight: pw.FontWeight.normal)),
                      ],
                    ),
                  ),
                  pw.SizedBox(height: 3),
                  pw.Row(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Expanded(
                        child: pw.RichText(
                          text: pw.TextSpan(
                            text: 'Medical History: ',
                            style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold),
                            children: [
                              pw.TextSpan(text: medHistory, style: pw.TextStyle(fontWeight: pw.FontWeight.normal)),
                            ],
                          ),
                        ),
                      ),
                      pw.SizedBox(width: 10),
                      pw.Expanded(
                        child: pw.RichText(
                          text: pw.TextSpan(
                            text: 'Allergies: ',
                            style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColors.red800),
                            children: [
                              pw.TextSpan(text: allergies, style: pw.TextStyle(fontWeight: pw.FontWeight.normal, color: PdfColors.black)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            pw.SizedBox(height: 12),

            // CLINICAL DIAGNOSIS & SYMPTOMS
            pw.Container(
              width: double.infinity,
              padding: const pw.EdgeInsets.all(10),
              decoration: pw.BoxDecoration(
                color: PdfColors.teal50,
                borderRadius: pw.BorderRadius.circular(6),
                border: pw.Border.all(color: PdfColors.teal200),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'PROVISIONAL / CLINICAL DIAGNOSIS',
                    style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColors.teal900),
                  ),
                  pw.SizedBox(height: 3),
                  pw.Text(
                    diagnosis,
                    style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold, color: PdfColors.teal900),
                  ),
                  if (symptoms.isNotEmpty) ...[
                    pw.SizedBox(height: 4),
                    pw.Text(
                      'Reported Symptoms: ${symptoms.map((s) => s is Map ? (s["name"] ?? s.toString()) : s.toString()).join(", ")}',
                      style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey800),
                    ),
                  ],
                ],
              ),
            ),
            pw.SizedBox(height: 12),

            // PATIENT VITALS
            if (vitals.isNotEmpty) ...[
              pw.Text(
                'RECORDED PATIENT VITALS',
                style: pw.TextStyle(fontSize: 9.5, fontWeight: pw.FontWeight.bold, color: PdfColors.teal900),
              ),
              pw.SizedBox(height: 5),
              pw.Container(
                padding: const pw.EdgeInsets.symmetric(vertical: 8, horizontal: 10),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.grey300),
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Expanded(child: _vitalCell('Blood Pressure', (vitals['blood_pressure'] ?? vitals['bp'])?.toString() ?? 'N/A')),
                    pw.Expanded(child: _vitalCell('Heart Rate', _formatVital(vitals['pulse_bpm'] ?? vitals['pulse'] ?? vitals['heart_rate'], 'bpm'))),
                    pw.Expanded(child: _vitalCell('Oxygen (SpO2)', _formatVital(vitals['spo2_percent'] ?? vitals['spo2'], '%'))),
                    pw.Expanded(child: _vitalCell('Temperature', _formatVital(vitals['temperature_f'] ?? vitals['temperature'] ?? vitals['temp'], '°F'))),
                    pw.Expanded(child: _vitalCell('Weight', _formatVital(vitals['weight_kg'] ?? vitals['weight'] ?? vitals['wt'], 'kg'))),
                    pw.Expanded(child: _vitalCell('BMI', _formatBmi(vitals['bmi'], vitals['weight_kg'] ?? vitals['weight'], vitals['height_cm'] ?? vitals['height']))),
                  ],
                ),
              ),
              pw.SizedBox(height: 12),
            ],

            // PRESCRIPTIONS (Rx)
            pw.Text(
              'PRESCRIPTION (Rx)',
              style: pw.TextStyle(fontSize: 10.5, fontWeight: pw.FontWeight.bold, color: PdfColors.teal900),
            ),
            pw.SizedBox(height: 5),
            if (prescriptions.isEmpty)
              pw.Text('No medications prescribed during this consultation.', style: const pw.TextStyle(fontSize: 9, color: PdfColors.grey700))
            else
              pw.TableHelper.fromTextArray(
                border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
                headerStyle: pw.TextStyle(fontSize: 8, fontWeight: pw.FontWeight.bold, color: PdfColors.white),
                headerDecoration: const pw.BoxDecoration(color: PdfColors.teal),
                cellStyle: const pw.TextStyle(fontSize: 7.5),
                cellPadding: const pw.EdgeInsets.symmetric(horizontal: 5, vertical: 4),
                columnWidths: {
                  0: const pw.FixedColumnWidth(20),
                  1: const pw.FlexColumnWidth(3.0),
                  2: const pw.FlexColumnWidth(1.4),
                  3: const pw.FlexColumnWidth(1.6),
                  4: const pw.FlexColumnWidth(1.4),
                  5: const pw.FlexColumnWidth(2.6),
                },
                headers: ['#', 'Medication Name', 'Dosage', 'Frequency', 'Duration', 'Instructions'],
                data: List<List<dynamic>>.generate(prescriptions.length, (index) {
                  final p = prescriptions[index];
                  if (p is Map) {
                    return [
                      '${index + 1}',
                      p['medication'] ?? p['medicine_name'] ?? 'Medication',
                      p['dosage'] ?? '1 dose',
                      p['frequency'] ?? 'Twice daily',
                      p['duration'] ?? '5 days',
                      p['instructions'] ?? p['route'] ?? 'After food',
                    ];
                  }
                  return ['${index + 1}', p.toString(), '-', '-', '-', '-'];
                }),
              ),
            pw.SizedBox(height: 12),

            // CLINICAL ADVICE & DOCTOR NOTES
            if (notes.isNotEmpty) ...[
              pw.Text(
                'CLINICAL ADVICE & DOCTOR NOTES',
                style: pw.TextStyle(fontSize: 9.5, fontWeight: pw.FontWeight.bold, color: PdfColors.teal900),
              ),
              pw.SizedBox(height: 4),
              pw.Container(
                width: double.infinity,
                padding: const pw.EdgeInsets.all(8),
                decoration: pw.BoxDecoration(
                  color: PdfColors.grey50,
                  border: pw.Border.all(color: PdfColors.grey300),
                  borderRadius: pw.BorderRadius.circular(6),
                ),
                child: pw.Text(notes, style: const pw.TextStyle(fontSize: 8.5, height: 1.3)),
              ),
              pw.SizedBox(height: 12),
            ],

            // FOLLOW UP
            pw.Container(
              padding: const pw.EdgeInsets.symmetric(vertical: 6, horizontal: 8),
              decoration: pw.BoxDecoration(
                color: PdfColors.grey100,
                borderRadius: pw.BorderRadius.circular(4),
              ),
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('Follow-up Advice: $followUp', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold)),
                  if (nextVisit != null && nextVisit.isNotEmpty)
                    pw.Text('Next Visit: $nextVisit', style: pw.TextStyle(fontSize: 9, fontWeight: pw.FontWeight.bold, color: PdfColors.teal900)),
                ],
              ),
            ),
            pw.SizedBox(height: 24),

            // FOOTER & DOCTOR SIGNATURE
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              crossAxisAlignment: pw.CrossAxisAlignment.end,
              children: [
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Text('Generated by SwasthyaSetu Clinical Suite', style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey600)),
                    pw.Text('Canonical English health record archive', style: const pw.TextStyle(fontSize: 7, color: PdfColors.grey500)),
                  ],
                ),
                pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.center,
                  children: [
                    pw.Container(
                      width: 150,
                      decoration: const pw.BoxDecoration(
                        border: pw.Border(top: pw.BorderSide(color: PdfColors.black, width: 1)),
                      ),
                      padding: const pw.EdgeInsets.only(top: 4),
                      child: pw.Text(
                        'Authorized Doctor Signature',
                        textAlign: pw.TextAlign.center,
                        style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey700),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ];
        },
      ),
    );

    final cleanFileName = 'Consultation_Report_${patientName.replaceAll(RegExp(r'\s+'), '_')}.pdf';
    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => doc.save(),
      name: cleanFileName,
    );
  }

  static pw.Widget _vitalCell(String label, String value) {
    return pw.Column(
      children: [
        pw.Text(label, style: const pw.TextStyle(fontSize: 7.5, color: PdfColors.grey600)),
        pw.SizedBox(height: 2),
        pw.Text(value, style: pw.TextStyle(fontSize: 8.5, fontWeight: pw.FontWeight.bold, color: PdfColors.black)),
      ],
    );
  }

  static String _formatVital(dynamic val, String unit) {
    if (val == null) return 'N/A';
    final str = val.toString().trim();
    if (str.isEmpty || str == 'null') return 'N/A';
    if (str.toLowerCase().contains(unit.toLowerCase())) return str;
    return '$str $unit';
  }

  static String _formatBmi(dynamic bmiVal, dynamic wVal, dynamic hVal) {
    if (bmiVal != null && bmiVal.toString().isNotEmpty && bmiVal.toString() != 'null') {
      return bmiVal.toString();
    }
    try {
      final wMatch = RegExp(r'\d+(?:\.\d+)?').firstMatch(wVal?.toString() ?? '');
      final hMatch = RegExp(r'\d+(?:\.\d+)?').firstMatch(hVal?.toString() ?? '');
      if (wMatch != null && hMatch != null) {
        final w = double.parse(wMatch.group(0)!);
        final h = double.parse(hMatch.group(0)!) / 100.0;
        if (h > 0) {
          return (w / (h * h)).toStringAsFixed(1);
        }
      }
    } catch (_) {}
    return 'N/A';
  }
}

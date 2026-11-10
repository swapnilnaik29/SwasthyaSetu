import 'package:flutter/material.dart';
import 'core/api_client.dart';
import 'core/i18n_service.dart';
import 'core/theme.dart';
import 'models/doctor.dart';
import 'screens/dashboard_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final api = ApiClient();
  await api.init();

  Doctor doctor;
  try {
    doctor = await api.getDoctorSettings();
  } catch (e) {
    debugPrint('[SwasthyaSetu Mobile] Default doctor fallback: $e');
    doctor = Doctor(
      id: 'default_doctor',
      name: 'Dr. John Doe',
      credentials: 'MBBS, MD (General Medicine)',
      preferredLanguage: 'en-IN',
      spokenLanguages: 'en-IN,mr-IN,hi-IN',
    );
  }

  final i18n = I18nService();
  await i18n.init(api, doctor.preferredLanguage);
  await i18n.setLanguage(doctor.preferredLanguage);

  runApp(SwasthyaSetuApp(api: api, doctor: doctor));
}

class SwasthyaSetuApp extends StatefulWidget {
  final ApiClient api;
  final Doctor doctor;

  const SwasthyaSetuApp({
    super.key,
    required this.api,
    required this.doctor,
  });

  @override
  State<SwasthyaSetuApp> createState() => _SwasthyaSetuAppState();
}

class _SwasthyaSetuAppState extends State<SwasthyaSetuApp> {
  late Doctor _currentDoctor;

  @override
  void initState() {
    super.initState();
    _currentDoctor = widget.doctor;
  }

  @override
  Widget build(BuildContext context) {
    final i18n = I18nService();

    return ListenableBuilder(
      listenable: i18n,
      builder: (context, _) {
        return MaterialApp(
          title: 'SwasthyaSetu',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.lightTheme,
          home: DashboardScreen(
            api: widget.api,
            doctor: _currentDoctor,
            onDoctorUpdated: (updated) {
              setState(() => _currentDoctor = updated);
            },
          ),
        );
      },
    );
  }
}

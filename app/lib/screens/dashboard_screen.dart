import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/i18n_service.dart';
import '../core/theme.dart';
import '../models/doctor.dart';
import '../models/patient.dart';
import '../widgets/language_selector_sheet.dart';
import 'onboarding_screen.dart';
import 'patient_detail_screen.dart';
import 'consultation_screen.dart';

class DashboardScreen extends StatefulWidget {
  final ApiClient api;
  final Doctor doctor;
  final Function(Doctor) onDoctorUpdated;

  const DashboardScreen({
    super.key,
    required this.api,
    required this.doctor,
    required this.onDoctorUpdated,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<Patient> _patients = [];
  bool _isLoading = true;
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadPatients();
  }

  Future<void> _loadPatients([String query = '']) async {
    setState(() => _isLoading = true);
    try {
      final list = await widget.api.getPatients(query);
      setState(() {
        _patients = list;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load patients: $e')),
        );
      }
    }
  }

  void _openSettingsDialog() {
    final nameController = TextEditingController(text: widget.doctor.name);
    final credsController = TextEditingController(text: widget.doctor.credentials);
    final urlController = TextEditingController(text: widget.api.baseUrl);
    String selectedLang = widget.doctor.preferredLanguage;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.settings, color: AppColors.primaryGreen),
              SizedBox(width: 8),
              Text('Doctor & App Settings', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Doctor Full Name', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
                const SizedBox(height: 4),
                TextField(controller: nameController),
                const SizedBox(height: 12),
                const Text('Credentials & Specialty', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
                const SizedBox(height: 4),
                TextField(controller: credsController),
                const SizedBox(height: 12),
                const Text('Primary Language (Storage)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
                const SizedBox(height: 4),
                DropdownButtonFormField<String>(
                  initialValue: selectedLang,
                  decoration: const InputDecoration(contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10)),
                  items: const [
                    DropdownMenuItem(value: 'en-IN', child: Text('English (Indian) [en-IN]')),
                    DropdownMenuItem(value: 'mr-IN', child: Text('Marathi (मराठी) [mr-IN]')),
                    DropdownMenuItem(value: 'hi-IN', child: Text('Hindi (हिंदी) [hi-IN]')),
                  ],
                  onChanged: (val) {
                    if (val != null) setDialogState(() => selectedLang = val);
                  },
                ),
                const SizedBox(height: 12),
                const Text('Backend Server URL / LAN IP', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
                const SizedBox(height: 4),
                TextField(
                  controller: urlController,
                  decoration: const InputDecoration(hintText: 'e.g. http://192.168.1.4:8000'),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
            ),
            ElevatedButton(
              onPressed: () async {
                final newUrl = urlController.text.trim();
                if (newUrl.isNotEmpty) {
                  await widget.api.setBaseUrl(newUrl);
                }
                final updated = Doctor(
                  id: widget.doctor.id,
                  name: nameController.text.trim(),
                  credentials: credsController.text.trim(),
                  preferredLanguage: selectedLang,
                  spokenLanguages: widget.doctor.spokenLanguages,
                );
                try {
                  final saved = await widget.api.updateDoctorSettings(updated);
                  widget.onDoctorUpdated(saved);
                  if (context.mounted) Navigator.pop(context);
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Failed to save settings: $e')),
                    );
                  }
                }
              },
              child: const Text('Save Settings'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final i18n = I18nService();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(7),
              decoration: BoxDecoration(
                color: AppColors.greenLight,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.greenBorder),
              ),
              child: const Icon(Icons.favorite, color: AppColors.primaryGreen, size: 20),
            ),
            const SizedBox(width: 10),
            const Text.rich(
              TextSpan(
                text: 'Swasthya',
                style: TextStyle(fontWeight: FontWeight.w800, fontSize: 19, color: AppColors.primaryGreenDeep),
                children: [
                  TextSpan(text: 'Setu', style: TextStyle(color: AppColors.primaryGreen)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.language, color: AppColors.primaryGreen),
            tooltip: 'Switch Portal Language',
            onPressed: () => LanguageSelectorSheet.show(context),
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined, color: AppColors.textMuted),
            tooltip: 'Doctor & App Settings',
            onPressed: _openSettingsDialog,
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _loadPatients(_searchController.text),
        color: AppColors.primaryGreen,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Doctor Hero Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.border),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: const BoxDecoration(
                        color: AppColors.greenLight,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.medical_services_outlined, color: AppColors.primaryGreen, size: 26),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.doctor.name,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.textMain),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            widget.doctor.credentials,
                            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                          ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 6,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.greenLight,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: AppColors.greenBorder),
                                ),
                                child: Text(
                                  'Primary: ${widget.doctor.preferredLanguage}',
                                  style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.primaryGreenDeep),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Text(
                                  'Online • Turn-by-Turn',
                                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF475569)),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Search & Onboard Action Row
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _searchController,
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.search, color: AppColors.textMuted, size: 20),
                        hintText: i18n.t('searchPatientsPlaceholder'),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                      onChanged: (val) {
                        _loadPatients(val);
                      },
                    ),
                  ),
                  const SizedBox(width: 10),
                  ElevatedButton.icon(
                    icon: const Icon(Icons.person_add_alt_1, size: 18),
                    label: Text(i18n.t('onboardPatientBtn')),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                    ),
                    onPressed: () async {
                      final result = await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => OnboardingScreen(api: widget.api, doctor: widget.doctor),
                        ),
                      );
                      if (result == true) {
                        _loadPatients();
                      }
                    },
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Registered Patients Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    i18n.t('registeredPatientsTitle'),
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.greenLight,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${_patients.length} ${i18n.t('registeredSuffix')}',
                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.primaryGreen),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Patient Cards List
              if (_isLoading)
                const Center(
                  child: Padding(
                    padding: EdgeInsets.all(40),
                    child: CircularProgressIndicator(color: AppColors.primaryGreen),
                  ),
                )
              else if (_patients.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(32),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.people_outline, size: 44, color: Color(0xFFCBD5E1)),
                      const SizedBox(height: 12),
                      Text(
                        i18n.t('noPatientsText'),
                        textAlign: TextAlign.center,
                        style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
                      ),
                    ],
                  ),
                )
              else
                ..._patients.map((p) => _buildPatientCard(p)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPatientCard(Patient p) {
    final langColor = p.preferredLanguage.contains('hi')
        ? const Color(0xFFD97706)
        : (p.preferredLanguage.contains('mr') ? AppColors.primaryGreen : const Color(0xFF0284C7));

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => PatientDetailScreen(
                api: widget.api,
                doctor: widget.doctor,
                patient: p,
              ),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  CircleAvatar(
                    backgroundColor: AppColors.greenLight,
                    radius: 20,
                    child: const Icon(Icons.person, color: AppColors.primaryGreen, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          p.name,
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: AppColors.textMain),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${p.age != null ? "${p.age} yrs" : ""} ${p.gender ?? ""} • ${p.mobileNumber}',
                          style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: langColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: langColor.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      p.preferredLanguage,
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: langColor),
                    ),
                  ),
                ],
              ),
              if (p.chiefComplaint != null && p.chiefComplaint!.isNotEmpty) ...[
                const SizedBox(height: 10),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.greenSubtle,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.medical_information_outlined, size: 14, color: AppColors.primaryGreen),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          p.chiefComplaint!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12, color: Color(0xFF166534), fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  OutlinedButton.icon(
                    icon: const Icon(Icons.play_arrow, size: 16),
                    label: const Text('Start Consultation'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      textStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                    ),
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
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

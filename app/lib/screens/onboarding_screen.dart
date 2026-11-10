import 'package:flutter/material.dart';
import '../core/api_client.dart';
import '../core/audio_service.dart';
import '../core/theme.dart';
import '../models/doctor.dart';
import '../models/patient.dart';
import '../widgets/soundwave_visualizer.dart';
import 'consultation_screen.dart';

class OnboardingScreen extends StatefulWidget {
  final ApiClient api;
  final Doctor doctor;

  const OnboardingScreen({
    super.key,
    required this.api,
    required this.doctor,
  });

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final AudioService _audio = AudioService();
  int _currentStepStage = 0; // 0: Language Bubbles, 1: Chat, 2: Pre-Consult Summary
  String _selectedLanguage = 'hi-IN';
  int _questionIndex = 0;
  bool _isValidating = false;
  String? _validationAlert;

  final TextEditingController _textInputController = TextEditingController();

  // Intake Form Data
  final Map<String, dynamic> _formData = {
    'name': '',
    'age': null,
    'gender': '',
    'mobile_number': '',
    'preferred_language': 'hi-IN',
    'chief_complaint': '',
    'symptoms_duration': '',
    'past_medical_history': '',
    'known_allergies': '',
  };

  Patient? _createdPatient;

  final Map<String, List<Map<String, dynamic>>> _questions = {
    'hi-IN': [
      {
        'id': 'name',
        'label': 'Question 1 of 5 • Full Name',
        'text': 'नमस्ते! आपका शुभ नाम क्या है?',
        'sub': '(Hello! What is your full name?)',
      },
      {
        'id': 'age_gender',
        'label': 'Question 2 of 5 • Age & Gender',
        'text': 'आपकी उम्र कितनी है और आपका लिंग (पुरुष / महिला) क्या है?',
        'sub': '(What is your age and gender?)',
      },
      {
        'id': 'phone',
        'label': 'Question 3 of 5 • Mobile Number',
        'text': 'कृपया अपना 10 अंकों का मोबाइल फोन नंबर बताइए।',
        'sub': '(Please provide your 10-digit mobile phone number.)',
      },
      {
        'id': 'complaint',
        'label': 'Question 4 of 5 • Health Problem',
        'text': 'आपको क्या तकलीफ़ या समस्या हो रही है और यह कितने दिनों से है?',
        'sub': '(What health problem are you facing and for how many days?)',
      },
      {
        'id': 'history_allergies',
        'label': 'Question 5 of 5 • Medical History & Allergies',
        'text': 'क्या आपको पहले से बीपी, शुगर या दमा जैसी बीमारी है? और क्या किसी दवा से एलर्जी है?',
        'sub': '(Do you have conditions like BP/Diabetes, or any drug allergies?)',
      },
    ],
    'mr-IN': [
      {
        'id': 'name',
        'label': 'प्रश्न १ / ५ • पूर्ण नाव',
        'text': 'नमस्कार! आपले पूर्ण नाव काय आहे?',
        'sub': '(Hello! What is your full name?)',
      },
      {
        'id': 'age_gender',
        'label': 'प्रश्न २ / ५ • वय आणि लिंग',
        'text': 'आपले वय किती आहे आणि आपले लिंग (पुरुष / स्त्री) काय आहे?',
        'sub': '(What is your age and gender?)',
      },
      {
        'id': 'phone',
        'label': 'प्रश्न ३ / ५ • मोबाईल नंबर',
        'text': 'कृपया आपला १० अंकी मोबाईल नंबर सांगा.',
        'sub': '(Please provide your 10-digit mobile phone number.)',
      },
      {
        'id': 'complaint',
        'label': 'प्रश्न ४ / ५ • आजार आणि कालावधी',
        'text': 'आपल्याला काय त्रास किंवा आजार होत आहे आणि किती दिवसांपासून आहे?',
        'sub': '(What health problem are you facing and for how many days?)',
      },
      {
        'id': 'history_allergies',
        'label': 'प्रश्न ५ / ५ • मागील आजार आणि ॲलर्जी',
        'text': 'आपल्याला आधीपासून बीपी, शुगर, दमा असा कोणताही जुना आजार आहे का? आणि कोणत्या औषधाची ॲलर्जी आहे का?',
        'sub': '(Do you have conditions like BP/Diabetes, or any drug allergies?)',
      },
    ],
    'en-IN': [
      {
        'id': 'name',
        'label': 'Question 1 of 5 • Full Name',
        'text': 'Hello! What is your full name?',
        'sub': '(Please state your legal first and last name)',
      },
      {
        'id': 'age_gender',
        'label': 'Question 2 of 5 • Age & Gender',
        'text': 'What is your age and gender (Male / Female)?',
        'sub': '(You can mention in any sequence, e.g. 28 Female)',
      },
      {
        'id': 'phone',
        'label': 'Question 3 of 5 • Mobile Phone Number',
        'text': 'Please provide your 10-digit mobile phone number.',
        'sub': '(Speak in digits or words)',
      },
      {
        'id': 'complaint',
        'label': 'Question 4 of 5 • Primary Complaint',
        'text': 'What symptoms or health problem are you experiencing, and for how long?',
        'sub': '(Describe your primary complaint and duration)',
      },
      {
        'id': 'history_allergies',
        'label': 'Question 5 of 5 • Medical History & Allergies',
        'text': 'Do you have chronic conditions (BP, Diabetes, Asthma) or known drug allergies?',
        'sub': '(Mention any ongoing health history)',
      },
    ],
  };

  @override
  void initState() {
    super.initState();
    _audio.init();
  }

  @override
  void dispose() {
    _audio.stopAudio();
    super.dispose();
  }

  List<Map<String, dynamic>> get _currentQuestions {
    return _questions[_selectedLanguage] ?? _questions['hi-IN']!;
  }

  void _selectLanguage(String langCode) {
    setState(() {
      _selectedLanguage = langCode;
      _formData['preferred_language'] = langCode;
      _currentStepStage = 1;
      _questionIndex = 0;
    });
    _playQuestionTts();
  }

  Future<void> _playQuestionTts() async {
    final q = _currentQuestions[_questionIndex];
    try {
      final audioUrl = await widget.api.synthesizeSpeech(
        q['text'],
        _selectedLanguage,
        voiceGender: 'female',
      );
      if (audioUrl != null && mounted) {
        await _audio.playAudio(audioUrl);
      }
    } catch (_) {}
  }

  Future<void> _handleAnswer(String answerText) async {
    final clean = answerText.trim();
    if (clean.isEmpty) return;

    final q = _currentQuestions[_questionIndex];
    setState(() {
      _isValidating = true;
      _validationAlert = null;
    });

    try {
      final valRes = await widget.api.validateIntakeAnswer(
        stepId: q['id'],
        questionText: q['text'],
        userUtterance: clean,
        language: _selectedLanguage,
      );

      final isValid = valRes['is_valid'] == true;
      if (!isValid) {
        final reprompt = valRes['reprompt_native'] ?? 'कृपया विचारलेल्या प्रश्नाचे उत्तर द्या.';
        setState(() {
          _validationAlert = reprompt;
          _isValidating = false;
        });

        // Speak reprompt in female voice
        final repromptAudio = await widget.api.synthesizeSpeech(reprompt, _selectedLanguage, voiceGender: 'female');
        if (repromptAudio != null) {
          await _audio.playAudio(repromptAudio);
        }
        return;
      }

      // Valid Answer
      final extracted = valRes['extracted_value']?.toString() ?? clean;
      final parsed = valRes['parsed_fields'] is Map ? Map<String, dynamic>.from(valRes['parsed_fields']) : {};

      setState(() {
        _textInputController.clear();
        final qId = q['id'];
        if (qId == 'name') {
          _formData['name'] = parsed['name'] ?? extracted;
        } else if (qId == 'age_gender') {
          _formData['age'] = parsed['age'] ?? int.tryParse(extracted.replaceAll(RegExp(r'\D'), ''));
          _formData['gender'] = parsed['gender'] ?? (extracted.toLowerCase().contains('fem') ? 'Female' : 'Male');
        } else if (qId == 'phone') {
          _formData['mobile_number'] = parsed['mobile_number'] ?? extracted.replaceAll(RegExp(r'\D'), '');
        } else if (qId == 'complaint') {
          _formData['chief_complaint'] = parsed['chief_complaint'] ?? extracted;
          _formData['symptoms_duration'] = parsed['symptoms_duration'] ?? '';
        } else if (qId == 'history_allergies') {
          _formData['past_medical_history'] = parsed['past_medical_history'] ?? extracted;
          _formData['known_allergies'] = parsed['known_allergies'] ?? 'None';
        }

        if (_questionIndex < _currentQuestions.length - 1) {
          _questionIndex++;
          _isValidating = false;
          _playQuestionTts();
        } else {
          _isValidating = false;
          _submitForm();
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isValidating = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Validation error: $e')),
      );
    }
  }

  Future<void> _submitForm() async {
    setState(() => _isValidating = true);
    try {
      final patient = await widget.api.createPatient(_formData);
      setState(() {
        _createdPatient = patient;
        _currentStepStage = 2; // Summary Stage
        _isValidating = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isValidating = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to save patient: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Patient Onboarding'),
        actions: [
          if (_currentStepStage == 1)
            TextButton(
              onPressed: _submitForm,
              child: const Text('Finish', style: TextStyle(color: AppColors.primaryGreen, fontWeight: FontWeight.w700)),
            ),
        ],
      ),
      body: _buildCurrentStage(),
    );
  }

  Widget _buildCurrentStage() {
    if (_currentStepStage == 0) {
      return _buildLanguageBubbleStage();
    } else if (_currentStepStage == 1) {
      return _buildChatStage();
    } else {
      return _buildSummaryStage();
    }
  }

  // STAGE A: Floating Language Bubbles
  Widget _buildLanguageBubbleStage() {
    final bubbles = [
      {'code': 'hi-IN', 'name': 'हिन्दी', 'sub': 'Hindi'},
      {'code': 'mr-IN', 'name': 'मराठी', 'sub': 'Marathi'},
      {'code': 'en-IN', 'name': 'English', 'sub': 'Indian English'},
      {'code': 'gu-IN', 'name': 'ગુજરાતી', 'sub': 'Gujarati'},
      {'code': 'bn-IN', 'name': 'বাংলা', 'sub': 'Bengali'},
      {'code': 'ta-IN', 'name': 'தமிழ்', 'sub': 'Tamil'},
      {'code': 'te-IN', 'name': 'తెలుగు', 'sub': 'Telugu'},
    ];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.greenLight,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.greenBorder),
            ),
            child: const Column(
              children: [
                Icon(Icons.record_voice_over, color: AppColors.primaryGreen, size: 36),
                SizedBox(height: 8),
                Text(
                  'अपनी भाषा चुनें • Select Language • आपली भाषा निवडा',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                ),
                SizedBox(height: 4),
                Text(
                  'Conversational AI intake assistant speaks in your selected language',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: AppColors.primaryGreen),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          Wrap(
            spacing: 12,
            runSpacing: 14,
            alignment: WrapAlignment.center,
            children: bubbles.map((b) {
              return InkWell(
                borderRadius: BorderRadius.circular(20),
                onTap: () => _selectLanguage(b['code']!),
                child: Container(
                  width: 140,
                  padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.greenBorder, width: 1.5),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primaryGreen.withValues(alpha: 0.08),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Text(
                        b['name']!,
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        b['sub']!,
                        style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // STAGE B: Interactive Conversational Intake Chat + Autofilled Preview Card
  Widget _buildChatStage() {
    final q = _currentQuestions[_questionIndex];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Assistant Header Card
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.greenLight,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.greenBorder),
            ),
            child: Row(
              children: [
                const CircleAvatar(
                  backgroundColor: AppColors.primaryGreen,
                  radius: 16,
                  child: Icon(Icons.medical_services, color: Colors.white, size: 18),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Aarogya Mitra • आरोग्य मित्र',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                      ),
                      Text(
                        'Language: $_selectedLanguage • Female Voice',
                        style: const TextStyle(fontSize: 11, color: AppColors.primaryGreen),
                      ),
                    ],
                  ),
                ),
                TextButton(
                  onPressed: () => setState(() => _currentStepStage = 0),
                  child: const Text('Change Lang', style: TextStyle(fontSize: 11, color: AppColors.primaryGreen)),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Question Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
              boxShadow: [
                BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 8, offset: const Offset(0, 3)),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  q['label'] ?? '',
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primaryGreen),
                ),
                const SizedBox(height: 8),
                Text(
                  q['text'] ?? '',
                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: AppColors.textMain),
                ),
                const SizedBox(height: 4),
                Text(
                  q['sub'] ?? '',
                  style: const TextStyle(fontSize: 13, color: AppColors.textMuted),
                ),
                const SizedBox(height: 12),

                // TTS Play & Wave Visualizer
                Row(
                  children: [
                    OutlinedButton.icon(
                      icon: const Icon(Icons.volume_up, size: 16),
                      label: const Text('Listen Aloud', style: TextStyle(fontSize: 12)),
                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6)),
                      onPressed: _playQuestionTts,
                    ),
                    const SizedBox(width: 12),
                    ListenableBuilder(
                      listenable: _audio,
                      builder: (context, _) => SoundwaveVisualizer(
                        isAnimating: _audio.isRecording || _audio.isPlaying,
                        height: 24,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Validation Alert
          if (_validationAlert != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.errorBg,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFECDD3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: AppColors.errorRed, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      _validationAlert!,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.errorRed),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
          ],


          // Voice / Text Input Row
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                ListenableBuilder(
                  listenable: _audio,
                  builder: (context, _) {
                    final isRec = _audio.isRecording;
                    return InkWell(
                      onTap: () async {
                        if (isRec) {
                          final bytes = await _audio.stopRecording();
                          if (bytes != null && bytes.isNotEmpty) {
                            setState(() => _isValidating = true);
                            try {
                              final text = await widget.api.transcribeAudio(bytes, _selectedLanguage);
                              _handleAnswer(text);
                            } catch (e) {
                              setState(() => _isValidating = false);
                              if (mounted) {
                                ScaffoldMessenger.of(this.context).showSnackBar(SnackBar(content: Text('Transcription error: $e')));
                              }
                            }
                          }
                        } else {
                          await _audio.startRecording();
                        }
                      },
                      child: Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: isRec ? AppColors.errorRed : AppColors.primaryGreen,
                          shape: BoxShape.circle,
                        ),
                        child: Icon(isRec ? Icons.stop : Icons.mic, color: Colors.white, size: 22),
                      ),
                    );
                  },
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextField(
                    controller: _textInputController,
                    decoration: const InputDecoration(
                      hintText: 'Speak or type answer here...',
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                    onSubmitted: (val) => _handleAnswer(val),
                  ),
                ),
                const SizedBox(width: 8),
                if (_isValidating)
                  const SizedBox(
                    width: 28,
                    height: 28,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.primaryGreen),
                  )
                else
                  IconButton(
                    icon: const Icon(Icons.send, color: AppColors.primaryGreen),
                    onPressed: () => _handleAnswer(_textInputController.text),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Live Autofilled Form Preview Card
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
                const Row(
                  children: [
                    Icon(Icons.assignment_turned_in, color: AppColors.primaryGreen, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Live Autofilled Intake Form',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _formFieldRow('Full Name', _formData['name']),
                _formFieldRow('Age & Gender', _formData['age'] != null ? "${_formData['age']} yrs • ${_formData['gender']}" : ''),
                _formFieldRow('Mobile Number', _formData['mobile_number']),
                _formFieldRow('Chief Complaint', _formData['chief_complaint']),
                _formFieldRow('Medical History', _formData['past_medical_history']),
                _formFieldRow('Known Allergies', _formData['known_allergies']),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _formFieldRow(String label, dynamic value) {
    final valStr = value?.toString() ?? '';
    final hasVal = valStr.trim().isNotEmpty;
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.textMuted)),
          const SizedBox(height: 2),
          Text(
            hasVal ? valStr : 'Pending response...',
            style: TextStyle(
              fontSize: 13,
              fontWeight: hasVal ? FontWeight.w700 : FontWeight.w500,
              color: hasVal ? AppColors.textMain : AppColors.textMuted.withValues(alpha: 0.6),
            ),
          ),
        ],
      ),
    );
  }

  // STAGE C: Pre-Consultation Summary Card
  Widget _buildSummaryStage() {
    final p = _createdPatient!;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.greenBorder, width: 1.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: AppColors.primaryGreen,
                      radius: 24,
                      child: const Icon(Icons.person, color: Colors.white, size: 26),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(p.name, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                          Text('${p.age ?? ""} yrs • ${p.gender ?? ""} • ${p.mobileNumber}', style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
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
                        'Clinical Triage Briefing (English)',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primaryGreenDeep),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        p.intakeSummaryEnglish ?? p.chiefComplaint ?? 'Patient completed pre-consultation intake.',
                        style: const TextStyle(fontSize: 13, color: Color(0xFF166534), height: 1.4),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),
                _formFieldRow('Chief Complaint', p.chiefComplaint),
                _formFieldRow('Medical History', p.pastMedicalHistory),
                _formFieldRow('Known Allergies', p.knownAllergies),
              ],
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            icon: const Icon(Icons.play_arrow),
            label: const Text('Start Doctor Consultation'),
            style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16)),
            onPressed: () {
              Navigator.pushReplacement(
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
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Return to Dashboard'),
          ),
        ],
      ),
    );
  }
}

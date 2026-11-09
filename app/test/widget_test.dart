import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:swasthyasetu_app/main.dart';
import 'package:swasthyasetu_app/widgets/speaker_toggle.dart';
import 'package:swasthyasetu_app/widgets/transcript_tile.dart';
import 'package:swasthyasetu_app/models/doctor.dart';
import 'package:swasthyasetu_app/models/patient.dart';
import 'package:swasthyasetu_app/models/transcript.dart';
import 'package:swasthyasetu_app/services/api_service.dart';
import 'package:swasthyasetu_app/state/providers.dart';
import 'package:swasthyasetu_app/core/constants/app_constants.dart';

class FakeApiService extends ApiService {
  @override
  Future<Map<String, dynamic>> checkHealth() async => {
        'status': 'healthy',
        'server_lan_ip': '192.168.1.4',
      };

  @override
  Future<DoctorModel> getDoctorSettings() async => DoctorModel(
        id: 'doc-1',
        name: 'Dr. Priya Sharma',
        credentials: 'MBBS, MD',
        preferredLanguage: 'en-IN',
      );

  @override
  Future<List<PatientModel>> getPatients({String? query}) async => [
        PatientModel(
          id: 'pat-1',
          name: 'Ramesh Kumar',
          age: 38,
          mobileNumber: '9876543210',
          preferredLanguage: 'hi-IN',
        ),
      ];
}

void main() {
  testWidgets('SwasthyaSetuApp renders dashboard correctly', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          apiServiceProvider.overrideWithValue(FakeApiService()),
        ],
        child: const SwasthyaSetuApp(),
      ),
    );

    await tester.pumpAndSettle();

    // Verify title and dashboard components render
    expect(find.text('SwasthyaSetu'), findsOneWidget);
    expect(find.text('Registered Patients'), findsOneWidget);
    expect(find.text('Ramesh Kumar'), findsOneWidget);
    expect(find.byType(FloatingActionButton), findsOneWidget);
  });

  testWidgets('SpeakerToggle switches between Patient and Doctor', (WidgetTester tester) async {
    String currentSpeaker = AppConstants.speakerPatient;

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: StatefulBuilder(
            builder: (context, setState) {
              return SpeakerToggle(
                activeSpeaker: currentSpeaker,
                onSpeakerChanged: (speaker) {
                  setState(() {
                    currentSpeaker = speaker;
                  });
                },
              );
            },
          ),
        ),
      ),
    );

    expect(find.text('PATIENT SPEAKS'), findsOneWidget);
    expect(find.text('DOCTOR SPEAKS'), findsOneWidget);

    // Tap DOCTOR SPEAKS
    await tester.tap(find.text('DOCTOR SPEAKS'));
    await tester.pumpAndSettle();

    expect(currentSpeaker, AppConstants.speakerDoctor);
  });

  testWidgets('TranscriptTile renders translation and canonical English record', (WidgetTester tester) async {
    final testTurn = TranscriptTurnModel(
      transcriptId: 'turn-123',
      speaker: AppConstants.speakerPatient,
      sourceLanguage: 'hi-IN',
      recipientLanguage: 'en-IN',
      recognizedSourceText: 'Mujhe three days se fever hai.',
      recipientTranslation: 'I have had fever for three days.',
      canonicalEnglish: 'I have had fever for three days.',
      cacheHit: true,
      uncertaintyFlags: ['code_mixed_speech'],
    );

    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          home: Scaffold(
            body: TranscriptTile(turn: testTurn),
          ),
        ),
      ),
    );

    expect(find.text('PATIENT'), findsOneWidget);
    expect(find.text('CACHED'), findsOneWidget);
    expect(find.text('Mujhe three days se fever hai.'), findsOneWidget);
    expect(find.text('I have had fever for three days.'), findsNWidgets(2)); // in translation and canonical English
    expect(find.text('code_mixed_speech'), findsOneWidget);
  });
}

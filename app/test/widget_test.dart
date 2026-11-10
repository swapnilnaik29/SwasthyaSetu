import 'package:flutter_test/flutter_test.dart';
import 'package:app/core/api_client.dart';
import 'package:app/models/doctor.dart';
import 'package:app/main.dart';

void main() {
  testWidgets('SwasthyaSetu App smoke test', (WidgetTester tester) async {
    final api = ApiClient();
    final doctor = Doctor(
      id: 'doc_1',
      name: 'Dr. Swapnil Naik',
      credentials: 'MBBS, MD',
      preferredLanguage: 'en-IN',
      spokenLanguages: 'en-IN,mr-IN,hi-IN',
    );

    await tester.pumpWidget(SwasthyaSetuApp(api: api, doctor: doctor));
    expect(find.textContaining('Swasthya'), findsOneWidget);
  });
}

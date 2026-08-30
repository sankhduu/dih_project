import 'package:flutter_test/flutter_test.dart';
import 'package:lmo_inspector_app/main.dart';

void main() {
  testWidgets('LMO Inspector App loads home screen', (WidgetTester tester) async {
    await tester.pumpWidget(const LMOInspectorApp());
    expect(find.text('e-Māpan'), findsOneWidget);
  });
}

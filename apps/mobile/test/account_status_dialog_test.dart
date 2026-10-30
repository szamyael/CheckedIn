import 'package:checkedin_mobile/widgets/student_account_status_dialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets(
    'disabled account dialog shows status, reason, and office guidance',
    (tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) => Scaffold(
              body: TextButton(
                onPressed: () => showDialog<void>(
                  context: context,
                  builder: (_) => const StudentAccountStatusDialog(
                    status: 'disabled',
                    reason: 'Membership disabled by organization',
                  ),
                ),
                child: const Text('Show account status'),
              ),
            ),
          ),
        ),
      );
      await tester.tap(find.text('Show account status'));
      await tester.pumpAndSettle();

      expect(find.text('Account disabled'), findsOneWidget);
      expect(find.text('Membership disabled by organization'), findsOneWidget);
      expect(
        find.text(
          "If you have concerns, please visit your Department's Organization Office to address your account status.",
        ),
        findsOneWidget,
      );
    },
  );

  testWidgets(
    'registration completion dialog explains approval and continues',
    (tester) async {
      var continued = false;
      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) => Scaffold(
              body: TextButton(
                onPressed: () => showDialog<void>(
                  context: context,
                  barrierDismissible: false,
                  builder: (_) => StudentRegistrationCompleteDialog(
                    onContinue: () => continued = true,
                  ),
                ),
                child: const Text('Register'),
              ),
            ),
          ),
        ),
      );

      await tester.tap(find.text('Register'));
      await tester.pumpAndSettle();

      expect(find.text('Registration complete'), findsOneWidget);
      expect(
        find.text(
          'Your account is under review and waiting for approval. '
          'Verify your email to finish setting up your account.',
        ),
        findsOneWidget,
      );
      await tester.tap(find.text('Continue to email verification'));
      await tester.pumpAndSettle();
      expect(continued, isTrue);
      expect(find.byType(StudentRegistrationCompleteDialog), findsNothing);
    },
  );
}

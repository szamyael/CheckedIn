import 'package:checkedin_mobile/core/theme.dart';
import 'package:checkedin_mobile/screens/auth/forgot_password_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets(
    'forgot password gives the student ID camera a large portrait frame',
    (tester) async {
      tester.view.physicalSize = const Size(390, 844);
      tester.view.devicePixelRatio = 1;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      const permissions = MethodChannel(
        'flutter.baseflow.com/permissions/methods',
      );
      const camera = MethodChannel('plugins.flutter.io/camera');
      tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        permissions,
        (call) async => 1,
      );
      tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        camera,
        (call) async => <Map<String, Object>>[],
      );
      addTearDown(() {
        tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
          permissions,
          null,
        );
        tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
          camera,
          null,
        );
      });

      await tester.pumpWidget(
        MaterialApp(
          theme: AppTheme.build(AppColorTheme.navy, Brightness.light),
          home: const ForgotPasswordScreen(),
        ),
      );
      await tester.pumpAndSettle();

      final cameraFrame = find.byKey(
        const Key('forgot-password-camera-preview'),
      );
      expect(cameraFrame, findsOneWidget);
      expect(tester.getSize(cameraFrame).height, greaterThanOrEqualTo(400));
      expect(find.text('Verify your student ID'), findsOneWidget);
    },
  );
}

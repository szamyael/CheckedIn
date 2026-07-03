import 'package:go_router/go_router.dart';
import '../models/registration_draft.dart';
import '../screens/attendance/location_check_screen.dart';
import '../screens/attendance/qr_scan_screen.dart';
import '../screens/attendance/selfie_screen.dart';
import '../screens/auth/forgot_password_code_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_confirm_screen.dart';
import '../screens/auth/register_id_scan_screen.dart';
import '../screens/auth/register_password_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/shell/main_shell.dart';
import '../services/auth_service.dart';

GoRouter createRouter(AuthService auth) {
  return GoRouter(
    refreshListenable: auth,
    initialLocation: auth.isSignedIn ? '/home' : '/login',
    redirect: (context, state) {
      final loggedIn = auth.isSignedIn;
      final path = state.matchedLocation;
      final isAuthRoute = path == '/login' ||
          path == '/forgot-password' ||
          path == '/forgot-password/code' ||
          path.startsWith('/register');
      final isProtected =
          path == '/home' ||
          path.startsWith('/attendance') ||
          path == '/notifications';

      if (!loggedIn && isProtected) return '/login';
      if (loggedIn && isAuthRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      GoRoute(
        path: '/forgot-password/code',
        builder: (context, state) {
          final data = state.extra! as Map<String, dynamic>;
          return ForgotPasswordCodeScreen(
            email: data['email'] as String,
            maskedEmail: data['masked_email'] as String,
          );
        },
      ),
      GoRoute(
        path: '/register/id-scan',
        builder: (ctx, state) =>
            RegisterIdScanScreen(draft: state.extra! as RegistrationDraft),
      ),
      GoRoute(
        path: '/register/confirm',
        builder: (ctx, state) =>
            RegisterConfirmScreen(draft: state.extra! as RegistrationDraft),
      ),
      GoRoute(
        path: '/register/password',
        builder: (ctx, state) =>
            RegisterPasswordScreen(draft: state.extra! as RegistrationDraft),
      ),
      GoRoute(path: '/home', builder: (context, state) => const MainShell()),
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/attendance/scan',
        builder: (context, state) => const QrScanScreen(),
      ),
      GoRoute(
        path: '/attendance/location',
        builder: (ctx, state) =>
            LocationCheckScreen(qrToken: state.extra! as String),
      ),
      GoRoute(
        path: '/attendance/selfie',
        builder: (ctx, state) {
          final data = state.extra! as Map<String, dynamic>;
          return SelfieScreen(
            qrToken: data['qr_token'] as String,
            latitude: data['latitude'] as double,
            longitude: data['longitude'] as double,
          );
        },
      ),
    ],
  );
}

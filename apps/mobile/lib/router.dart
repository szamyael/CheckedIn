import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';
import '../models/registration_draft.dart';
import '../screens/attendance/attendance_otp_screen.dart';
import '../screens/attendance/attendance_resolve_screen.dart';
import '../screens/attendance/location_check_screen.dart';
import '../screens/attendance/qr_scan_screen.dart';
import '../screens/attendance/selfie_screen.dart';
import '../screens/events/event_detail_screen.dart';
import '../screens/events/event_feedback_screen.dart';
import '../screens/profile/edit_profile_screen.dart';
import '../services/events_service.dart';
import '../screens/auth/verify_email_screen.dart';
import '../screens/auth/forgot_password_code_screen.dart';
import '../screens/auth/forgot_password_screen.dart';
import '../screens/auth/login_screen.dart';
import '../screens/onboarding/onboarding_screen.dart';
import '../screens/onboarding/terms_screen.dart';
import '../services/onboarding_service.dart';
import '../services/terms_service.dart';
import '../screens/auth/register_confirm_screen.dart';
import '../screens/auth/register_id_scan_screen.dart';
import '../screens/auth/register_password_screen.dart';
import '../screens/notifications/notifications_screen.dart';
import '../screens/shell/main_shell.dart';
import '../services/auth_service.dart';

GoRouter createRouter(
  AuthService auth,
  OnboardingService onboarding,
  TermsService terms,
) {
  return GoRouter(
    refreshListenable: Listenable.merge([auth, onboarding, terms]),
    initialLocation: _initialLocation(auth, onboarding, terms),
    redirect: (context, state) {
      if (!onboarding.isLoaded || !terms.isLoaded) return null;

      final hasSession = auth.isSignedIn;
      final verified = auth.isEmailVerified;
      final path = state.matchedLocation;

      if (!onboarding.isComplete && path != '/onboarding') {
        return '/onboarding';
      }
      if (onboarding.isComplete && !terms.isAccepted && path != '/terms') {
        return '/terms';
      }
      if (onboarding.isComplete && path == '/onboarding') {
        return hasSession
            ? (verified ? '/home' : '/verify-email')
            : '/login';
      }
      if (terms.isAccepted && path == '/terms') {
        return hasSession
            ? (verified ? '/home' : '/verify-email')
            : '/login';
      }

      final isAuthRoute = path == '/login' ||
          path == '/onboarding' ||
          path == '/terms' ||
          path == '/forgot-password' ||
          path == '/forgot-password/code' ||
          path == '/verify-email' ||
          path.startsWith('/register');
      final isProtected =
          path == '/home' ||
          path.startsWith('/attendance') ||
          path.startsWith('/events') ||
          path == '/profile/edit' ||
          path == '/notifications';

      if (hasSession && !verified && path != '/verify-email') {
        return '/verify-email';
      }

      if (!hasSession && isProtected) return '/login';
      if (hasSession && verified && isAuthRoute) return '/home';
      if (hasSession && verified && path == '/verify-email') return '/home';
      return null;
    },
    routes: [
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: '/terms',
        builder: (context, state) => const TermsScreen(),
      ),
      GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
      GoRoute(
        path: '/verify-email',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          final email = extra?['email'] as String? ??
              AuthService.instance.currentUserEmail ??
              '';
          return VerifyEmailScreen(
            email: email,
            maskedEmail: extra?['masked_email'] as String?,
            password: extra?['password'] as String?,
          );
        },
      ),
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
        path: '/attendance/resolve',
        builder: (ctx, state) =>
            AttendanceResolveScreen(qrToken: state.extra! as String),
      ),
      GoRoute(
        path: '/attendance/location',
        builder: (ctx, state) =>
            LocationCheckScreen(qrToken: state.extra! as String),
      ),
      GoRoute(
        path: '/attendance/otp',
        builder: (ctx, state) {
          final data = state.extra! as Map<String, dynamic>;
          return AttendanceOtpScreen(
            qrToken: data['qr_token'] as String,
            latitude: data['latitude'] as double,
            longitude: data['longitude'] as double,
            requiresOtp: data['requires_otp'] as bool? ?? false,
            eventTitle: data['event_title'] as String? ?? 'Event',
            eventId: data['event_id'] as String?,
            locationVerified: data['location_verified'] as bool? ?? false,
          );
        },
      ),
      GoRoute(
        path: '/attendance/selfie',
        builder: (ctx, state) {
          final data = state.extra! as Map<String, dynamic>;
          if (data['location_verified'] != true) {
            return const QrScanScreen();
          }
          return SelfieScreen(
            qrToken: data['qr_token'] as String,
            latitude: data['latitude'] as double,
            longitude: data['longitude'] as double,
            otpCode: data['otp_code'] as String?,
            eventId: data['event_id'] as String?,
            eventTitle: data['event_title'] as String?,
          );
        },
      ),
      GoRoute(
        path: '/events/detail',
        builder: (ctx, state) =>
            EventDetailScreen(event: state.extra! as EventItem),
      ),
      GoRoute(
        path: '/events/feedback',
        builder: (ctx, state) {
          final data = state.extra! as Map<String, dynamic>;
          return EventFeedbackScreen(
            eventId: data['event_id'] as String,
            eventTitle: data['event_title'] as String,
          );
        },
      ),
      GoRoute(
        path: '/profile/edit',
        builder: (context, state) => const EditProfileScreen(),
      ),
    ],
  );
}

String _initialLocation(
  AuthService auth,
  OnboardingService onboarding,
  TermsService terms,
) {
  if (!onboarding.isComplete) return '/onboarding';
  if (!terms.isAccepted) return '/terms';
  if (auth.isSignedIn) {
    return auth.isEmailVerified ? '/home' : '/verify-email';
  }
  return '/login';
}

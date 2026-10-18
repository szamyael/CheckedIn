import 'package:flutter/material.dart';
import 'package:tabler_icons_plus/tabler_icons_plus.dart';
import 'package:go_router/go_router.dart';

import '../../services/permission_service.dart';
import '../../services/push_notification_service.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/student_ui.dart';
import 'terms_screen.dart';
import 'swipe_animated_page.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _pageController = PageController();
  int _page = 0;

  bool _cameraGranted = false;
  bool _locationGranted = false;
  bool _notificationsGranted = false;
  bool _requestingCamera = false;
  bool _requestingLocation = false;
  bool _requestingNotifications = false;
  String? _notificationPermissionError;
  bool _termsAccepted = false;
  bool _finishing = false;

  static const _pages = [
    _OnboardingPageData(
      icon: TablerIcons.school,
      title: 'Welcome to CheckedIn',
      body:
          'CheckedIn helps you register once, join campus events, and record attendance '
          'with QR codes — all from your phone.',
      bullets: [
        'View upcoming events and your attendance history',
        'Earn bingo badges when you check in',
        'Works offline after your first successful login',
      ],
    ),
    _OnboardingPageData(
      icon: TablerIcons.idBadge,
      title: 'What you need to register',
      body: 'Have these ready before you create your account:',
      bullets: [
        'Physical student ID card (for a clear photo scan)',
        'Valid Student ID number (format 0XXX-XXXX)',
        'School email address on file with your institution',
        'A secure password you will use to sign in',
      ],
    ),
    _OnboardingPageData(
      icon: TablerIcons.scan,
      title: 'How check-in works',
      body: 'At an event, attendance follows a short verified flow:',
      bullets: [
        'Scan the event QR code displayed at the venue',
        'Verify your GPS location inside the event geofence',
        'Enter the one-time code (OTP) if required',
        'Take a live selfie to confirm your presence',
      ],
    ),
  ];

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  Future<void> _refreshPermissionStates() async {
    final camera = await PermissionService.instance.isGranted(
      AppPermission.camera,
    );
    final location = await PermissionService.instance.isGranted(
      AppPermission.location,
    );
    final notifications =
        PushNotificationService.instance.hasNotificationPermission;
    if (mounted) {
      setState(() {
        _cameraGranted = camera;
        _locationGranted = location;
        _notificationsGranted = notifications;
      });
    }
  }

  Future<void> _requestPermission(AppPermission type) async {
    setState(() {
      if (type == AppPermission.camera) {
        _requestingCamera = true;
      } else {
        _requestingLocation = true;
      }
    });

    final granted = await PermissionService.instance.ensure(
      context,
      type,
      showRationaleFirst: true,
    );

    if (mounted) {
      setState(() {
        _requestingCamera = false;
        _requestingLocation = false;
        if (type == AppPermission.camera) {
          _cameraGranted = granted;
        } else {
          _locationGranted = granted;
        }
      });
    }
  }

  Future<void> _requestNotificationPermission() async {
    setState(() {
      _requestingNotifications = true;
      _notificationPermissionError = null;
    });
    try {
      final granted = await PushNotificationService.instance
          .requestPermission();
      if (mounted) setState(() => _notificationsGranted = granted);
    } catch (error) {
      if (mounted) {
        setState(
          () => _notificationPermissionError =
              'Could not request notification permission: $error',
        );
      }
    } finally {
      if (mounted) setState(() => _requestingNotifications = false);
    }
  }

  Future<void> _finish() async {
    if (!_termsAccepted || _finishing) return;
    setState(() => _finishing = true);
    await completeOnboardingWithTerms();
    if (!mounted) return;
    context.go('/login');
  }

  void _next() {
    final lastPageIndex = _pages.length + 1;
    if (_page < lastPageIndex) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOut,
      );
      return;
    }
    _finish();
  }

  @override
  Widget build(BuildContext context) {
    final totalPages = _pages.length + 2;
    final isPermissionPage = _page == _pages.length;
    final isTermsPage = _page == _pages.length + 1;

    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Row(
                children: [
                  const AppLogo(size: 28),
                  const SizedBox(width: 10),
                  Text(
                    'CHECKEDIN',
                    style: TextStyle(
                      color: StudentUi.of(context).accentText,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 1.8,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      border: Border.all(color: StudentUi.of(context).border),
                      borderRadius: BorderRadius.circular(99),
                    ),
                    child: Text(
                      '${_page + 1} / $totalPages',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(99),
                child: TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0, end: (_page + 1) / totalPages),
                  duration: const Duration(milliseconds: 260),
                  curve: Curves.easeOutCubic,
                  builder: (context, value, _) => LinearProgressIndicator(
                    value: value,
                    minHeight: 3,
                    backgroundColor: StudentUi.of(context).border,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ),
              ),
            ),
            Expanded(
              child: PageView(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() => _page = index);
                  if (index == _pages.length) _refreshPermissionStates();
                },
                children: [
                  ..._pages.asMap().entries.map(
                    (entry) => SwipeAnimatedPage(
                      controller: _pageController,
                      index: entry.key,
                      child: _WalkthroughPage(data: entry.value),
                    ),
                  ),
                  SwipeAnimatedPage(
                    controller: _pageController,
                    index: _pages.length,
                    child: _PermissionsPage(
                      cameraGranted: _cameraGranted,
                      locationGranted: _locationGranted,
                      notificationsGranted: _notificationsGranted,
                      requestingCamera: _requestingCamera,
                      requestingLocation: _requestingLocation,
                      requestingNotifications: _requestingNotifications,
                      notificationPermissionError: _notificationPermissionError,
                      onRequestCamera: () =>
                          _requestPermission(AppPermission.camera),
                      onRequestLocation: () =>
                          _requestPermission(AppPermission.location),
                      onRequestNotifications: () =>
                          _requestNotificationPermission(),
                    ),
                  ),
                  SwipeAnimatedPage(
                    controller: _pageController,
                    index: _pages.length + 1,
                    child: OnboardingTermsStep(
                      onAcceptedChanged: (value) =>
                          setState(() => _termsAccepted = value),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      totalPages,
                      (i) => AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: i == _page ? 22 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: i == _page
                              ? StudentUi.of(context).accent
                              : StudentUi.of(context).border,
                          borderRadius: BorderRadius.circular(99),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  if (!isTermsPage)
                    Padding(
                      padding: EdgeInsets.only(bottom: 12),
                      child: Text(
                        'Swipe left or use Continue',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: StudentUi.of(context).muted,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  FilledButton(
                    onPressed: isTermsPage
                        ? (_termsAccepted && !_finishing ? _finish : null)
                        : _next,
                    child: Text(
                      isTermsPage
                          ? (_finishing ? 'Saving…' : 'I accept and continue')
                          : isPermissionPage
                          ? 'Continue'
                          : _page == 0
                          ? 'Start registration'
                          : 'Continue',
                    ),
                  ),
                  if (isPermissionPage) ...[
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: _next,
                      child: const Text('Skip permissions for now'),
                    ),
                  ] else if (_page > 0 && !isTermsPage) ...[
                    const SizedBox(height: 4),
                    TextButton(
                      onPressed: () {
                        _pageController.previousPage(
                          duration: const Duration(milliseconds: 280),
                          curve: Curves.easeOut,
                        );
                      },
                      child: const Text('Back'),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardingPageData {
  final IconData icon;
  final String title;
  final String body;
  final List<String> bullets;

  const _OnboardingPageData({
    required this.icon,
    required this.title,
    required this.body,
    required this.bullets,
  });
}

class _WalkthroughPage extends StatelessWidget {
  final _OnboardingPageData data;

  const _WalkthroughPage({required this.data});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.88, end: 1),
            duration: const Duration(milliseconds: 420),
            curve: Curves.easeOutBack,
            builder: (context, value, child) =>
                Transform.scale(scale: value, child: child),
            child: Container(
              width: double.infinity,
              height: 170,
              decoration: BoxDecoration(
                color: StudentUi.of(context).neutralBackground,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: StudentUi.of(context).border),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Positioned(
                    right: -18,
                    top: -20,
                    child: Container(
                      width: 112,
                      height: 112,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: StudentUi.of(context).border,
                          width: 12,
                        ),
                      ),
                    ),
                  ),
                  Container(
                    width: 78,
                    height: 78,
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: StudentUi.of(context).border),
                    ),
                    child: Icon(
                      data.icon,
                      size: 36,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                  ),
                  Positioned(
                    bottom: 15,
                    child: Text(
                      'CHECKEDIN STUDENT PORTAL',
                      style: TextStyle(
                        color: StudentUi.of(context).muted,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            'GET STARTED',
            style: TextStyle(
              color: StudentUi.of(context).accentText,
              fontSize: 11,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.4,
            ),
          ),
          const SizedBox(height: 8),
          StudentPageTitle(title: data.title, subtitle: data.body),
          const SizedBox(height: 20),
          ...data.bullets.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: EdgeInsets.only(top: 2),
                    child: Icon(
                      TablerIcons.circleCheck,
                      size: 18,
                      color: StudentUi.of(context).accent,
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      item,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PermissionsPage extends StatelessWidget {
  final bool cameraGranted;
  final bool locationGranted;
  final bool notificationsGranted;
  final bool requestingCamera;
  final bool requestingLocation;
  final bool requestingNotifications;
  final String? notificationPermissionError;
  final VoidCallback onRequestCamera;
  final VoidCallback onRequestLocation;
  final VoidCallback onRequestNotifications;

  const _PermissionsPage({
    required this.cameraGranted,
    required this.locationGranted,
    required this.notificationsGranted,
    required this.requestingCamera,
    required this.requestingLocation,
    required this.requestingNotifications,
    required this.notificationPermissionError,
    required this.onRequestCamera,
    required this.onRequestLocation,
    required this.onRequestNotifications,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const StudentPageTitle(
            title: 'Device permissions',
            subtitle:
                'CheckedIn needs a few permissions to register you and verify attendance. '
                'You can change these anytime in your phone settings.',
          ),
          const SizedBox(height: 20),
          _PermissionCard(
            icon: TablerIcons.camera,
            title: 'Camera',
            description:
                'Scan your student ID, read event QR codes, and take attendance selfies.',
            granted: cameraGranted,
            loading: requestingCamera,
            onAllow: onRequestCamera,
          ),
          const SizedBox(height: 12),
          _PermissionCard(
            icon: TablerIcons.mapPin,
            title: 'Location',
            description:
                'Confirm you are at the event venue before check-in is accepted.',
            granted: locationGranted,
            loading: requestingLocation,
            onAllow: onRequestLocation,
          ),
          const SizedBox(height: 12),
          _PermissionCard(
            icon: TablerIcons.bell,
            title: 'Notifications',
            description:
                'Get alerts about campus events and important account updates.',
            granted: notificationsGranted,
            loading: requestingNotifications,
            onAllow: onRequestNotifications,
          ),
          if (notificationPermissionError != null) ...[
            const SizedBox(height: 12),
            StudentErrorBanner(message: notificationPermissionError!),
          ],
          const SizedBox(height: 16),
          const StudentInfoBanner(
            icon: TablerIcons.infoCircle,
            message:
                'Camera and location can be requested again when needed. Notifications can be enabled later in your phone settings.',
          ),
        ],
      ),
    );
  }
}

class _PermissionCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String description;
  final bool granted;
  final bool loading;
  final VoidCallback onAllow;

  const _PermissionCard({
    required this.icon,
    required this.title,
    required this.description,
    required this.granted,
    required this.loading,
    required this.onAllow,
  });

  @override
  Widget build(BuildContext context) {
    return StudentCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: StudentUi.of(context).accent),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ),
              if (granted)
                Icon(
                  TablerIcons.circleCheck,
                  color: StudentUi.of(context).accent,
                  size: 22,
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(description, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: granted || loading ? null : onAllow,
              child: loading
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(granted ? 'Allowed' : 'Allow'),
            ),
          ),
        ],
      ),
    );
  }
}

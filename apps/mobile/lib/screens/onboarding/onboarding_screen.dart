import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/permission_service.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/student_ui.dart';
import 'terms_screen.dart';

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
  bool _requestingCamera = false;
  bool _requestingLocation = false;
  bool _termsAccepted = false;
  bool _finishing = false;

  static const _pages = [
    _OnboardingPageData(
      icon: Icons.school_outlined,
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
      icon: Icons.badge_outlined,
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
      icon: Icons.qr_code_scanner,
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
    final camera = await PermissionService.instance.isGranted(AppPermission.camera);
    final location =
        await PermissionService.instance.isGranted(AppPermission.location);
    if (mounted) {
      setState(() {
        _cameraGranted = camera;
        _locationGranted = location;
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
                  const Spacer(),
                  Text(
                    '${_page + 1} / $totalPages',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
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
                  ..._pages.map((data) => _WalkthroughPage(data: data)),
                  _PermissionsPage(
                    cameraGranted: _cameraGranted,
                    locationGranted: _locationGranted,
                    requestingCamera: _requestingCamera,
                    requestingLocation: _requestingLocation,
                    onRequestCamera: () => _requestPermission(AppPermission.camera),
                    onRequestLocation: () =>
                        _requestPermission(AppPermission.location),
                  ),
                  OnboardingTermsStep(
                    onAcceptedChanged: (value) {
                      setState(() => _termsAccepted = value);
                    },
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
                              ? StudentUi.teal
                              : StudentUi.border,
                          borderRadius: BorderRadius.circular(99),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  FilledButton(
                    onPressed: isTermsPage
                        ? (_termsAccepted && !_finishing ? _finish : null)
                        : _next,
                    child: Text(
                      isTermsPage
                          ? (_finishing ? 'Saving…' : 'I accept and continue')
                          : isPermissionPage
                              ? 'Continue'
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
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: StudentUi.tealSoft,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: StudentUi.tealBorder),
            ),
            child: Icon(data.icon, size: 32, color: StudentUi.teal),
          ),
          const SizedBox(height: 24),
          StudentPageTitle(title: data.title, subtitle: data.body),
          const SizedBox(height: 20),
          ...data.bullets.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(top: 2),
                    child: Icon(Icons.check_circle, size: 18, color: StudentUi.teal),
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
  final bool requestingCamera;
  final bool requestingLocation;
  final VoidCallback onRequestCamera;
  final VoidCallback onRequestLocation;

  const _PermissionsPage({
    required this.cameraGranted,
    required this.locationGranted,
    required this.requestingCamera,
    required this.requestingLocation,
    required this.onRequestCamera,
    required this.onRequestLocation,
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
            icon: Icons.photo_camera_outlined,
            title: 'Camera',
            description:
                'Scan your student ID, read event QR codes, and take attendance selfies.',
            granted: cameraGranted,
            loading: requestingCamera,
            onAllow: onRequestCamera,
          ),
          const SizedBox(height: 12),
          _PermissionCard(
            icon: Icons.location_on_outlined,
            title: 'Location',
            description:
                'Confirm you are at the event venue before check-in is accepted.',
            granted: locationGranted,
            loading: requestingLocation,
            onAllow: onRequestLocation,
          ),
          const SizedBox(height: 16),
          const StudentInfoBanner(
            icon: Icons.info_outline,
            message:
                'If you tap "Don\'t allow", we will ask again when you register, scan a QR code, or check in.',
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
              Icon(icon, color: StudentUi.teal),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ),
              if (granted)
                const Icon(Icons.check_circle, color: StudentUi.teal, size: 22),
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

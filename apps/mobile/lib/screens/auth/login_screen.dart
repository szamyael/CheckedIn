import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/student_id_formatter.dart';
import '../../models/registration_draft.dart';
import '../../services/auth_service.dart';
import '../../services/offline_credential_store.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/student_ui.dart';
import '../../widgets/universal_loader.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _studentIdController = TextEditingController();
  final _passwordController = TextEditingController();
  final _auth = AuthService.instance;
  bool _loading = false;
  bool _obscurePassword = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _prefillStudentId();
  }

  Future<void> _prefillStudentId() async {
    final creds = await OfflineCredentialStore.instance.load();
    if (creds != null && mounted && _studentIdController.text.isEmpty) {
      _studentIdController.text =
          AppConstants.normalizeStudentId(creds.studentId) ?? creds.studentId;
    }
  }

  @override
  void dispose() {
    _studentIdController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    UniversalLoaderController.instance.show('Signing in…');

    try {
      final rawId = _studentIdController.text.trim();
      final normalized = AppConstants.normalizeStudentId(rawId) ?? rawId;
      await _auth.signIn(normalized, _passwordController.text);
      if (mounted) context.go('/home');
    } on EmailNotVerifiedException catch (e) {
      if (!mounted) return;
      context.push('/verify-email', extra: {
        'email': e.email,
        'password': _passwordController.text,
        'masked_email': AuthService.maskEmail(e.email),
      });
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      UniversalLoaderController.instance.hide();
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) => SingleChildScrollView(
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: Column(
                children: [
                  Container(
                    width: double.infinity,
                    color: const Color(0xFF17324D),
                    padding: const EdgeInsets.fromLTRB(24, 22, 24, 52),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const AppLogo(size: 42),
                            ),
                            const SizedBox(width: 12),
                            const Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('CheckedIn', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                                SizedBox(height: 2),
                                Text('Campus attendance platform', style: TextStyle(color: Color(0xFFD7E2EC), fontSize: 12)),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 34),
                        const Text('STUDENT PORTAL', style: TextStyle(color: Color(0xFFD7E2EC), fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
                        const SizedBox(height: 10),
                        const Text('Your campus life,\nchecked in.', style: TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w700, height: 1.08, letterSpacing: -0.6)),
                        const SizedBox(height: 12),
                        const Text('Events, attendance, and rewards—all in one place.', style: TextStyle(color: Color(0xFFD7E2EC), fontSize: 14, height: 1.5)),
                      ],
                    ),
                  ),
                  Transform.translate(
                    offset: const Offset(0, -28),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: StudentUi.border),
                          boxShadow: const [BoxShadow(color: Color(0x120C2238), blurRadius: 20, offset: Offset(0, 8))],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text('Welcome back', style: theme.textTheme.titleLarge?.copyWith(fontSize: 24, color: const Color(0xFF0C2238))),
                            const SizedBox(height: 6),
                            const Text('Sign in with your Student ID to continue.', style: TextStyle(color: Color(0xFF697178), fontSize: 14)),
                            const SizedBox(height: 24),
                            TextField(
                              controller: _studentIdController,
                              decoration: const InputDecoration(labelText: 'Student ID', hintText: '0123-4567', prefixIcon: Icon(Icons.badge_outlined)),
                              keyboardType: TextInputType.number,
                              textInputAction: TextInputAction.next,
                              inputFormatters: [StudentIdInputFormatter()],
                            ),
                            const SizedBox(height: 16),
                            TextField(
                              controller: _passwordController,
                              decoration: InputDecoration(
                                labelText: 'Password',
                                prefixIcon: const Icon(Icons.key_outlined),
                                suffixIcon: IconButton(
                                  tooltip: _obscurePassword ? 'Show password' : 'Hide password',
                                  onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                                  icon: Icon(_obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                                ),
                              ),
                              obscureText: _obscurePassword,
                              textInputAction: TextInputAction.done,
                              onSubmitted: (_) {
                                if (!_loading) _login();
                              },
                            ),
                            if (_error != null) ...[
                              const SizedBox(height: 12),
                              StudentErrorBanner(message: _error!),
                            ],
                            const SizedBox(height: 22),
                            FilledButton(
                              onPressed: _loading ? null : _login,
                              child: Text(_loading ? 'Signing in…' : 'Sign in'),
                            ),
                            const SizedBox(height: 4),
                            TextButton(onPressed: () => context.push('/forgot-password'), child: const Text('Forgot password?')),
                          ],
                        ),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
                    child: Column(
                      children: [
                        StudentInfoBanner(
                          message: 'Sign in once online to unlock offline access, cached events, and background sync on this device.',
                          icon: Icons.offline_bolt_outlined,
                          background: const Color(0xFFEEF1F0),
                          border: StudentUi.border,
                          foreground: StudentUi.muted,
                        ),
                        const SizedBox(height: 18),
                        const Text('New to CheckedIn?', style: TextStyle(color: Color(0xFF697178), fontSize: 14)),
                        const SizedBox(height: 8),
                        StudentSecondaryButton(
                          label: 'Create student account',
                          onPressed: () async {
                            await _auth.signOut();
                            if (!context.mounted) return;
                            context.push('/register/id-scan', extra: RegistrationDraft());
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

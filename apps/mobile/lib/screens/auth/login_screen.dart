import 'package:flutter/material.dart';
import 'package:tabler_icons_plus/tabler_icons_plus.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/student_id_formatter.dart';
import '../../models/registration_draft.dart';
import '../../services/auth_service.dart';
import '../../services/offline_credential_store.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/student_account_status_dialog.dart';
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
    } on StudentAccountDecisionException catch (e) {
      UniversalLoaderController.instance.hide();
      if (mounted) await _showAccountDecision(e);
    } on EmailNotVerifiedException catch (e) {
      if (!mounted) return;
      context.push(
        '/verify-email',
        extra: {
          'email': e.email,
          'password': _passwordController.text,
          'masked_email': AuthService.maskEmail(e.email),
        },
      );
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      UniversalLoaderController.instance.hide();
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _showAccountDecision(
    StudentAccountDecisionException decision,
  ) async {
    final requiresReregistration = decision.status == 'needs_reregistration';
    final router = GoRouter.of(context);
    final messenger = ScaffoldMessenger.of(context);
    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => StudentAccountStatusDialog(
        status: decision.status,
        reason: decision.reason,
        onRegisterAgain: requiresReregistration
            ? () async {
                try {
                  final draft = await _auth.loadReregistrationDraft();
                  if (!mounted || !dialogContext.mounted) return;
                  Navigator.of(dialogContext).pop();
                  router.go('/register/id-scan', extra: draft);
                } catch (error) {
                  if (!mounted || !dialogContext.mounted) return;
                  Navigator.of(dialogContext).pop();
                  messenger.showSnackBar(
                    SnackBar(
                      content: Text(
                        error.toString().replaceFirst('Exception: ', ''),
                      ),
                    ),
                  );
                }
              }
            : null,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final studentUi = StudentUi.of(context);
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
                    color: studentUi.actionBackground,
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
                                color: studentUi.actionForeground,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const AppLogo(size: 42),
                            ),
                            const SizedBox(width: 12),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'CheckedIn',
                                  style: TextStyle(
                                    color: studentUi.actionForeground,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Campus attendance platform',
                                  style: TextStyle(
                                    color: studentUi.actionForeground.withValues(
                                      alpha: 0.75,
                                    ),
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 34),
                        Text(
                          'STUDENT PORTAL',
                          style: TextStyle(
                            color: studentUi.actionForeground.withValues(
                              alpha: 0.85,
                            ),
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'Your campus life,\nchecked in.',
                          style: TextStyle(
                            color: studentUi.actionForeground,
                            fontSize: 30,
                            fontWeight: FontWeight.w700,
                            height: 1.08,
                            letterSpacing: -0.6,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Events, attendance, and rewards—all in one place.',
                          style: TextStyle(
                            color: studentUi.actionForeground.withValues(
                              alpha: 0.75,
                            ),
                            fontSize: 14,
                            height: 1.5,
                          ),
                        ),
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
                          color: theme.colorScheme.surface,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: Theme.of(context).colorScheme.outline,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: theme.colorScheme.brightness == Brightness.dark
                                  ? const Color(0x26000000)
                                  : const Color(0x102D4036),
                              blurRadius: 10,
                              offset: const Offset(0, 2),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(
                              'Welcome back',
                              style: theme.textTheme.titleLarge?.copyWith(
                                fontSize: 24,
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Sign in with your Student ID to continue.',
                              style: TextStyle(
                                color: theme.colorScheme.onSurfaceVariant,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 24),
                            TextField(
                              controller: _studentIdController,
                              decoration: const InputDecoration(
                                labelText: 'Student ID',
                                hintText: '0123-4567',
                                prefixIcon: Icon(TablerIcons.idBadge),
                              ),
                              keyboardType: TextInputType.number,
                              textInputAction: TextInputAction.next,
                              inputFormatters: [StudentIdInputFormatter()],
                            ),
                            const SizedBox(height: 16),
                            TextField(
                              controller: _passwordController,
                              decoration: InputDecoration(
                                labelText: 'Password',
                                prefixIcon: const Icon(TablerIcons.key),
                                suffixIcon: IconButton(
                                  tooltip: _obscurePassword
                                      ? 'Show password'
                                      : 'Hide password',
                                  onPressed: () => setState(
                                    () => _obscurePassword = !_obscurePassword,
                                  ),
                                  icon: Icon(
                                    _obscurePassword
                                        ? TablerIcons.eye
                                        : TablerIcons.eyeOff,
                                  ),
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
                            TextButton(
                              onPressed: () => context.push('/forgot-password'),
                              child: const Text('Forgot password?'),
                            ),
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
                          message:
                              'Sign in once online to unlock offline access, cached events, and background sync on this device.',
                          icon: TablerIcons.bolt,
                          background: Theme.of(
                            context,
                          ).colorScheme.surfaceContainerHighest,
                          border: Theme.of(context).colorScheme.outline,
                          foreground: Theme.of(
                            context,
                          ).colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(height: 18),
                        Text(
                          'New to CheckedIn?',
                          style: TextStyle(
                            color: Theme.of(
                              context,
                            ).colorScheme.onSurfaceVariant,
                            fontSize: 14,
                          ),
                        ),
                        const SizedBox(height: 8),
                        StudentSecondaryButton(
                          label: 'Create student account',
                          onPressed: () async {
                            await _auth.signOut();
                            if (!context.mounted) return;
                            context.push(
                              '/register/id-scan',
                              extra: RegistrationDraft(),
                            );
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

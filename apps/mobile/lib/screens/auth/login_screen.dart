import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/student_id_formatter.dart';
import '../../models/registration_draft.dart';
import '../../services/auth_service.dart';
import '../../services/offline_credential_store.dart';
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
  String? _error;

  @override
  void initState() {
    super.initState();
    _prefillStudentId();
  }

  Future<void> _prefillStudentId() async {
    final creds = await OfflineCredentialStore.instance.load();
    if (creds != null && mounted && _studentIdController.text.isEmpty) {
      final normalized =
          AppConstants.normalizeStudentId(creds.studentId) ?? creds.studentId;
      _studentIdController.text = normalized;
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
    return StudentAuthScaffold(
      subtitle: 'Student Attendance',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          TextField(
            controller: _studentIdController,
            decoration: const InputDecoration(
              labelText: 'Student ID',
              hintText: '0123-4567',
            ),
            keyboardType: TextInputType.number,
            inputFormatters: [StudentIdInputFormatter()],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _passwordController,
            decoration: const InputDecoration(labelText: 'Password'),
            obscureText: true,
            onSubmitted: (_) {
              if (!_loading) _login();
            },
          ),
          if (_error != null) ...[
            const SizedBox(height: 12),
            StudentErrorBanner(message: _error!),
          ],
          const SizedBox(height: 24),
          FilledButton(
            onPressed: _loading ? null : _login,
            child: Text(_loading ? 'Signing in…' : 'Sign In'),
          ),
          const SizedBox(height: 8),
          TextButton(
            onPressed: () => context.push('/forgot-password'),
            child: const Text('Forgot password?'),
          ),
          const SizedBox(height: 8),
          StudentInfoBanner(
            message:
                'Tip: Sign in once online to unlock offline login, cached events, and background sync on this device.',
            icon: Icons.offline_bolt_outlined,
            background: StudentUi.slateBg,
            border: StudentUi.border,
            foreground: StudentUi.muted,
          ),
          const SizedBox(height: 12),
          StudentSecondaryButton(
            label: 'Create Account',
            onPressed: () async {
              await _auth.signOut();
              if (!context.mounted) return;
              context.push('/register/id-scan', extra: RegistrationDraft());
            },
          ),
        ],
      ),
    );
  }
}

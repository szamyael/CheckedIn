import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../models/registration_draft.dart';
import '../../services/auth_service.dart';
import '../../services/offline_credential_store.dart';

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
      _studentIdController.text = creds.studentId;
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
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              Text(
                'CheckedIn',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'Student Attendance',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFF475569),
                    ),
              ),
              const SizedBox(height: 40),
              TextField(
                controller: _studentIdController,
                decoration: const InputDecoration(
                  labelText: 'Student ID',
                  hintText: '0123-4567',
                ),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Text(_error!, style: const TextStyle(color: Colors.red)),
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
              Text(
                'Tip: Sign in once online to unlock offline login and cached events on this device.',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF64748B),
                    ),
              ),
              const SizedBox(height: 4),
              OutlinedButton(
                onPressed: () {
                  context.push('/register/id-scan', extra: RegistrationDraft());
                },
                child: const Text('Create Account'),
              ),
              const Spacer(),
            ],
          ),
        ),
      ),
    );
  }
}

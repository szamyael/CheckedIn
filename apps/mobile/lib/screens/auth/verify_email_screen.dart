import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/auth_service.dart';

class VerifyEmailScreen extends StatefulWidget {
  final String email;
  final String? maskedEmail;
  final String? password;

  const VerifyEmailScreen({
    super.key,
    required this.email,
    this.maskedEmail,
    this.password,
  });

  @override
  State<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends State<VerifyEmailScreen> {
  final _codeController = TextEditingController();
  final _auth = AuthService.instance;

  bool _loading = false;
  bool _resending = false;
  String? _error;

  String get _displayEmail => widget.maskedEmail ?? widget.email;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _resendCode() async {
    setState(() {
      _resending = true;
      _error = null;
    });

    try {
      await _auth.resendEmailVerificationCode(widget.email);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('A new code was sent to $_displayEmail.')),
      );
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _resending = false);
    }
  }

  Future<void> _verify() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      if (_codeController.text.trim().isEmpty) {
        throw Exception('Enter the verification code from your email.');
      }

      await _auth.verifyEmailWithCode(
        email: widget.email,
        code: _codeController.text,
        password: widget.password,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Email verified successfully.')),
      );
      context.go('/home');
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verify email')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'We sent a 6-digit verification code to $_displayEmail. Enter it below to activate your account.',
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _codeController,
              decoration: const InputDecoration(
                labelText: 'Verification code',
                hintText: '6-digit code',
              ),
              keyboardType: TextInputType.number,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _verify(),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _loading ? null : _verify,
              child: Text(_loading ? 'Verifying…' : 'Verify & continue'),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: _resending || _loading ? null : _resendCode,
              child: Text(_resending ? 'Sending…' : 'Resend code'),
            ),
            const SizedBox(height: 8),
            TextButton(
              onPressed: _loading
                  ? null
                  : () {
                      context.go('/login');
                    },
              child: const Text('Back to sign in'),
            ),
          ],
        ),
      ),
    );
  }
}

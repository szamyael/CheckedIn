import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';

import '../../services/auth_service.dart';
import '../../widgets/student_ui.dart';
import '../../widgets/universal_loader.dart';

class ForgotPasswordCodeScreen extends StatefulWidget {
  final String email;
  final String maskedEmail;

  const ForgotPasswordCodeScreen({
    super.key,
    required this.email,
    required this.maskedEmail,
  });

  @override
  State<ForgotPasswordCodeScreen> createState() =>
      _ForgotPasswordCodeScreenState();
}

class _ForgotPasswordCodeScreenState extends State<ForgotPasswordCodeScreen> {
  final _codeController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _auth = AuthService.instance;

  bool _loading = false;
  bool _resending = false;
  String? _error;

  @override
  void dispose() {
    _codeController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _resendCode() async {
    setState(() {
      _resending = true;
      _error = null;
    });
    UniversalLoaderController.instance.show('Sending code…');

    try {
      await _auth.sendPasswordResetCode(widget.email);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('A new code was sent to ${widget.maskedEmail}.')),
      );
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      UniversalLoaderController.instance.hide();
      if (mounted) setState(() => _resending = false);
    }
  }

  Future<void> _reset() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    UniversalLoaderController.instance.show('Updating password…');

    try {
      if (_codeController.text.trim().isEmpty) {
        throw Exception('Enter the reset code from your email.');
      }

      if (_passwordController.text.length < 8) {
        throw Exception('Password must be at least 8 characters.');
      }

      if (_passwordController.text != _confirmController.text) {
        throw Exception('Passwords do not match.');
      }

      await _auth.completePasswordResetWithCode(
        email: widget.email,
        code: _codeController.text,
        newPassword: _passwordController.text,
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password updated. You can sign in now.')),
      );
      context.go('/login');
    } catch (e) {
      setState(() => _error = e.toString().replaceFirst('Exception: ', ''));
    } finally {
      UniversalLoaderController.instance.hide();
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Enter reset code')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            StudentPageTitle(
              title: 'Enter reset code',
              subtitle:
                  'We sent a reset code to ${widget.maskedEmail}. Enter it below with your new password.',
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _codeController,
              decoration: const InputDecoration(
                labelText: 'Reset code',
                hintText: '8-digit code',
              ),
              keyboardType: TextInputType.number,
              inputFormatters: [
                FilteringTextInputFormatter.digitsOnly,
                LengthLimitingTextInputFormatter(AppConstants.emailOtpLength),
              ],
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(
                labelText: 'New password',
                hintText: 'At least 8 characters',
              ),
              obscureText: true,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _confirmController,
              decoration: const InputDecoration(
                labelText: 'Confirm password',
                hintText: 'Re-enter your password',
              ),
              obscureText: true,
              textInputAction: TextInputAction.done,
              onSubmitted: (_) => _reset(),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              StudentErrorBanner(message: _error!),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _loading ? null : _reset,
              child: Text(_loading ? 'Updating…' : 'Update password'),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: _resending || _loading ? null : _resendCode,
              child: Text(_resending ? 'Sending…' : 'Resend code'),
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../models/registration_draft.dart';
import '../../services/auth_service.dart';
import '../../widgets/student_account_status_dialog.dart';
import '../../widgets/student_ui.dart';
import '../../widgets/universal_loader.dart';
import '../../widgets/password_requirements.dart';

class RegisterPasswordScreen extends StatefulWidget {
  final RegistrationDraft draft;

  const RegisterPasswordScreen({super.key, required this.draft});

  @override
  State<RegisterPasswordScreen> createState() => _RegisterPasswordScreenState();
}

class _RegisterPasswordScreenState extends State<RegisterPasswordScreen> {
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _auth = AuthService.instance;
  bool _loading = false;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  bool _passwordMeetsRequirements(String value) {
    return RegExp(r'[^A-Za-z0-9]').hasMatch(value) &&
        RegExp(r'\d').allMatches(value).length >= 2 &&
        RegExp(r'[A-Z]').hasMatch(value) &&
        value.length >= 8;
  }

  Future<void> _register() async {
    if (!widget.draft.isResubmission &&
        !_passwordMeetsRequirements(_passwordController.text)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Password must be at least 8 characters.'),
        ),
      );
      return;
    }

    if (!widget.draft.isResubmission &&
        _passwordController.text != _confirmController.text) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Passwords do not match.')));
      return;
    }

    final idPath = widget.draft.idCardImagePath;
    if (idPath == null || idPath.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'ID card photo missing. Restart registration and scan again.',
          ),
        ),
      );
      return;
    }

    setState(() => _loading = true);
    UniversalLoaderController.instance.show(
      widget.draft.isResubmission
          ? 'Submitting registration…'
          : 'Creating account…',
    );

    try {
      final idFile = File(idPath);
      if (!await idFile.exists()) {
        throw Exception(
          'ID card photo missing. Restart registration and scan again.',
        );
      }

      await _auth.registerStudent(
        draft: widget.draft,
        password: _passwordController.text,
        idCardImage: idFile,
      );

      final email = widget.draft.email!.trim().toLowerCase();
      await _auth.signOut();

      if (!mounted) return;
      if (widget.draft.isResubmission) {
        context.go('/login');
        return;
      }
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (_) => StudentRegistrationCompleteDialog(
          onContinue: () => context.go(
            '/verify-email',
            extra: {
              'email': email,
              'password': _passwordController.text,
              'masked_email': AuthService.maskEmail(email),
            },
          ),
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString().replaceFirst('Exception: ', ''))),
      );
    } finally {
      UniversalLoaderController.instance.hide();
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Password')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            StudentPageTitle(
              title: widget.draft.isResubmission
                  ? 'Submit registration again'
                  : 'Create password',
              subtitle: widget.draft.isResubmission
                  ? 'Your existing account and password will be kept. Re-submit the corrected details for Student ID ${widget.draft.studentId}.'
                  : 'Set a password for Student ID ${widget.draft.studentId}. You will use this to sign in.',
            ),
            const SizedBox(height: 24),
            if (!widget.draft.isResubmission) ...[
              TextField(
                controller: _passwordController,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
              ),
              PasswordRequirements(value: _passwordController.text),
              const SizedBox(height: 16),
              TextField(
                controller: _confirmController,
                decoration: const InputDecoration(
                  labelText: 'Confirm Password',
                ),
                obscureText: true,
              ),
            ],
            const Spacer(),
            FilledButton(
              onPressed: _loading ? null : _register,
              child: Text(
                _loading
                    ? widget.draft.isResubmission
                          ? 'Submitting…'
                          : 'Creating account…'
                    : widget.draft.isResubmission
                    ? 'Submit registration again'
                    : 'Create account',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../models/registration_draft.dart';
import '../../core/ocr_matching.dart';
import '../../services/auth_service.dart';

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

  Future<void> _register() async {
    if (_passwordController.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password must be at least 8 characters.')),
      );
      return;
    }

    if (_passwordController.text != _confirmController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passwords do not match.')),
      );
      return;
    }

    setState(() => _loading = true);

    try {
      final idFile = File(widget.draft.idCardImagePath!);

      // Verify the card still shows the same student ID.
      final idCheck = await _auth.scanStudentId(idFile);
      if (!OcrMatching.studentIdMatches(idCheck.studentId, widget.draft.studentId)) {
        throw Exception(
          'Student ID on the card does not match. Please restart registration and scan again.',
        );
      }

      // Compare user entries to the original OCR snapshot (not a second full parse).
      final snapshot = widget.draft.ocrSnapshot;
      if (snapshot != null && !_auth.fieldsMatchOcr(snapshot, widget.draft)) {
        throw Exception(
          'Student ID on the card does not match. Please restart registration and scan again.',
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
      context.go('/verify-email', extra: {
        'email': email,
        'password': _passwordController.text,
        'masked_email': AuthService.maskEmail(email),
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString().replaceFirst('Exception: ', '')),
        ),
      );
    } finally {
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
            Text(
              'Set a password for Student ID ${widget.draft.studentId}. You will use this to sign in.',
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _confirmController,
              decoration: const InputDecoration(labelText: 'Confirm Password'),
              obscureText: true,
            ),
            const Spacer(),
            FilledButton(
              onPressed: _loading ? null : _register,
              child: Text(_loading ? 'Creating account…' : 'Complete Registration'),
            ),
          ],
        ),
      ),
    );
  }
}

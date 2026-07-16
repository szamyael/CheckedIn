import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/student_id_formatter.dart';
import '../../services/auth_service.dart';
import '../../widgets/universal_loader.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _studentIdController = TextEditingController();
  final _auth = AuthService.instance;

  CameraController? _controller;
  File? _idCardImage;
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    final cameras = await availableCameras();
    final back = cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.back,
      orElse: () => cameras.first,
    );
    _controller = CameraController(back, ResolutionPreset.high);
    await _controller!.initialize();
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _studentIdController.dispose();
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _captureId() async {
    if (_controller == null || !_controller!.value.isInitialized) return;
    final file = await _controller!.takePicture();
    setState(() => _idCardImage = File(file.path));
  }

  Future<void> _sendCode() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    UniversalLoaderController.instance.show('Verifying ID…');

    try {
      if (_idCardImage == null) {
        throw Exception('Capture your student ID card first.');
      }

      final rawId = _studentIdController.text.trim();
      final normalized = AppConstants.normalizeStudentId(rawId) ?? rawId;

      final result = await _auth.verifyIdForPasswordReset(
        studentId: normalized,
        idCardImage: _idCardImage!,
      );

      await _auth.sendPasswordResetCode(result.email);

      if (!mounted) return;
      context.push(
        '/forgot-password/code',
        extra: {
          'email': result.email,
          'masked_email': result.maskedEmail,
        },
      );
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
      appBar: AppBar(title: const Text('Reset password')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Scan your student ID to verify your identity. We will send a reset code to the email on your account.',
            ),
            const SizedBox(height: 16),
            if (_controller != null && _controller!.value.isInitialized)
              AspectRatio(
                aspectRatio: _controller!.value.aspectRatio,
                child: _idCardImage != null
                    ? Image.file(_idCardImage!, fit: BoxFit.cover)
                    : CameraPreview(_controller!),
              )
            else
              const SizedBox(
                height: 200,
                child: Center(child: CircularProgressIndicator()),
              ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _loading ? null : _captureId,
              child: Text(_idCardImage == null ? 'Capture ID card' : 'Retake photo'),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _studentIdController,
              decoration: const InputDecoration(
                labelText: 'Student ID',
                hintText: '0123-4567',
              ),
              keyboardType: TextInputType.number,
              inputFormatters: [StudentIdInputFormatter()],
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 24),
            FilledButton(
              onPressed: _loading ? null : _sendCode,
              child: Text(_loading ? 'Verifying…' : 'Send reset code'),
            ),
          ],
        ),
      ),
    );
  }
}

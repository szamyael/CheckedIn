import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/student_id_formatter.dart';
import '../../services/auth_service.dart';
import '../../services/permission_service.dart';
import '../../widgets/permission_gate.dart';
import '../../widgets/student_ui.dart';
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
  bool _cameraReady = false;
  bool _cameraBlocked = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _ensureCamera());
  }

  Future<void> _ensureCamera() async {
    final granted = await PermissionService.instance.ensure(
      context,
      AppPermission.camera,
    );
    if (!mounted) return;
    if (!granted) {
      setState(() => _cameraBlocked = true);
      return;
    }
    await _initCamera();
  }

  Future<void> _initCamera() async {
    try {
      final cameras = await availableCameras();
      final back = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.back,
        orElse: () => cameras.first,
      );
      _controller = CameraController(back, ResolutionPreset.high);
      await _controller!.initialize();
      if (mounted) {
        setState(() {
          _cameraReady = true;
          _cameraBlocked = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _cameraBlocked = true;
          _error = 'Could not open camera. Allow camera access and try again.';
        });
      }
    }
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
        extra: {'email': result.email, 'masked_email': result.maskedEmail},
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
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 7,
                ),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.lock_outline,
                      size: 15,
                      color: Theme.of(context).colorScheme.onPrimaryContainer,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      'ACCOUNT RECOVERY',
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: Theme.of(context).colorScheme.onPrimaryContainer,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 0.8,
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Verify your student ID',
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(
              'Take a clear photo of your ID so we can verify your account and send a reset code to your email.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Theme.of(context).colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 20),
            AspectRatio(
              key: const Key('forgot-password-camera-preview'),
              aspectRatio: 3 / 4,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(24),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    const ColoredBox(color: Color(0xFF14283E)),
                    if (_cameraReady && _controller != null)
                      _idCardImage != null
                          ? Image.file(_idCardImage!, fit: BoxFit.contain)
                          : _buildCameraPreview()
                    else if (_cameraBlocked)
                      PermissionBlockedPanel(
                        permission: AppPermission.camera,
                        onRetry: () {
                          setState(() {
                            _cameraBlocked = false;
                            _error = null;
                          });
                          _ensureCamera();
                        },
                      )
                    else
                      const Center(
                        child: CircularProgressIndicator(color: Colors.white),
                      ),
                    if (_cameraReady && _idCardImage == null) ...[
                      Positioned(
                        top: 16,
                        left: 16,
                        child: _cameraBadge(
                          icon: Icons.credit_card,
                          label: 'STUDENT ID · FRONT',
                        ),
                      ),
                      IgnorePointer(
                        child: Center(
                          child: FractionallySizedBox(
                            widthFactor: 0.84,
                            child: AspectRatio(
                              aspectRatio: 1.58,
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.9),
                                    width: 2,
                                  ),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        left: 0,
                        right: 0,
                        bottom: 0,
                        child: Container(
                          padding: const EdgeInsets.fromLTRB(18, 28, 18, 18),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.transparent,
                                Colors.black.withValues(alpha: 0.72),
                              ],
                            ),
                          ),
                          child: const Row(
                            children: [
                              Icon(
                                Icons.center_focus_strong,
                                color: Colors.white,
                                size: 20,
                              ),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Fit the front of your ID inside the frame',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                    if (_idCardImage != null)
                      Positioned(
                        top: 16,
                        left: 16,
                        child: _cameraBadge(
                          icon: Icons.check_circle_outline,
                          label: 'ID PHOTO READY',
                        ),
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _loading ? null : _captureId,
              icon: Icon(
                _idCardImage == null
                    ? Icons.camera_alt_outlined
                    : Icons.refresh,
              ),
              label: Text(
                _idCardImage == null ? 'Capture ID photo' : 'Retake photo',
              ),
            ),
            const SizedBox(height: 20),
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
              StudentErrorBanner(message: _error!),
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

  Widget _buildCameraPreview() {
    final controller = _controller!;
    final previewSize = controller.value.previewSize;
    if (previewSize == null) return CameraPreview(controller);

    return OverflowBox(
      alignment: Alignment.center,
      child: FittedBox(
        fit: BoxFit.cover,
        child: SizedBox(
          width: previewSize.height,
          height: previewSize.width,
          child: CameraPreview(controller),
        ),
      ),
    );
  }

  Widget _cameraBadge({required IconData icon, required String label}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.62),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 15),
          const SizedBox(width: 6),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 10,
              fontWeight: FontWeight.w700,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

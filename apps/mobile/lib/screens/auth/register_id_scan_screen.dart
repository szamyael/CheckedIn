import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../core/id_face_cropper.dart';
import '../../models/registration_draft.dart';
import '../../services/auth_service.dart';
import '../../services/permission_service.dart';
import '../../widgets/permission_gate.dart';
import '../../widgets/student_ui.dart';
import '../../widgets/universal_loader.dart';

class RegisterIdScanScreen extends StatefulWidget {
  final RegistrationDraft draft;

  const RegisterIdScanScreen({super.key, required this.draft});

  @override
  State<RegisterIdScanScreen> createState() => _RegisterIdScanScreenState();
}

class _RegisterIdScanScreenState extends State<RegisterIdScanScreen> {
  CameraController? _controller;
  bool _processing = false;
  bool _cameraReady = false;
  bool _cameraBlocked = false;
  String? _error;
  final _auth = AuthService.instance;

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
      _controller = CameraController(
        back,
        ResolutionPreset.high,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );
      await _controller!.initialize();
      await _controller!.lockCaptureOrientation(DeviceOrientation.portraitUp);
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
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _captureAndScan() async {
    if (_controller == null || !_controller!.value.isInitialized) return;

    setState(() {
      _processing = true;
      _error = null;
    });
    UniversalLoaderController.instance.show('Scanning ID…');

    try {
      final photo = await _controller!.takePicture();
      final file = File(photo.path);
      final parsed = await _auth.scanStudentId(file);

      if (parsed.studentId == null ||
          !AppConstants.isValidStudentId(parsed.studentId!)) {
        throw Exception(
          'Could not read a valid Student ID (0XXX-XXXX). Retake the photo.',
        );
      }

      final avatarFile = await IdFaceCropper.cropToTempFile(file);

      widget.draft
        ..studentId = parsed.studentId
        ..firstName = parsed.firstName
        ..middleName = parsed.middleName
        ..lastName = parsed.lastName
        ..nameExtension = parsed.nameExtension
        ..program = parsed.program
        ..ocrSnapshot = parsed
        ..idCardImagePath = photo.path
        ..avatarImagePath = avatarFile?.path
        ..avatarFromId = avatarFile != null;

      if (!mounted) return;
      context.push('/register/confirm', extra: widget.draft);
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      UniversalLoaderController.instance.hide();
      if (mounted) setState(() => _processing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan Student ID')),
      body: Column(
        children: [
          Expanded(
            child: Center(
              child: _cameraReady && _controller != null
                  ? Stack(
                      alignment: Alignment.center,
                      children: [
                        AspectRatio(
                          aspectRatio: 3 / 4,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: _buildPortraitPreview(),
                          ),
                        ),
                        Positioned.fill(
                          child: IgnorePointer(
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: Colors.white.withValues(alpha: 0.85),
                                    width: 2,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    )
                  : _cameraBlocked
                      ? PermissionBlockedPanel(
                          permission: AppPermission.camera,
                          onRetry: () {
                            setState(() {
                              _cameraBlocked = false;
                              _error = null;
                            });
                            _ensureCamera();
                          },
                        )
                      : const CircularProgressIndicator(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Hold your phone upright. Fit the ID in the frame with your name '
                  'above the yellow course/program line.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 8),
                  StudentErrorBanner(message: _error!),
                ],
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _processing ? null : _captureAndScan,
                  child: Text(_processing ? 'Processing…' : 'Capture ID'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPortraitPreview() {
    final controller = _controller!;
    final previewSize = controller.value.previewSize;
    if (previewSize == null) {
      return CameraPreview(controller);
    }

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
}

import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants.dart';
import '../../models/registration_draft.dart';
import '../../services/auth_service.dart';
import '../../services/permission_service.dart';
import '../../widgets/permission_gate.dart';
import '../../widgets/student_ui.dart';

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
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _captureAndScan() async {
    if (_controller == null || !_controller!.value.isInitialized) return;

    setState(() {
      _processing = true;
      _error = null;
    });

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

      widget.draft
        ..studentId = parsed.studentId
        ..firstName = parsed.firstName
        ..middleName = parsed.middleName
        ..lastName = parsed.lastName
        ..nameExtension = parsed.nameExtension
        ..program = parsed.program
        ..ocrSnapshot = parsed
        ..idCardImagePath = photo.path;

      if (!mounted) return;
      context.push('/register/confirm', extra: widget.draft);
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
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
            child: _cameraReady && _controller != null
                ? CameraPreview(_controller!)
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
                    : const Center(child: CircularProgressIndicator()),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Position your student ID in the frame. Veryfi will extract your ID number, name, and program.',
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
}

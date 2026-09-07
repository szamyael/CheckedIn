import 'dart:async';
import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/attendance_service.dart';
import '../../services/offline_sync_service.dart';
import '../../models/pending_check_in.dart';
import '../../services/permission_service.dart';
import '../../services/screenshot_guard_service.dart';
import '../../widgets/permission_gate.dart';
import '../../widgets/student_ui.dart';
import '../../widgets/universal_loader.dart';

class SelfieScreen extends StatefulWidget {
  final String qrToken;
  final double latitude;
  final double longitude;
  final String? otpCode;
  final String? eventId;
  final String? eventTitle;
  final bool requiresOtp;
  final bool offlineSubmission;
  final DateTime? scannedAt;
  final OfflineAttendanceAction offlineAction;

  const SelfieScreen({
    super.key,
    required this.qrToken,
    required this.latitude,
    required this.longitude,
    this.otpCode,
    this.eventId,
    this.eventTitle,
    this.requiresOtp = false,
    this.offlineSubmission = false,
    this.scannedAt,
    this.offlineAction = OfflineAttendanceAction.checkIn,
  });

  @override
  State<SelfieScreen> createState() => _SelfieScreenState();
}

class _SelfieScreenState extends State<SelfieScreen> {
  CameraController? _controller;
  final _attendance = AttendanceService();
  bool _submitting = false;
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
      if (cameras.isEmpty) {
        if (mounted) {
          setState(() => _error = 'No camera found on this device.');
        }
        return;
      }
      final front = cameras.firstWhere(
        (c) => c.lensDirection == CameraLensDirection.front,
        orElse: () => cameras.first,
      );
      _controller = CameraController(
        front,
        ResolutionPreset.medium,
        enableAudio: false,
        imageFormatGroup: ImageFormatGroup.jpeg,
      );
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
          _error =
              'Could not open camera. Grant camera permission and try again.';
        });
      }
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _captureAndSubmit() async {
    if (_controller == null || !_controller!.value.isInitialized) return;

    final guardError = ScreenshotGuardService.instance.validateBeforeCapture();
    if (guardError != null) {
      setState(() => _error = guardError);
      return;
    }

    setState(() {
      _submitting = true;
      _error = null;
    });
    UniversalLoaderController.instance.show(
      widget.offlineSubmission ? 'Saving offline attendance…' : 'Submitting check-in…',
    );

    try {
      final photo = await _controller!.takePicture();
      final selfieFile = File(photo.path);

      final submission = widget.offlineSubmission
          ? await _attendance.captureOfflineAttendance(
              qrToken: widget.qrToken,
              action: widget.offlineAction,
              selfieFile: selfieFile,
              capturedAt: widget.scannedAt ?? DateTime.now().toUtc(),
              otpCode: widget.otpCode ?? '',
              eventId: widget.eventId,
              eventTitleHint: widget.eventTitle,
            )
          : await _submitOnlineOrFallback(selfieFile);

      if (!mounted) return;

      // The native screen-capture plugin can take an unbounded amount of time
      // to release on some devices. Attendance has already been recorded at
      // this point, so never hold the success UI hostage to that cleanup.
      _finishProtectedSession();
      UniversalLoaderController.instance.hide();
      setState(() => _submitting = false);

      if (submission.outcome == CheckInOutcome.queuedOffline) {
        unawaited(OfflineSyncService.instance.refresh());
        if (!mounted) return;
        _showPendingDialog();
        return;
      }

      final result = submission.serverResult!;
      final eventTitle =
          (result['event'] as Map?)?['title'] ?? 'Event';
      final eventId = (result['event'] as Map?)?['id'] as String?;
      final badges = result['badges'] as List? ?? [];
      final points = result['points_awarded'];
      _showSuccessDialog(eventTitle as String, badges, eventId, points);
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      UniversalLoaderController.instance.hide();
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _finishProtectedSession() {
    unawaited(
      ScreenshotGuardService.instance.endProtectedSession().catchError((_) {}),
    );
  }

  void _showPendingDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Saved — pending sync'),
        content: const Text(
          'Your offline attendance and live selfie are saved on this device. When you reconnect and sign in online, they are uploaded for staff approval. Location is not collected for offline attendance.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.go('/home');
            },
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  void _showSuccessDialog(
    String eventTitle,
    List badges,
    String? eventId,
    dynamic points,
  ) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Checked In!'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('You are marked present for $eventTitle.'),
            if (points != null) ...[
              const SizedBox(height: 8),
              Text('+$points reward points earned'),
            ],
            if (badges.isNotEmpty) ...[
              const SizedBox(height: 12),
              const Text(
                'New badges earned:',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              ...badges.map((b) {
                final map = Map<String, dynamic>.from(b as Map);
                return Text('• ${map['name']}');
              }),
            ],
          ],
        ),
        actions: [
          if (eventId != null)
            TextButton(
              onPressed: () {
                Navigator.of(ctx).pop();
                context.push('/events/feedback', extra: {
                  'event_id': eventId,
                  'event_title': eventTitle,
                });
              },
              child: const Text('Leave feedback'),
            ),
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              context.go('/home');
            },
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Take Selfie')),
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
                  widget.offlineSubmission
                      ? 'Step 2 of 2 — Live selfie. This offline attendance will be reviewed by staff using the scan time and selfie.'
                      : 'Step 3 of 3 — Live selfie. Screenshots and screen recording are blocked during check-in.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 8),
                  StudentErrorBanner(message: _error!),
                ],
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _submitting ? null : _captureAndSubmit,
                  child: Text(_submitting
                      ? 'Saving…'
                      : widget.offlineSubmission
                          ? 'Capture & save for review'
                          : 'Capture & Check In'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<CheckInSubmission> _submitOnlineOrFallback(File selfieFile) async {
    // Fresh GPS is used only for an online attendance flow. If connectivity
    // drops later, the queued record is submitted for manual offline review.
    if (!await _attendance.hasConnectivity()) {
      if ((widget.otpCode ?? '').trim().isEmpty) {
        throw Exception(
          'Internet was lost before submission. Scan the QR again in offline mode and enter the event OTP to save attendance for review.',
        );
      }
      return _attendance.captureOfflineAttendance(
        qrToken: widget.qrToken,
        action: OfflineAttendanceAction.checkIn,
        selfieFile: selfieFile,
        capturedAt: widget.scannedAt ?? DateTime.now().toUtc(),
        otpCode: widget.otpCode!,
        eventId: widget.eventId,
        eventTitleHint: widget.eventTitle,
      );
    }
    final position = await _attendance.getCurrentPosition();
    return _attendance.submitCheckIn(
      qrToken: widget.qrToken,
      latitude: position.latitude,
      longitude: position.longitude,
      selfieFile: selfieFile,
      otpCode: widget.otpCode,
      eventId: widget.eventId,
      eventTitleHint: widget.eventTitle,
      capturedAt: widget.scannedAt,
    );
  }
}

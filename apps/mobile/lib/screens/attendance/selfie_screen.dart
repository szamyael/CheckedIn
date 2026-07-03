import 'dart:io';

import 'package:camera/camera.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/attendance_service.dart';
import '../../services/offline_sync_service.dart';

class SelfieScreen extends StatefulWidget {
  final String qrToken;
  final double latitude;
  final double longitude;

  const SelfieScreen({
    super.key,
    required this.qrToken,
    required this.latitude,
    required this.longitude,
  });

  @override
  State<SelfieScreen> createState() => _SelfieScreenState();
}

class _SelfieScreenState extends State<SelfieScreen> {
  CameraController? _controller;
  final _attendance = AttendanceService();
  bool _submitting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _initCamera();
  }

  Future<void> _initCamera() async {
    final cameras = await availableCameras();
    final front = cameras.firstWhere(
      (c) => c.lensDirection == CameraLensDirection.front,
      orElse: () => cameras.first,
    );
    _controller = CameraController(front, ResolutionPreset.medium);
    await _controller!.initialize();
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  Future<void> _captureAndSubmit() async {
    if (_controller == null || !_controller!.value.isInitialized) return;

    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      final photo = await _controller!.takePicture();
      final selfieFile = File(photo.path);

      final submission = await _attendance.submitCheckIn(
        qrToken: widget.qrToken,
        latitude: widget.latitude,
        longitude: widget.longitude,
        selfieFile: selfieFile,
      );

      if (!mounted) return;

      if (submission.outcome == CheckInOutcome.queuedOffline) {
        await OfflineSyncService.instance.refresh();
        _showPendingDialog();
        return;
      }

      final result = submission.serverResult!;
      final eventTitle =
          (result['event'] as Map?)?['title'] ?? 'Event';
      final badges = result['badges'] as List? ?? [];
      _showSuccessDialog(eventTitle as String, badges);
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  void _showPendingDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Saved — pending sync'),
        content: const Text(
          'You are checked in on this device. Your attendance will upload automatically when internet is available.',
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

  void _showSuccessDialog(String eventTitle, List badges) {
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
            child: _controller == null || !_controller!.value.isInitialized
                ? const Center(child: CircularProgressIndicator())
                : CameraPreview(_controller!),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Take a live selfie to complete check-in. If you are offline, attendance is saved on this device and syncs later.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                if (_error != null) ...[
                  const SizedBox(height: 8),
                  Text(_error!, style: const TextStyle(color: Colors.red)),
                ],
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: _submitting ? null : _captureAndSubmit,
                  child: Text(_submitting ? 'Submitting…' : 'Capture & Check In'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

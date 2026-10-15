import 'package:flutter/material.dart';
import 'package:tabler_icons_plus/tabler_icons_plus.dart';
import 'package:go_router/go_router.dart';

import '../../models/pending_check_in.dart';
import '../../widgets/student_ui.dart';

class AttendanceOtpScreen extends StatefulWidget {
  final String qrToken;
  final double latitude;
  final double longitude;
  final double accuracyM;
  final bool requiresOtp;
  final String eventTitle;
  final String? eventId;
  final bool locationVerified;
  final bool offlineSubmission;
  final DateTime? scannedAt;
  final int? deviceUtcOffsetMinutes;
  final String? otpError;

  const AttendanceOtpScreen({
    super.key,
    required this.qrToken,
    required this.latitude,
    required this.longitude,
    this.accuracyM = 0,
    required this.requiresOtp,
    required this.eventTitle,
    this.eventId,
    this.locationVerified = false,
    this.offlineSubmission = false,
    this.scannedAt,
    this.deviceUtcOffsetMinutes,
    this.otpError,
  });

  @override
  State<AttendanceOtpScreen> createState() => _AttendanceOtpScreenState();
}

class _AttendanceOtpScreenState extends State<AttendanceOtpScreen> {
  final _codeController = TextEditingController();
  OfflineAttendanceAction _offlineAction = OfflineAttendanceAction.checkIn;

  @override
  void initState() {
    super.initState();
    if (!widget.locationVerified && !widget.offlineSubmission) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Location must be verified before OTP.'),
          ),
        );
        context.go('/attendance/scan');
      });
    }
  }

  void _continue() {
    if (!widget.locationVerified && !widget.offlineSubmission) return;

    if ((widget.requiresOtp || widget.offlineSubmission) &&
        _codeController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter the OTP announced at the event.')),
      );
      return;
    }

    context.push(
      '/attendance/selfie',
      extra: {
        'qr_token': widget.qrToken,
        'latitude': widget.latitude,
        'longitude': widget.longitude,
        'accuracy_m': widget.accuracyM,
        'event_id': widget.eventId,
        'event_title': widget.eventTitle,
        'requires_otp': widget.requiresOtp,
        'location_verified': widget.locationVerified,
        'offline_submission': widget.offlineSubmission,
        'scanned_at': widget.scannedAt?.toIso8601String(),
        'device_utc_offset_minutes': widget.deviceUtcOffsetMinutes,
        'offline_action': _offlineAction.name,
        if (_codeController.text.trim().isNotEmpty)
          'otp_code': _codeController.text.trim(),
      },
    );
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Attendance OTP')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            StudentStepIndicator(
              current: widget.offlineSubmission ? 2 : 3,
              total: widget.offlineSubmission ? 3 : 4,
            ),
            const SizedBox(height: 20),
            StudentPageTitle(
              title: widget.offlineSubmission
                  ? 'Offline attendance OTP'
                  : 'Attendance OTP',
            ),
            const SizedBox(height: 8),
            Text(
              widget.offlineSubmission
                  ? 'No location is collected offline. Enter the event OTP, choose time in or time out, then take a live selfie. Staff will review this submission after it syncs.'
                  : widget.requiresOtp
                  ? 'Location verified. Enter the OTP announced for ${widget.eventTitle}.'
                  : 'Location verified. If staff announced an OTP for ${widget.eventTitle}, enter it below. Otherwise continue.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (widget.otpError != null) ...[
              const SizedBox(height: 12),
              StudentErrorBanner(message: widget.otpError!),
            ],
            const SizedBox(height: 24),
            if (widget.offlineSubmission) ...[
              const Text(
                'Attendance action',
                style: TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              SegmentedButton<OfflineAttendanceAction>(
                segments: const [
                  ButtonSegment(
                    value: OfflineAttendanceAction.checkIn,
                    label: Text('Time in'),
                    icon: Icon(TablerIcons.login),
                  ),
                  ButtonSegment(
                    value: OfflineAttendanceAction.checkOut,
                    label: Text('Time out'),
                    icon: Icon(TablerIcons.logout),
                  ),
                ],
                selected: {_offlineAction},
                onSelectionChanged: (value) =>
                    setState(() => _offlineAction = value.first),
              ),
              const SizedBox(height: 20),
            ],
            TextField(
              controller: _codeController,
              decoration: const InputDecoration(
                labelText: 'Attendance OTP',
                hintText: '6-digit code',
              ),
              autofocus: true,
              keyboardType: TextInputType.number,
            ),
            const Spacer(),
            FilledButton(
              onPressed: _continue,
              child: Semantics(
                button: true,
                label: 'Continue to selfie',
                child: Text(
                  widget.offlineSubmission
                      ? 'Continue to live selfie'
                      : 'Continue to selfie',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

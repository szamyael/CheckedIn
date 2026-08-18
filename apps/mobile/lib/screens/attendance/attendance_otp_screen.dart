import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../widgets/student_ui.dart';

class AttendanceOtpScreen extends StatefulWidget {
  final String qrToken;
  final double latitude;
  final double longitude;
  final bool requiresOtp;
  final String eventTitle;
  final String? eventId;
  final bool locationVerified;

  const AttendanceOtpScreen({
    super.key,
    required this.qrToken,
    required this.latitude,
    required this.longitude,
    required this.requiresOtp,
    required this.eventTitle,
    this.eventId,
    this.locationVerified = false,
  });

  @override
  State<AttendanceOtpScreen> createState() => _AttendanceOtpScreenState();
}

class _AttendanceOtpScreenState extends State<AttendanceOtpScreen> {
  final _codeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (!widget.locationVerified) {
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
    if (!widget.locationVerified) return;

    if (widget.requiresOtp && _codeController.text.trim().isEmpty) {
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
        'event_id': widget.eventId,
        'event_title': widget.eventTitle,
        'location_verified': true,
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
            const StudentPageTitle(title: 'Step 2 of 3 — OTP'),
            const SizedBox(height: 8),
            Text(
              widget.requiresOtp
                  ? 'Location verified. Enter the OTP announced for ${widget.eventTitle}.'
                  : 'Location verified. If staff announced an OTP for ${widget.eventTitle}, enter it below. Otherwise continue.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _codeController,
              decoration: const InputDecoration(
                labelText: 'Attendance OTP',
                hintText: '6-digit code',
              ),
              keyboardType: TextInputType.number,
            ),
            const Spacer(),
            FilledButton(
              onPressed: _continue,
              child: const Text('Continue to selfie'),
            ),
          ],
        ),
      ),
    );
  }
}

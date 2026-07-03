import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/attendance_service.dart';

class LocationCheckScreen extends StatefulWidget {
  final String qrToken;

  const LocationCheckScreen({super.key, required this.qrToken});

  @override
  State<LocationCheckScreen> createState() => _LocationCheckScreenState();
}

class _LocationCheckScreenState extends State<LocationCheckScreen> {
  final _attendance = AttendanceService();
  bool _checking = false;
  String? _error;

  Future<void> _verifyLocation() async {
    setState(() {
      _checking = true;
      _error = null;
    });

    try {
      final position = await _attendance.getCurrentPosition();
      if (!mounted) return;
      context.push(
        '/attendance/selfie',
        extra: {
          'qr_token': widget.qrToken,
          'latitude': position.latitude,
          'longitude': position.longitude,
        },
      );
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _checking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Verify Location')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.location_on, size: 72),
            const SizedBox(height: 16),
            Text(
              'Location Required',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'You must be at the event venue to check in. Enable GPS and tap below to verify your location.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (_error != null) ...[
              const SizedBox(height: 16),
              Text(_error!, style: const TextStyle(color: Colors.red)),
            ],
            const Spacer(),
            FilledButton(
              onPressed: _checking ? null : _verifyLocation,
              child: Text(_checking ? 'Checking location…' : 'Verify My Location'),
            ),
          ],
        ),
      ),
    );
  }
}

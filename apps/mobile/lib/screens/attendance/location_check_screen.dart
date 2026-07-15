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
  String? _status;

  Future<void> _verifyLocation() async {
    setState(() {
      _checking = true;
      _error = null;
      _status = 'Requesting GPS…';
    });

    try {
      final position = await _attendance.getCurrentPosition();
      if (!mounted) return;
      setState(() => _status = 'Loading event details…');

      final meta = await _attendance.fetchCheckInMeta(widget.qrToken);
      if (!mounted) return;

      context.push(
        '/attendance/otp',
        extra: {
          'qr_token': widget.qrToken,
          'latitude': position.latitude,
          'longitude': position.longitude,
          'requires_otp': meta['requires_otp'] == true,
          'event_title': meta['title'] as String? ?? 'Event',
          'event_id': meta['id'] as String?,
        },
      );
    } catch (e) {
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
        _status = null;
      });
    } finally {
      if (mounted) {
        setState(() {
          _checking = false;
          _status = null;
        });
      }
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
              'You must be at the event venue to check in. Enable GPS and grant location permission, then tap below.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (_status != null) ...[
              const SizedBox(height: 16),
              Text(
                _status!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
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

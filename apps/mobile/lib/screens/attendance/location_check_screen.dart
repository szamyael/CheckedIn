import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/attendance_service.dart';

/// Step 1 of check-in: GPS must pass the event geofence before OTP/selfie.
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
  String? _distanceHint;

  Future<void> _verifyLocation() async {
    setState(() {
      _checking = true;
      _error = null;
      _distanceHint = null;
      _status = 'Requesting GPS…';
    });

    try {
      final position = await _attendance.getCurrentPosition();
      if (!mounted) return;
      setState(() => _status = 'Verifying you are at the venue…');

      final meta = await _attendance.verifyLocationForCheckIn(
        qrToken: widget.qrToken,
        latitude: position.latitude,
        longitude: position.longitude,
      );

      if (!mounted) return;

      final locationOk = meta['location_ok'] == true;
      if (!locationOk) {
        final distance = meta['distance_m'];
        final allowed = meta['allowed_radius_m'];
        setState(() {
          _error = (meta['error'] as String?) ??
              'Location check failed. Move closer to the venue and try again.';
          if (distance != null && allowed != null) {
            _distanceHint = 'Distance: ${distance}m (allowed: ${allowed}m)';
          }
          _status = null;
        });
        return;
      }

      // Location passed — only then continue to OTP → selfie.
      context.push(
        '/attendance/otp',
        extra: {
          'qr_token': widget.qrToken,
          'latitude': position.latitude,
          'longitude': position.longitude,
          'requires_otp': meta['requires_otp'] == true,
          'event_title': meta['title'] as String? ?? 'Event',
          'event_id': meta['id'] as String?,
          'location_verified': true,
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
              'Step 1 of 3 — Location',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              'You must be inside the event geofence before OTP or selfie. If verification fails, check-in stops here.',
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
              if (_distanceHint != null) ...[
                const SizedBox(height: 8),
                Text(
                  _distanceHint!,
                  style: const TextStyle(color: Colors.red, fontSize: 13),
                ),
              ],
            ],
            const Spacer(),
            FilledButton(
              onPressed: _checking ? null : _verifyLocation,
              child: Text(
                _checking ? 'Verifying location…' : 'Verify My Location',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

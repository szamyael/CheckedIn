import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/attendance_service.dart';
import '../../services/permission_service.dart';
import '../../widgets/permission_gate.dart';
import '../../widgets/student_ui.dart';
import '../../widgets/universal_loader.dart';

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
    final granted = await PermissionService.instance.ensure(
      context,
      AppPermission.location,
      showRationaleFirst: true,
    );
    if (!granted) {
      if (mounted) {
        setState(() {
          _error =
              'Location is required to verify you are at the event venue.';
        });
      }
      return;
    }

    setState(() {
      _checking = true;
      _error = null;
      _distanceHint = null;
      _status = 'Requesting GPS…';
    });
    UniversalLoaderController.instance.show('Verifying location…');

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
      final message = e.toString().replaceFirst('Exception: ', '');
      final isPermissionIssue = message.toLowerCase().contains('permission') ||
          message.toLowerCase().contains('location services');
      if (isPermissionIssue && mounted) {
        await PermissionService.instance.showPermissionDeniedDialog(
          context,
          AppPermission.location,
        );
      }
      setState(() {
        _error = message;
        _status = null;
      });
    } finally {
      UniversalLoaderController.instance.hide();
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
            Icon(
              Icons.location_on,
              size: 72,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(height: 16),
            const StudentPageTitle(
              title: 'Step 1 of 3 — Location',
              subtitle:
                  'You must be inside the event geofence before OTP or selfie. If verification fails, check-in stops here.',
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
              StudentErrorBanner(
                message: _distanceHint == null
                    ? _error!
                    : '$_error\n$_distanceHint',
              ),
              if (_error!.toLowerCase().contains('permission') ||
                  _error!.toLowerCase().contains('location')) ...[
                const SizedBox(height: 12),
                PermissionBlockedPanel(
                  permission: AppPermission.location,
                  onRetry: _verifyLocation,
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

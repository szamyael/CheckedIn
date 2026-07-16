import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/attendance_service.dart';
import '../../widgets/universal_loader.dart';

/// After scanning an event QR: check out if already checked in,
/// otherwise continue to the location → OTP → selfie check-in flow.
class AttendanceResolveScreen extends StatefulWidget {
  final String qrToken;

  const AttendanceResolveScreen({super.key, required this.qrToken});

  @override
  State<AttendanceResolveScreen> createState() =>
      _AttendanceResolveScreenState();
}

class _AttendanceResolveScreenState extends State<AttendanceResolveScreen> {
  final _attendance = AttendanceService();
  String? _error;
  String? _successTitle;
  String? _successBody;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _resolve());
  }

  Future<void> _resolve() async {
    setState(() {
      _error = null;
      _successTitle = null;
      _successBody = null;
    });

    final loader = UniversalLoaderController.instance;
    loader.show('Checking attendance…');

    try {
      final meta = await _attendance.fetchCheckInMeta(widget.qrToken);
      final canCheckOut = meta['can_check_out'] == true;
      final alreadyOut = meta['already_checked_out'] == true;
      final title = meta['title'] as String? ?? 'Event';

      if (alreadyOut) {
        if (!mounted) return;
        setState(() {
          _successTitle = 'Already checked out';
          _successBody = 'You already checked out of $title.';
        });
        return;
      }

      if (canCheckOut) {
        loader.show('Checking out…');
        final result = await _attendance.checkOut(qrToken: widget.qrToken);
        if (!mounted) return;
        final eventTitle =
            (result['event'] is Map ? result['event']['title'] : null) as String? ??
                title;
        setState(() {
          _successTitle = 'Checked out';
          _successBody =
              'You have successfully checked out of $eventTitle. No OTP or selfie was required.';
        });
        return;
      }

      if (!mounted) return;
      context.go('/attendance/location', extra: widget.qrToken);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      loader.hide();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Attendance')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_error != null) ...[
              const Icon(Icons.error_outline, size: 64, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                _error!,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.red),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _resolve,
                child: const Text('Try again'),
              ),
              TextButton(
                onPressed: () => context.go('/attendance/scan'),
                child: const Text('Scan again'),
              ),
            ] else if (_successTitle != null) ...[
              const Icon(Icons.check_circle, size: 72, color: Color(0xFF14B8A6)),
              const SizedBox(height: 16),
              Text(
                _successTitle!,
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 8),
              Text(
                _successBody ?? '',
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () => context.go('/home'),
                child: const Text('Back to home'),
              ),
            ] else ...[
              const Spacer(),
              const Center(
                child: CircularProgressIndicator(color: Color(0xFF14B8A6)),
              ),
              const SizedBox(height: 16),
              const Text(
                'Resolving QR…',
                textAlign: TextAlign.center,
              ),
              const Spacer(),
            ],
          ],
        ),
      ),
    );
  }
}

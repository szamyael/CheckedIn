import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../services/attendance_service.dart';
import '../../widgets/student_ui.dart';
import '../../widgets/universal_loader.dart';

/// After scanning an event QR: record a break or check out if already checked in,
/// otherwise continue to the location → OTP → selfie check-in flow.
class AttendanceResolveScreen extends StatefulWidget {
  final String qrToken;
  final DateTime scannedAt;
  final bool wasOfflineAtScan;

  const AttendanceResolveScreen({
    super.key,
    required this.qrToken,
    required this.scannedAt,
    this.wasOfflineAtScan = false,
  });

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
      if (widget.wasOfflineAtScan || meta['offline_fallback'] == true) {
        if (!mounted) return;
        context.go(
          '/attendance/otp',
          extra: {
            'qr_token': widget.qrToken,
            'requires_otp': true,
            'event_title': meta['title'] as String? ?? 'Event',
            'event_id': meta['id'] as String?,
            'offline_submission': true,
            'scanned_at': widget.scannedAt.toIso8601String(),
          },
        );
        return;
      }
      final canCheckOut = meta['can_check_out'] == true;
      final canBreakOut = meta['can_break_out'] == true;
      final canBreakIn = meta['can_break_in'] == true;
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

      if (canBreakIn) {
        loader.show('Recording break-in…');
        final result = await _attendance.recordBreak(
          qrToken: widget.qrToken,
          returning: true,
        );
        if (!mounted) return;
        final eventTitle =
            (result['event'] is Map ? result['event']['title'] : null) as String? ?? title;
        setState(() {
          _successTitle = 'Welcome back';
          _successBody = 'You are checked back in to $eventTitle.';
        });
        return;
      }

      if (canCheckOut || canBreakOut) {
        if (!mounted) return;
        loader.hide();
        final action = await _chooseExitAction(title);
        if (!mounted || action == null) return;
        loader.show(action == _ExitAction.breakOut ? 'Recording break-out…' : 'Checking out…');
        if (action == _ExitAction.breakOut) {
          final result = await _attendance.recordBreak(
            qrToken: widget.qrToken,
            returning: false,
          );
          if (!mounted) return;
          final eventTitle = (result['event'] is Map ? result['event']['title'] : null) as String? ?? title;
          setState(() {
            _successTitle = 'Break started';
            _successBody = 'Your break-out from $eventTitle has been recorded. Scan the event QR again when you return.';
          });
          return;
        }

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
      context.go('/attendance/location', extra: {
        'qr_token': widget.qrToken,
        'scanned_at': widget.scannedAt.toIso8601String(),
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      loader.hide();
    }
  }

  Future<_ExitAction?> _chooseExitAction(String title) => showDialog<_ExitAction>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text(title),
          content: const Text('Are you taking a temporary break or leaving the event for the day?'),
          actions: [
            TextButton(onPressed: () => Navigator.of(dialogContext).pop(), child: const Text('Cancel')),
            OutlinedButton(onPressed: () => Navigator.of(dialogContext).pop(_ExitAction.breakOut), child: const Text('Break out')),
            FilledButton(onPressed: () => Navigator.of(dialogContext).pop(_ExitAction.checkOut), child: const Text('Check out')),
          ],
        ),
      );

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
              Icon(
                Icons.error_outline,
                size: 64,
                color: Theme.of(context).colorScheme.error,
              ),
              const SizedBox(height: 16),
              StudentErrorBanner(message: _error!),
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
              Icon(
                Icons.check_circle,
                size: 72,
                color: Theme.of(context).colorScheme.primary,
              ),
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
              Center(
                child: CircularProgressIndicator(
                  color: Theme.of(context).colorScheme.primary,
                ),
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

enum _ExitAction { breakOut, checkOut }

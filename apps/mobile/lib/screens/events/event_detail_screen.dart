import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../services/events_service.dart';
import '../../widgets/student_ui.dart';

class EventDetailScreen extends StatelessWidget {
  final EventItem event;

  const EventDetailScreen({super.key, required this.event});

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('MMM d, yyyy • h:mm a');
    return Scaffold(
      appBar: AppBar(title: const Text('Event details')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          StudentPageTitle(title: event.title, subtitle: event.venueName),
          if (event.description != null && event.description!.isNotEmpty) ...[
            const SizedBox(height: 16),
            StudentCard(
              child: Text(event.description!),
            ),
          ],
          const SizedBox(height: 16),
          StudentCard(
            child: Column(
              children: [
                _Row(label: 'Starts', value: fmt.format(event.startsAt.toLocal())),
                _Row(label: 'Ends', value: fmt.format(event.endsAt.toLocal())),
                _Row(
                  label: 'Check-in opens',
                  value: fmt.format(event.attendanceStartsAt.toLocal()),
                ),
                _Row(
                  label: 'Check-in closes',
                  value: fmt.format(event.attendanceEndsAt.toLocal()),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: event.isAttendanceOpen
                ? () => context.push('/attendance/scan')
                : null,
            icon: const Icon(Icons.qr_code_scanner),
            label: Text(
              event.isAttendanceOpen
                  ? 'Scan QR to check in or out'
                  : 'Check-in not open yet',
            ),
          ),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;

  const _Row({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(color: StudentUi.muted)),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}

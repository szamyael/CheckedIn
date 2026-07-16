import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../services/events_service.dart';

class EventDetailScreen extends StatelessWidget {
  final EventItem event;

  const EventDetailScreen({super.key, required this.event});

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('MMM d, yyyy • h:mm a');
    return Scaffold(
      appBar: AppBar(title: const Text('Event details')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Text(event.title, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          Text(event.venueName, style: Theme.of(context).textTheme.titleMedium),
          if (event.description != null && event.description!.isNotEmpty) ...[
            const SizedBox(height: 16),
            Text(event.description!),
          ],
          const SizedBox(height: 24),
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
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: event.isAttendanceOpen
                ? () => Navigator.of(context).pop()
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
            child: Text(label, style: const TextStyle(color: Color(0xFF475569))),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }
}

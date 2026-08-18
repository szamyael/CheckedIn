import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../services/events_service.dart';
import '../../widgets/student_ui.dart';

class EventsScreen extends StatefulWidget {
  const EventsScreen({super.key});

  @override
  State<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends State<EventsScreen> {
  final _events = EventsService();
  late Future<List<EventItem>> _future;
  bool _calendarView = true;
  DateTime _month = DateTime(DateTime.now().year, DateTime.now().month);

  @override
  void initState() {
    super.initState();
    _future = _events.fetchPublishedEvents();
  }

  Future<void> _refresh() async {
    setState(() => _future = _events.fetchPublishedEvents());
    await _future;
  }

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: _refresh,
      child: FutureBuilder<List<EventItem>>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return ListView(
              padding: const EdgeInsets.all(24),
              children: [
                const StudentPageTitle(title: 'Events'),
                const SizedBox(height: 16),
                StudentErrorBanner(message: '${snapshot.error}'),
              ],
            );
          }

          final events = snapshot.data ?? [];
          if (events.isEmpty) {
            return ListView(
              padding: const EdgeInsets.all(24),
              children: const [
                StudentPageTitle(title: 'Events'),
                StudentEmptyState(
                  icon: Icons.event_busy,
                  message: 'No upcoming events',
                ),
              ],
            );
          }

          if (_calendarView) {
            return ListView(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              children: [
                const StudentPageTitle(title: 'Events'),
                const SizedBox(height: 12),
                SegmentedButton<bool>(
                  segments: const [
                    ButtonSegment(value: true, label: Text('Calendar'), icon: Icon(Icons.calendar_month)),
                    ButtonSegment(value: false, label: Text('List'), icon: Icon(Icons.list)),
                  ],
                  selected: {_calendarView},
                  onSelectionChanged: (s) => setState(() => _calendarView = s.first),
                ),
                const SizedBox(height: 12),
                _MonthCalendar(
                  month: _month,
                  events: events,
                  onMonthChanged: (m) => setState(() => _month = m),
                  onEventTap: () => context.push('/attendance/scan'),
                ),
              ],
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            itemCount: events.length + 1,
            separatorBuilder: (context, index) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              if (index == 0) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const StudentPageTitle(title: 'Events'),
                    const SizedBox(height: 12),
                    SegmentedButton<bool>(
                      segments: const [
                        ButtonSegment(value: true, label: Text('Calendar'), icon: Icon(Icons.calendar_month)),
                        ButtonSegment(value: false, label: Text('List'), icon: Icon(Icons.list)),
                      ],
                      selected: {_calendarView},
                      onSelectionChanged: (s) => setState(() => _calendarView = s.first),
                    ),
                  ],
                );
              }
              final event = events[index - 1];
              return _EventTile(
                event: event,
                onTap: () => context.push('/events/detail', extra: event),
              );
            },
          );
        },
      ),
    );
  }
}

class _EventTile extends StatelessWidget {
  final EventItem event;
  final VoidCallback onTap;

  const _EventTile({required this.event, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final fmt = DateFormat('MMM d, yyyy • h:mm a');
    return StudentCard(
      padding: EdgeInsets.zero,
      onTap: onTap,
      child: ListTile(
        title: Text(event.title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(event.venueName),
            Text(fmt.format(event.startsAt.toLocal())),
            const SizedBox(height: 4),
            Text(
              event.isAttendanceOpen ? 'Check-in open' : 'Check-in opens ${fmt.format(event.attendanceStartsAt.toLocal())}',
              style: TextStyle(
                color: event.isAttendanceOpen ? StudentUi.teal : StudentUi.muted,
                fontSize: 12,
              ),
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }
}

class _MonthCalendar extends StatelessWidget {
  final DateTime month;
  final List<EventItem> events;
  final ValueChanged<DateTime> onMonthChanged;
  final VoidCallback onEventTap;

  const _MonthCalendar({
    required this.month,
    required this.events,
    required this.onMonthChanged,
    required this.onEventTap,
  });

  @override
  Widget build(BuildContext context) {
    final first = DateTime(month.year, month.month, 1);
    final last = DateTime(month.year, month.month + 1, 0);
    final startPad = first.weekday % 7;
    final totalCells = startPad + last.day;
    final rows = (totalCells / 7).ceil();

    final eventsByDay = <int, List<EventItem>>{};
    for (final e in events) {
      if (e.startsAt.year == month.year && e.startsAt.month == month.month) {
        eventsByDay.putIfAbsent(e.startsAt.day, () => []).add(e);
      }
    }

    return ListView(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            IconButton(onPressed: () => onMonthChanged(DateTime(month.year, month.month - 1)), icon: const Icon(Icons.chevron_left)),
            Text(DateFormat('MMMM yyyy').format(month), style: Theme.of(context).textTheme.titleMedium),
            IconButton(onPressed: () => onMonthChanged(DateTime(month.year, month.month + 1)), icon: const Icon(Icons.chevron_right)),
          ],
        ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: 7, childAspectRatio: 0.85),
          itemCount: rows * 7,
          itemBuilder: (context, index) {
            final dayNum = index - startPad + 1;
            if (dayNum < 1 || dayNum > last.day) {
              return const SizedBox.shrink();
            }
            final dayEvents = eventsByDay[dayNum] ?? [];
            final isToday = dayNum == DateTime.now().day && month.year == DateTime.now().year && month.month == DateTime.now().month;

            return InkWell(
              onTap: dayEvents.isNotEmpty ? onEventTap : null,
              child: Container(
                margin: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  border: Border.all(
                    color: isToday
                        ? Theme.of(context).colorScheme.primary
                        : StudentUi.border,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                padding: const EdgeInsets.all(4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('$dayNum', style: TextStyle(fontWeight: isToday ? FontWeight.bold : FontWeight.normal, fontSize: 12)),
                    if (dayEvents.isNotEmpty)
                      Expanded(
                        child: Text(
                          dayEvents.first.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 9, color: Theme.of(context).colorScheme.primary),
                        ),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

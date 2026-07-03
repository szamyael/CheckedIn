import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../services/events_service.dart';

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
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
          child: SegmentedButton<bool>(
            segments: const [
              ButtonSegment(value: true, label: Text('Calendar'), icon: Icon(Icons.calendar_month)),
              ButtonSegment(value: false, label: Text('List'), icon: Icon(Icons.list)),
            ],
            selected: {_calendarView},
            onSelectionChanged: (s) => setState(() => _calendarView = s.first),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _refresh,
            child: FutureBuilder<List<EventItem>>(
              future: _future,
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return ListView(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(24),
                        child: Text('Error: ${snapshot.error}'),
                      ),
                    ],
                  );
                }

                final events = snapshot.data ?? [];
                if (events.isEmpty) {
                  return ListView(
                    children: const [
                      SizedBox(height: 80),
                      Icon(Icons.event_busy, size: 48, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No upcoming events', textAlign: TextAlign.center),
                    ],
                  );
                }

                if (_calendarView) {
                  return _MonthCalendar(
                    month: _month,
                    events: events,
                    onMonthChanged: (m) => setState(() => _month = m),
                    onEventTap: () => context.push('/attendance/scan'),
                  );
                }

                return ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: events.length,
                  separatorBuilder: (context, index) => const SizedBox(height: 12),
                  itemBuilder: (context, index) => _EventTile(
                    event: events[index],
                    onTap: () => context.push('/events/detail', extra: events[index]),
                  ),
                );
              },
            ),
          ),
        ),
      ],
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
    return Card(
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
              style: TextStyle(color: event.isAttendanceOpen ? Colors.green : Colors.grey, fontSize: 12),
            ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right),
        onTap: onTap,
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
      padding: const EdgeInsets.all(16),
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
                  border: Border.all(color: isToday ? Theme.of(context).colorScheme.primary : Colors.grey.shade300),
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

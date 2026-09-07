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
                const _EventsHeader(),
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
                const _EventsHeader(),
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
                    const _EventsHeader(),
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
      padding: const EdgeInsets.all(16),
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(width: 42, height: 42, color: const Color(0xFFE7EEF4), child: const Icon(Icons.event_outlined, color: Color(0xFF17324D))),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [Expanded(child: Text(event.title, style: const TextStyle(fontWeight: FontWeight.w700, color: Color(0xFF0C2238))), if (event.isAttendanceOpen) const Padding(padding: EdgeInsets.only(left: 6), child: Text('LIVE', style: TextStyle(color: Color(0xFF237A57), fontSize: 10, fontWeight: FontWeight.w700)))]),
            const SizedBox(height: 5), Text(event.venueName, style: const TextStyle(color: StudentUi.muted, fontSize: 13)), const SizedBox(height: 3), Text(fmt.format(event.startsAt.toLocal()), style: const TextStyle(color: StudentUi.muted, fontSize: 12)),
            const SizedBox(height: 8), Text(event.isAttendanceOpen ? 'Attendance is open' : 'Check-in opens ${fmt.format(event.attendanceStartsAt.toLocal())}', style: TextStyle(color: event.isAttendanceOpen ? const Color(0xFF237A57) : StudentUi.muted, fontSize: 12, fontWeight: FontWeight.w600)),
          ])),
          const Icon(Icons.chevron_right, color: StudentUi.muted),
        ],
      ),
    );
  }
}

class _EventsHeader extends StatelessWidget {
  const _EventsHeader();
  @override
  Widget build(BuildContext context) => const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text('CAMPUS CALENDAR', style: TextStyle(color: StudentUi.muted, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.4)), SizedBox(height: 8), Text('Events', style: TextStyle(color: Color(0xFF0C2238), fontSize: 27, fontWeight: FontWeight.w700)), SizedBox(height: 4), Text('Find an event and scan the organizer QR when attendance opens.', style: TextStyle(color: StudentUi.muted, fontSize: 13))]);
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

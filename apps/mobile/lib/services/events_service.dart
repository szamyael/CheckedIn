import 'package:supabase_flutter/supabase_flutter.dart';

class EventItem {
  final String id;
  final String title;
  final String? description;
  final String venueName;
  final DateTime startsAt;
  final DateTime endsAt;
  final DateTime attendanceStartsAt;
  final DateTime attendanceEndsAt;
  final String status;

  EventItem({
    required this.id,
    required this.title,
    this.description,
    required this.venueName,
    required this.startsAt,
    required this.endsAt,
    required this.attendanceStartsAt,
    required this.attendanceEndsAt,
    required this.status,
  });

  factory EventItem.fromJson(Map<String, dynamic> json) {
    return EventItem(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      venueName: json['venue_name'] as String,
      startsAt: DateTime.parse(json['starts_at'] as String),
      endsAt: DateTime.parse(json['ends_at'] as String),
      attendanceStartsAt: DateTime.parse(
        (json['attendance_starts_at'] ?? json['starts_at']) as String,
      ),
      attendanceEndsAt: DateTime.parse(
        (json['attendance_ends_at'] ?? json['ends_at']) as String,
      ),
      status: json['status'] as String,
    );
  }

  bool get isAttendanceOpen {
    final now = DateTime.now().toUtc();
    return now.isAfter(attendanceStartsAt.toUtc()) &&
        now.isBefore(attendanceEndsAt.toUtc());
  }
}

class EventsService {
  SupabaseClient get _client => Supabase.instance.client;

  Future<List<EventItem>> fetchPublishedEvents() async {
    final response = await _client
        .from('events')
        .select(
          'id, title, description, venue_name, starts_at, ends_at, attendance_starts_at, attendance_ends_at, status',
        )
        .eq('status', 'published')
        .gte('ends_at', DateTime.now().toUtc().toIso8601String())
        .order('starts_at', ascending: true);

    return (response as List)
        .map((e) => EventItem.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }
}

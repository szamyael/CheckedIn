import 'package:supabase_flutter/supabase_flutter.dart';

import 'local_cache_service.dart';

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

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'description': description,
        'venue_name': venueName,
        'starts_at': startsAt.toUtc().toIso8601String(),
        'ends_at': endsAt.toUtc().toIso8601String(),
        'attendance_starts_at': attendanceStartsAt.toUtc().toIso8601String(),
        'attendance_ends_at': attendanceEndsAt.toUtc().toIso8601String(),
        'status': status,
      };

  bool get isAttendanceOpen {
    final now = DateTime.now().toUtc();
    return now.isAfter(attendanceStartsAt.toUtc()) &&
        now.isBefore(attendanceEndsAt.toUtc());
  }
}

class EventsService {
  SupabaseClient get _client => Supabase.instance.client;
  final _cache = LocalCacheService.instance;

  Future<List<EventItem>> fetchPublishedEvents() async {
    try {
      final response = await _client
          .from('events')
          .select(
            'id, title, description, venue_name, starts_at, ends_at, attendance_starts_at, attendance_ends_at, status',
          )
          .eq('status', 'published')
          .gte('ends_at', DateTime.now().toUtc().toIso8601String())
          .order('starts_at', ascending: true);

      final events = (response as List)
          .map((e) => EventItem.fromJson(Map<String, dynamic>.from(e as Map)))
          .toList();
      await _cache.writeJson(
        CacheKeys.events,
        events.map((e) => e.toJson()).toList(),
      );
      return events;
    } catch (_) {
      final cached = await _cache.readJson(CacheKeys.events, (raw) {
        if (raw is! List) return <EventItem>[];
        return raw
            .map((e) => EventItem.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList();
      });
      if (cached != null) return cached;
      throw Exception(
        'Events unavailable offline. Connect once to download the event list for this device.',
      );
    }
  }
}

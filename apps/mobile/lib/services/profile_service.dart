import 'package:supabase_flutter/supabase_flutter.dart';

import 'offline_storage_service.dart';

class AchievementItem {
  final String id;
  final String badgeName;
  final String badgeType;
  final DateTime earnedAt;
  final String? eventId;

  AchievementItem({
    required this.id,
    required this.badgeName,
    required this.badgeType,
    required this.earnedAt,
    this.eventId,
  });

  factory AchievementItem.fromJson(Map<String, dynamic> json) {
    return AchievementItem(
      id: json['id'] as String,
      badgeName: json['badge_name'] as String,
      badgeType: json['badge_type'] as String,
      earnedAt: DateTime.parse(json['earned_at'] as String),
      eventId: json['event_id'] as String?,
    );
  }
}

class AttendanceHistoryItem {
  final String id;
  final DateTime checkedInAt;
  final String eventTitle;
  final bool isPending;
  final String? syncError;

  AttendanceHistoryItem({
    required this.id,
    required this.checkedInAt,
    required this.eventTitle,
    this.isPending = false,
    this.syncError,
  });
}

class ProfileService {
  SupabaseClient get _client => Supabase.instance.client;

  Future<Map<String, dynamic>?> fetchStudentProfile() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return null;

    return await _client
        .from('students')
        .select('student_id, first_name, last_name, program, year_level')
        .eq('id', userId)
        .maybeSingle();
  }

  Future<List<AchievementItem>> fetchAchievements() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return [];

    final response = await _client
        .from('student_achievements')
        .select('id, badge_name, badge_type, earned_at, event_id')
        .eq('student_id', userId)
        .order('earned_at', ascending: false);

    return (response as List)
        .map((a) => AchievementItem.fromJson(Map<String, dynamic>.from(a as Map)))
        .toList();
  }

  Future<List<AttendanceHistoryItem>> fetchAttendanceHistory() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return [];

    final pending = await OfflineStorageService.instance.loadPending();
    final pendingItems = pending.map((p) {
      return AttendanceHistoryItem(
        id: p.id,
        checkedInAt: p.capturedAt,
        eventTitle: p.eventTitleHint ?? 'Event (pending sync)',
        isPending: true,
        syncError: p.lastError,
      );
    }).toList();

    try {
      final response = await _client
          .from('attendance_records')
          .select('id, checked_in_at, events(title)')
          .eq('student_id', userId)
          .eq('status', 'checked_in')
          .order('checked_in_at', ascending: false);

      final synced = (response as List).map((row) {
        final map = Map<String, dynamic>.from(row as Map);
        final events = map['events'];
        final event = events is List ? events.first : events;
        final title = event is Map ? event['title'] as String? : null;
        return AttendanceHistoryItem(
          id: map['id'] as String,
          checkedInAt: DateTime.parse(map['checked_in_at'] as String),
          eventTitle: title ?? 'Event',
        );
      }).toList();

      return [...pendingItems, ...synced];
    } catch (_) {
      return pendingItems;
    }
  }

  Future<int> fetchAttendanceCount() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return 0;

    final pending = await OfflineStorageService.instance.loadPending();

    try {
      final response = await _client
          .from('attendance_records')
          .select('id')
          .eq('student_id', userId)
          .eq('status', 'checked_in');

      return (response as List).length + pending.length;
    } catch (_) {
      return pending.length;
    }
  }
}

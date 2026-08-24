import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth_service.dart';
import 'local_cache_service.dart';
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

  Map<String, dynamic> toJson() => {
        'id': id,
        'badge_name': badgeName,
        'badge_type': badgeType,
        'earned_at': earnedAt.toUtc().toIso8601String(),
        'event_id': eventId,
      };
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

  Map<String, dynamic> toCacheJson() => {
        'id': id,
        'checked_in_at': checkedInAt.toUtc().toIso8601String(),
        'event_title': eventTitle,
      };

  factory AttendanceHistoryItem.fromCacheJson(Map<String, dynamic> json) {
    return AttendanceHistoryItem(
      id: json['id'] as String,
      checkedInAt: DateTime.parse(json['checked_in_at'] as String),
      eventTitle: json['event_title'] as String? ?? 'Event',
    );
  }
}

class ProfileService {
  SupabaseClient get _client => Supabase.instance.client;
  final _cache = LocalCacheService.instance;

  String? get _userId => AuthService.instance.currentUserId;

  Future<Map<String, dynamic>?> fetchStudentProfile() async {
    final userId = _userId;
    if (userId == null) return null;

    if (AuthService.instance.isOfflineMode || _client.auth.currentUser == null) {
      return _cache.readJson(CacheKeys.studentProfile, (raw) {
        if (raw is! Map) return null;
        return Map<String, dynamic>.from(raw);
      });
    }

    try {
      final profile = await _client
          .from('students')
          .select(
            'student_id, first_name, last_name, program, year_level, section, reward_points, profile_photo_url, name_extension, middle_name',
          )
          .eq('id', userId)
          .maybeSingle();
      if (profile != null) {
        await _cache.writeJson(CacheKeys.studentProfile, profile);
      }
      return profile;
    } catch (_) {
      return _cache.readJson(CacheKeys.studentProfile, (raw) {
        if (raw is! Map) return null;
        return Map<String, dynamic>.from(raw);
      });
    }
  }

  Future<void> updateProfile({
    required String firstName,
    required String lastName,
    required String program,
    String? section,
    required int yearLevel,
  }) async {
    final userId = _userId;
    if (userId == null) throw Exception('Not signed in');
    if (AuthService.instance.isOfflineMode) {
      throw Exception(
        'Profile edits require an internet connection. Changes will be available when you are online.',
      );
    }

    await _client.from('students').update({
      'first_name': firstName,
      'last_name': lastName,
      'program': program,
      'section': section,
      'year_level': yearLevel,
    }).eq('id', userId);

    final existing = await _cache.readJson(CacheKeys.studentProfile, (raw) {
      if (raw is! Map) return <String, dynamic>{};
      return Map<String, dynamic>.from(raw);
    });
    await _cache.writeJson(CacheKeys.studentProfile, {
      ...?existing,
      'first_name': firstName,
      'last_name': lastName,
      'program': program,
      'section': section,
      'year_level': yearLevel,
    });
  }

  Future<Map<String, dynamic>> fetchDashboardStats() async {
    final userId = _userId;
    if (userId == null) {
      return {'attendance_count': 0, 'reward_points': 0, 'badge_count': 0};
    }

    try {
      final student = await fetchStudentProfile();
      final achievements = await fetchAchievements();
      final attendanceCount = await fetchAttendanceCount();
      final stats = {
        'attendance_count': attendanceCount,
        'reward_points': student?['reward_points'] ?? 0,
        'badge_count': achievements.length,
      };
      await _cache.writeJson(CacheKeys.dashboardStats, stats);
      return stats;
    } catch (_) {
      final cached = await _cache.readJson(CacheKeys.dashboardStats, (raw) {
        if (raw is! Map) return null;
        return Map<String, dynamic>.from(raw);
      });
      if (cached != null) return cached;
      return {'attendance_count': 0, 'reward_points': 0, 'badge_count': 0};
    }
  }

  Future<List<AchievementItem>> fetchAchievements() async {
    final userId = _userId;
    if (userId == null) return [];

    if (AuthService.instance.isOfflineMode || _client.auth.currentUser == null) {
      return await _cache.readJson(CacheKeys.achievements, (raw) {
            if (raw is! List) return <AchievementItem>[];
            return raw
                .map(
                  (a) => AchievementItem.fromJson(
                    Map<String, dynamic>.from(a as Map),
                  ),
                )
                .toList();
          }) ??
          [];
    }

    try {
      final response = await _client
          .from('student_achievements')
          .select('id, badge_name, badge_type, earned_at, event_id')
          .eq('student_id', userId)
          .order('earned_at', ascending: false);

      final items = (response as List)
          .map(
            (a) =>
                AchievementItem.fromJson(Map<String, dynamic>.from(a as Map)),
          )
          .toList();
      await _cache.writeJson(
        CacheKeys.achievements,
        items.map((a) => a.toJson()).toList(),
      );
      return items;
    } catch (_) {
      return await _cache.readJson(CacheKeys.achievements, (raw) {
            if (raw is! List) return <AchievementItem>[];
            return raw
                .map(
                  (a) => AchievementItem.fromJson(
                    Map<String, dynamic>.from(a as Map),
                  ),
                )
                .toList();
          }) ??
          [];
    }
  }

  Future<List<AttendanceHistoryItem>> fetchAttendanceHistory() async {
    final userId = _userId;
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

    if (AuthService.instance.isOfflineMode || _client.auth.currentUser == null) {
      final cached = await _cache.readJson(CacheKeys.attendanceHistory, (raw) {
            if (raw is! List) return <AttendanceHistoryItem>[];
            return raw
                .map(
                  (h) => AttendanceHistoryItem.fromCacheJson(
                    Map<String, dynamic>.from(h as Map),
                  ),
                )
                .toList();
          }) ??
          [];
      return [...pendingItems, ...cached];
    }

    try {
      final response = await _client
          .from('attendance_records')
          .select('id, checked_in_at, events(title)')
          .eq('student_id', userId)
          .inFilter('status', ['checked_in', 'late', 'excused'])
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

      await _cache.writeJson(
        CacheKeys.attendanceHistory,
        synced.map((h) => h.toCacheJson()).toList(),
      );

      return [...pendingItems, ...synced];
    } catch (_) {
      final cached = await _cache.readJson(CacheKeys.attendanceHistory, (raw) {
            if (raw is! List) return <AttendanceHistoryItem>[];
            return raw
                .map(
                  (h) => AttendanceHistoryItem.fromCacheJson(
                    Map<String, dynamic>.from(h as Map),
                  ),
                )
                .toList();
          }) ??
          [];
      return [...pendingItems, ...cached];
    }
  }

  Future<int> fetchAttendanceCount() async {
    final history = await fetchAttendanceHistory();
    return history.length;
  }
}

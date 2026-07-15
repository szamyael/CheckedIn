import 'package:supabase_flutter/supabase_flutter.dart';

import 'auth_service.dart';
import 'local_cache_service.dart';

class AppNotification {
  final String id;
  final String title;
  final String body;
  final String type;
  final DateTime createdAt;
  final DateTime? readAt;

  AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.createdAt,
    this.readAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      type: json['notification_type'] as String,
      createdAt: DateTime.parse(json['created_at'] as String),
      readAt: json['read_at'] != null
          ? DateTime.parse(json['read_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'title': title,
        'body': body,
        'notification_type': type,
        'created_at': createdAt.toUtc().toIso8601String(),
        'read_at': readAt?.toUtc().toIso8601String(),
      };

  bool get isUnread => readAt == null;

  AppNotification copyWith({DateTime? readAt}) {
    return AppNotification(
      id: id,
      title: title,
      body: body,
      type: type,
      createdAt: createdAt,
      readAt: readAt ?? this.readAt,
    );
  }
}

class NotificationService {
  SupabaseClient get _client => Supabase.instance.client;
  final _cache = LocalCacheService.instance;

  String? get _userId => AuthService.instance.currentUserId;

  Future<List<AppNotification>> fetchNotifications({int limit = 50}) async {
    final userId = _userId;
    if (userId == null) return [];

    if (AuthService.instance.isOfflineMode || _client.auth.currentUser == null) {
      return await _cachedNotifications() ?? [];
    }

    try {
      final data = await _client
          .from('notifications')
          .select('id, title, body, notification_type, read_at, created_at')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(limit);

      final items = (data as List)
          .map(
            (n) =>
                AppNotification.fromJson(Map<String, dynamic>.from(n as Map)),
          )
          .toList();
      await _cache.writeJson(
        CacheKeys.notifications,
        items.map((n) => n.toJson()).toList(),
      );
      return items;
    } catch (_) {
      return await _cachedNotifications() ?? [];
    }
  }

  Future<List<AppNotification>?> _cachedNotifications() {
    return _cache.readJson(CacheKeys.notifications, (raw) {
      if (raw is! List) return <AppNotification>[];
      return raw
          .map(
            (n) =>
                AppNotification.fromJson(Map<String, dynamic>.from(n as Map)),
          )
          .toList();
    });
  }

  Future<int> fetchUnreadCount() async {
    final items = await fetchNotifications();
    return items.where((n) => n.isUnread).length;
  }

  Future<void> markRead(String id) async {
    if (AuthService.instance.isOfflineMode || _client.auth.currentUser == null) {
      final items = await _cachedNotifications() ?? [];
      final updated = items
          .map(
            (n) => n.id == id
                ? n.copyWith(readAt: DateTime.now().toUtc())
                : n,
          )
          .toList();
      await _cache.writeJson(
        CacheKeys.notifications,
        updated.map((n) => n.toJson()).toList(),
      );
      return;
    }

    await _client
        .from('notifications')
        .update({'read_at': DateTime.now().toUtc().toIso8601String()})
        .eq('id', id);
  }

  Future<void> markAllRead() async {
    final userId = _userId;
    if (userId == null) return;

    if (AuthService.instance.isOfflineMode || _client.auth.currentUser == null) {
      final items = await _cachedNotifications() ?? [];
      final now = DateTime.now().toUtc();
      final updated = items.map((n) => n.copyWith(readAt: now)).toList();
      await _cache.writeJson(
        CacheKeys.notifications,
        updated.map((n) => n.toJson()).toList(),
      );
      return;
    }

    await _client
        .from('notifications')
        .update({'read_at': DateTime.now().toUtc().toIso8601String()})
        .eq('user_id', userId)
        .filter('read_at', 'is', null);
  }

  RealtimeChannel? subscribeToNew(void Function() onInsert) {
    if (AuthService.instance.isOfflineMode || _client.auth.currentUser == null) {
      return null;
    }

    final userId = _userId;
    final channel = _client.channel('student-notifications-$userId');

    channel.onPostgresChanges(
      event: PostgresChangeEvent.insert,
      schema: 'public',
      table: 'notifications',
      filter: PostgresChangeFilter(
        type: PostgresChangeFilterType.eq,
        column: 'user_id',
        value: userId ?? '',
      ),
      callback: (_) => onInsert(),
    );

    channel.subscribe();
    return channel;
  }
}

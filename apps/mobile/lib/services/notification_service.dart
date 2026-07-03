import 'package:supabase_flutter/supabase_flutter.dart';

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

  bool get isUnread => readAt == null;
}

class NotificationService {
  SupabaseClient get _client => Supabase.instance.client;

  String? get _userId => _client.auth.currentUser?.id;

  Future<List<AppNotification>> fetchNotifications({int limit = 50}) async {
    final userId = _userId;
    if (userId == null) return [];

    final data = await _client
        .from('notifications')
        .select('id, title, body, notification_type, read_at, created_at')
        .eq('user_id', userId)
        .order('created_at', ascending: false)
        .limit(limit);

    return (data as List)
        .map((n) => AppNotification.fromJson(Map<String, dynamic>.from(n as Map)))
        .toList();
  }

  Future<int> fetchUnreadCount() async {
    final userId = _userId;
    if (userId == null) return 0;

    final data = await _client
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .filter('read_at', 'is', null);

    return (data as List).length;
  }

  Future<void> markRead(String id) async {
    await _client
        .from('notifications')
        .update({'read_at': DateTime.now().toUtc().toIso8601String()})
        .eq('id', id);
  }

  Future<void> markAllRead() async {
    final userId = _userId;
    if (userId == null) return;

    await _client
        .from('notifications')
        .update({'read_at': DateTime.now().toUtc().toIso8601String()})
        .eq('user_id', userId)
        .filter('read_at', 'is', null);
  }

  RealtimeChannel subscribeToNew(void Function() onInsert) {
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

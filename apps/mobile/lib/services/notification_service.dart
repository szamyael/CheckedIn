import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import 'appearance_service.dart';
import 'auth_service.dart';
import 'local_cache_service.dart';

class NotificationSoundService {
  static const assetPath = 'audio/checkdin.mp3.mp3';
  static final _player = AudioPlayer();

  static Future<void> play() async {
    await _player.setVolume(0.75);
    await _player.play(AssetSource(assetPath));
  }
}

class AppNotification {
  final String id;
  final String title;
  final String body;
  final String type;
  final DateTime createdAt;
  final DateTime? readAt;
  final String? senderName;
  final String? senderRole;
  final String? senderOrganizationName;
  final String? senderAvatarPath;
  final String? senderAvatarUrl;

  AppNotification({
    required this.id,
    required this.title,
    required this.body,
    required this.type,
    required this.createdAt,
    this.readAt,
    this.senderName,
    this.senderRole,
    this.senderOrganizationName,
    this.senderAvatarPath,
    this.senderAvatarUrl,
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
      senderName: json['sender_name'] as String?,
      senderRole: json['sender_role'] as String?,
      senderOrganizationName: json['sender_organization_name'] as String?,
      senderAvatarPath: json['sender_avatar_path'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'body': body,
    'notification_type': type,
    'created_at': createdAt.toUtc().toIso8601String(),
    'read_at': readAt?.toUtc().toIso8601String(),
    'sender_name': senderName,
    'sender_role': senderRole,
    'sender_organization_name': senderOrganizationName,
    'sender_avatar_path': senderAvatarPath,
  };

  bool get isUnread => readAt == null;

  AppNotification copyWith({DateTime? readAt, String? senderAvatarUrl}) {
    return AppNotification(
      id: id,
      title: title,
      body: body,
      type: type,
      createdAt: createdAt,
      readAt: readAt ?? this.readAt,
      senderName: senderName,
      senderRole: senderRole,
      senderOrganizationName: senderOrganizationName,
      senderAvatarPath: senderAvatarPath,
      senderAvatarUrl: senderAvatarUrl ?? this.senderAvatarUrl,
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

    if (AuthService.instance.isOfflineMode ||
        _client.auth.currentUser == null) {
      return await _cachedNotifications() ?? [];
    }

    try {
      final data = await _client
          .from('notifications')
          .select(
            'id, title, body, notification_type, read_at, created_at, sender_name, sender_role, sender_organization_name, sender_avatar_path',
          )
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(limit);

      final items = await Future.wait(
        (data as List).map((n) async {
          final notification = AppNotification.fromJson(
            Map<String, dynamic>.from(n as Map),
          );
          return _withSenderAvatar(notification);
        }),
      );
      await _cache.writeJson(
        CacheKeys.notifications,
        items.map((n) => n.toJson()).toList(),
      );
      return items;
    } catch (_) {
      return await _cachedNotifications() ?? [];
    }
  }

  Future<List<AppNotification>?> _cachedNotifications() async {
    final items = await _cache.readJson<List<AppNotification>>(
      CacheKeys.notifications,
      (raw) {
        if (raw is! List) return <AppNotification>[];
        return raw
            .map(
              (n) =>
                  AppNotification.fromJson(Map<String, dynamic>.from(n as Map)),
            )
            .toList();
      },
    );
    if (items == null) return null;
    return Future.wait(items.map(_withSenderAvatar));
  }

  Future<AppNotification> _withSenderAvatar(
    AppNotification notification,
  ) async {
    final path = notification.senderAvatarPath;
    if (path == null || path.isEmpty) return notification;
    try {
      final signed = await _client.storage
          .from('profile-avatars')
          .createSignedUrl(path, 3600);
      return notification.copyWith(senderAvatarUrl: signed);
    } catch (error) {
      debugPrint('Failed to load notification sender avatar: $error');
      return notification;
    }
  }

  Future<int> fetchUnreadCount() async {
    final items = await fetchNotifications();
    return items.where((n) => n.isUnread).length;
  }

  Future<void> markRead(String id) async {
    if (AuthService.instance.isOfflineMode ||
        _client.auth.currentUser == null) {
      final items = await _cachedNotifications() ?? [];
      final updated = items
          .map(
            (n) => n.id == id ? n.copyWith(readAt: DateTime.now().toUtc()) : n,
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

    if (AuthService.instance.isOfflineMode ||
        _client.auth.currentUser == null) {
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

  RealtimeChannel? subscribeToNew(
    void Function(AppNotification notification) onInsert, {
    bool playSound = false,
  }) {
    if (AuthService.instance.isOfflineMode ||
        _client.auth.currentUser == null) {
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
      callback: (payload) async {
        final notification = await _withSenderAvatar(
          AppNotification.fromJson(payload.newRecord),
        );
        if (playSound &&
            AppearanceService.instance.notificationSoundPreference ==
                NotificationSoundPreference.checkedInMp3) {
          NotificationSoundService.play().catchError((Object error) {
            debugPrint('Failed to play notification sound: $error');
          });
        }
        onInsert(notification);
      },
    );

    channel.subscribe();
    return channel;
  }
}

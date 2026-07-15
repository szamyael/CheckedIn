import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';

/// Simple JSON file cache under the app documents directory.
class LocalCacheService {
  LocalCacheService._();
  static final LocalCacheService instance = LocalCacheService._();

  Future<Directory> _dir() async {
    final root = await getApplicationDocumentsDirectory();
    final dir = Directory('${root.path}/checkedin_cache');
    if (!await dir.exists()) await dir.create(recursive: true);
    return dir;
  }

  Future<File> _file(String key) async {
    final safe = key.replaceAll(RegExp(r'[^a-zA-Z0-9_\-]'), '_');
    return File('${(await _dir()).path}/$safe.json');
  }

  Future<void> writeJson(String key, Object? data) async {
    final file = await _file(key);
    await file.writeAsString(
      jsonEncode({
        'cached_at': DateTime.now().toUtc().toIso8601String(),
        'data': data,
      }),
    );
  }

  Future<T?> readJson<T>(
    String key,
    T? Function(dynamic raw) decode,
  ) async {
    try {
      final file = await _file(key);
      if (!await file.exists()) return null;
      final map = jsonDecode(await file.readAsString()) as Map<String, dynamic>;
      return decode(map['data']);
    } catch (_) {
      return null;
    }
  }

  Future<DateTime?> cachedAt(String key) async {
    try {
      final file = await _file(key);
      if (!await file.exists()) return null;
      final map = jsonDecode(await file.readAsString()) as Map<String, dynamic>;
      final raw = map['cached_at'] as String?;
      return raw != null ? DateTime.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  Future<void> remove(String key) async {
    final file = await _file(key);
    if (await file.exists()) await file.delete();
  }
}

class CacheKeys {
  static const credentials = 'auth_credentials';
  static const accountStatus = 'account_status';
  static const studentProfile = 'student_profile';
  static const achievements = 'achievements';
  static const attendanceHistory = 'attendance_history';
  static const dashboardStats = 'dashboard_stats';
  static const events = 'published_events';
  static const notifications = 'notifications';
  static String checkInMeta(String qrToken) => 'checkin_meta_$qrToken';
}

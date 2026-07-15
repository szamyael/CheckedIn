import 'dart:convert';
import 'dart:math';

import 'package:crypto/crypto.dart';

import 'local_cache_service.dart';

class OfflineCredentials {
  final String studentId;
  final String email;
  final String userId;
  final String passwordSalt;
  final String passwordHash;
  final String accountStatus;
  final bool emailVerified;

  const OfflineCredentials({
    required this.studentId,
    required this.email,
    required this.userId,
    required this.passwordSalt,
    required this.passwordHash,
    required this.accountStatus,
    required this.emailVerified,
  });

  Map<String, dynamic> toJson() => {
        'student_id': studentId,
        'email': email,
        'user_id': userId,
        'password_salt': passwordSalt,
        'password_hash': passwordHash,
        'account_status': accountStatus,
        'email_verified': emailVerified,
      };

  factory OfflineCredentials.fromJson(Map<String, dynamic> json) {
    return OfflineCredentials(
      studentId: json['student_id'] as String,
      email: json['email'] as String,
      userId: json['user_id'] as String,
      passwordSalt: json['password_salt'] as String,
      passwordHash: json['password_hash'] as String,
      accountStatus: json['account_status'] as String? ?? 'active',
      emailVerified: json['email_verified'] as bool? ?? true,
    );
  }
}

/// Stores a salted password hash so students can unlock the app offline
/// after at least one successful online login on this device.
class OfflineCredentialStore {
  OfflineCredentialStore._();
  static final OfflineCredentialStore instance = OfflineCredentialStore._();

  final _cache = LocalCacheService.instance;

  static String _newSalt() {
    final rng = Random.secure();
    final bytes = List<int>.generate(16, (_) => rng.nextInt(256));
    return base64UrlEncode(bytes);
  }

  static String hashPassword(String password, String salt) {
    var digest = sha256.convert(utf8.encode('$salt:$password'));
    for (var i = 0; i < 12000; i++) {
      digest = sha256.convert(digest.bytes);
    }
    return digest.toString();
  }

  Future<void> saveAfterOnlineLogin({
    required String studentId,
    required String email,
    required String userId,
    required String password,
    required String accountStatus,
    required bool emailVerified,
  }) async {
    final salt = _newSalt();
    final creds = OfflineCredentials(
      studentId: studentId,
      email: email.trim().toLowerCase(),
      userId: userId,
      passwordSalt: salt,
      passwordHash: hashPassword(password, salt),
      accountStatus: accountStatus,
      emailVerified: emailVerified,
    );
    await _cache.writeJson(CacheKeys.credentials, creds.toJson());
    await _cache.writeJson(CacheKeys.accountStatus, accountStatus);
  }

  Future<OfflineCredentials?> load() async {
    final raw = await _cache.readJson<dynamic>(
      CacheKeys.credentials,
      (value) => value,
    );
    if (raw is! Map) return null;
    return OfflineCredentials.fromJson(Map<String, dynamic>.from(raw));
  }

  Future<OfflineCredentials?> findByStudentId(String studentId) async {
    final creds = await load();
    if (creds == null) return null;
    if (creds.studentId.toLowerCase() != studentId.toLowerCase()) return null;
    return creds;
  }

  Future<bool> verifyPassword(String studentId, String password) async {
    final creds = await findByStudentId(studentId);
    if (creds == null) return false;
    final hash = hashPassword(password, creds.passwordSalt);
    return hash == creds.passwordHash;
  }

  Future<void> updateAccountStatus(String status) async {
    final creds = await load();
    if (creds == null) return;
    await _cache.writeJson(
      CacheKeys.credentials,
      OfflineCredentials(
        studentId: creds.studentId,
        email: creds.email,
        userId: creds.userId,
        passwordSalt: creds.passwordSalt,
        passwordHash: creds.passwordHash,
        accountStatus: status,
        emailVerified: creds.emailVerified,
      ).toJson(),
    );
    await _cache.writeJson(CacheKeys.accountStatus, status);
  }

  Future<void> clear() async {
    await _cache.remove(CacheKeys.credentials);
  }
}

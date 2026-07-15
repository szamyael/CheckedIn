import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/constants.dart';
import '../core/ocr_matching.dart';
import '../models/registration_draft.dart';
import 'connectivity_service.dart';
import 'local_cache_service.dart';
import 'offline_credential_store.dart';

class AuthService extends ChangeNotifier {
  AuthService._();
  static final AuthService instance = AuthService._();

  SupabaseClient get _client => Supabase.instance.client;

  bool _offlineAuthenticated = false;
  String? _offlineUserId;
  String? _offlineEmail;
  bool _offlineEmailVerified = false;
  String? _offlineAccountStatus;

  /// True when unlocked via local credentials without a live Supabase session.
  bool get isOfflineMode => _offlineAuthenticated && currentSession == null;

  Session? get currentSession => _client.auth.currentSession;

  void init() {
    _client.auth.onAuthStateChange.listen((event) {
      if (event.session != null && _offlineAuthenticated) {
        _clearOfflineSession(notify: false);
      }
      notifyListeners();
    });
  }

  void _clearOfflineSession({bool notify = true}) {
    _offlineAuthenticated = false;
    _offlineUserId = null;
    _offlineEmail = null;
    _offlineEmailVerified = false;
    _offlineAccountStatus = null;
    if (notify) notifyListeners();
  }

  Future<void> _enterOfflineSession(OfflineCredentials creds) async {
    _offlineAuthenticated = true;
    _offlineUserId = creds.userId;
    _offlineEmail = creds.email;
    _offlineEmailVerified = creds.emailVerified;
    _offlineAccountStatus = creds.accountStatus;
    notifyListeners();
  }

  Future<ParsedStudentId> scanStudentId(File imageFile) async {
    final bytes = await imageFile.readAsBytes();
    final base64Image = base64Encode(bytes);

    final response = await _client.functions.invoke(
      'scan-student-id',
      body: {'image_base64': base64Image},
    );

    if (response.status != 200) {
      final data = response.data;
      String? err;
      if (data is Map) {
        err = data['error'] as String?;
        final details = data['details'];
        if (details != null && err != null) {
          err = '$err ($details)';
        }
      }
      throw Exception(err ?? 'Failed to scan student ID (${response.status})');
    }

    return ParsedStudentId.fromJson(
      Map<String, dynamic>.from(response.data as Map),
    );
  }

  bool fieldsMatchOcr(ParsedStudentId ocr, RegistrationDraft draft) {
    return OcrMatching.studentIdMatches(ocr.studentId, draft.studentId) &&
        OcrMatching.nameMatches(ocr.firstName, draft.firstName) &&
        OcrMatching.middleNameMatches(ocr.middleName, draft.middleName) &&
        OcrMatching.nameMatches(ocr.lastName, draft.lastName) &&
        OcrMatching.programMatches(ocr.program, draft.program);
  }

  static bool isValidEmail(String email) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email.trim());
  }

  static String maskEmail(String email) {
    final parts = email.split('@');
    if (parts.length != 2) return email;
    final local = parts[0];
    final domain = parts[1];
    if (local.length <= 2) return '${local[0]}***@$domain';
    return '${local[0]}${'*' * (local.length - 2).clamp(1, 4)}${local[local.length - 1]}@$domain';
  }

  bool get isEmailVerified {
    final user = _client.auth.currentUser;
    if (user != null) return user.emailConfirmedAt != null;
    return _offlineEmailVerified;
  }

  bool get needsEmailVerification => isSignedIn && !isEmailVerified;

  String? get currentUserEmail =>
      _client.auth.currentUser?.email ?? _offlineEmail;

  String? get currentUserId =>
      _client.auth.currentUser?.id ?? _offlineUserId;

  Future<({bool needsEmailVerification, String email})> registerStudent({
    required RegistrationDraft draft,
    required String password,
    required File idCardImage,
  }) async {
    if (!AppConstants.isValidStudentId(draft.studentId!)) {
      throw Exception('Invalid student ID format. Use 0XXX-XXXX');
    }

    final email = draft.email!.trim().toLowerCase();
    if (!isValidEmail(email)) {
      throw Exception('Enter a valid email address.');
    }

    final signUp = await _client.auth.signUp(
      email: email,
      password: password,
    );

    if (signUp.user == null) {
      throw Exception(signUp.session == null
          ? 'Registration failed. Student ID or email may already be registered.'
          : 'Registration failed');
    }

    final userId = signUp.user!.id;

    final bytes = await idCardImage.readAsBytes();
    final response = await _client.functions.invoke(
      'complete-student-registration',
      body: {
        'user_id': userId,
        'email': email,
        'student_id': draft.studentId,
        'first_name': draft.firstName,
        'middle_name': draft.middleName,
        'last_name': draft.lastName,
        'program': draft.program,
        'year_level': draft.yearLevel,
        'section': draft.section,
        'image_base64': base64Encode(bytes),
      },
    );

    if (response.status != 200) {
      final err = response.data is Map ? response.data['error'] : null;
      throw Exception(err ?? 'Failed to complete registration (${response.status})');
    }

    final needsVerification = signUp.user!.emailConfirmedAt == null;
    if (needsVerification) {
      try {
        await resendEmailVerificationCode(email);
      } catch (_) {
        // signUp may have already sent a code
      }
    } else if (signUp.session == null) {
      await _client.auth.signInWithPassword(email: email, password: password);
    }

    return (needsEmailVerification: needsVerification, email: email);
  }

  Future<void> resendEmailVerificationCode(String email) async {
    await _client.auth.resend(
      type: OtpType.signup,
      email: email.trim().toLowerCase(),
    );
  }

  Future<void> verifyEmailWithCode({
    required String email,
    required String code,
    String? password,
  }) async {
    final response = await _client.auth.verifyOTP(
      type: OtpType.signup,
      email: email.trim().toLowerCase(),
      token: code.trim(),
    );

    if (response.session == null && password != null) {
      await _client.auth.signInWithPassword(
        email: email.trim().toLowerCase(),
        password: password,
      );
    }

    notifyListeners();
  }

  Future<String> resolveEmailForStudentId(String studentId) async {
    final response = await _client.functions.invoke(
      'student-resolve-email',
      body: {'student_id': studentId},
    );

    if (response.status != 200) {
      final err = response.data is Map ? response.data['error'] : null;
      throw Exception(err ?? 'Student account not found.');
    }

    final email = (response.data as Map)['email'] as String?;
    if (email == null || email.isEmpty) {
      throw Exception('No email on file for this student.');
    }
    return email;
  }

  Future<void> signIn(String studentId, String password) async {
    if (!AppConstants.isValidStudentId(studentId)) {
      throw Exception('Invalid student ID format. Use 0XXX-XXXX');
    }

    final online = await ConnectivityService.instance.refresh();
    if (!online) {
      await _signInOffline(studentId, password);
      return;
    }

    try {
      await _signInOnline(studentId, password);
    } on EmailNotVerifiedException {
      rethrow;
    } catch (e) {
      // Network dropped mid-auth — fall back to local unlock when possible.
      if (_isNetworkAuthError(e) &&
          await OfflineCredentialStore.instance.verifyPassword(
            studentId,
            password,
          )) {
        final creds =
            await OfflineCredentialStore.instance.findByStudentId(studentId);
        if (creds != null) {
          await _enterOfflineSession(creds);
          return;
        }
      }
      rethrow;
    }
  }

  Future<void> _signInOnline(String studentId, String password) async {
    final email = await resolveEmailForStudentId(studentId);
    try {
      await _client.auth.signInWithPassword(email: email, password: password);
    } on AuthException catch (e) {
      if (e.message.toLowerCase().contains('email not confirmed')) {
        throw EmailNotVerifiedException(email);
      }
      rethrow;
    }

    _clearOfflineSession(notify: false);

    final userId = _client.auth.currentUser!.id;
    final profile = await _client
        .from('users')
        .select('status')
        .eq('id', userId)
        .maybeSingle();

    final status = profile?['status'] as String? ?? 'pending';

    if (status == 'disabled') {
      await signOut();
      throw Exception('This account has been disabled.');
    }

    if (status != 'active' && status != 'pending') {
      await signOut();
      throw Exception('Your account is not active.');
    }

    await _client.from('users').update({
      'last_login_at': DateTime.now().toUtc().toIso8601String(),
    }).eq('id', userId);

    await OfflineCredentialStore.instance.saveAfterOnlineLogin(
      studentId: studentId,
      email: email,
      userId: userId,
      password: password,
      accountStatus: status,
      emailVerified: isEmailVerified,
    );

    notifyListeners();
  }

  Future<void> _signInOffline(String studentId, String password) async {
    final ok = await OfflineCredentialStore.instance.verifyPassword(
      studentId,
      password,
    );
    if (!ok) {
      throw Exception(
        'No offline login available for this Student ID. '
        'Connect to the internet and sign in once to enable offline access on this device.',
      );
    }

    final creds =
        await OfflineCredentialStore.instance.findByStudentId(studentId);
    if (creds == null) {
      throw Exception('Offline credentials missing. Sign in online first.');
    }

    if (creds.accountStatus == 'disabled') {
      throw Exception('This account has been disabled.');
    }

    // Prefer a still-valid persisted Supabase session when present.
    if (currentSession != null) {
      _clearOfflineSession(notify: false);
      notifyListeners();
      return;
    }

    await _enterOfflineSession(creds);
  }

  bool _isNetworkAuthError(Object e) {
    final message = e.toString().toLowerCase();
    return message.contains('socket') ||
        message.contains('network') ||
        message.contains('connection') ||
        message.contains('timeout') ||
        message.contains('failed host lookup') ||
        message.contains('clientexception') ||
        message.contains('unavailable');
  }

  Future<String?> fetchAccountStatus() async {
    if (isOfflineMode) {
      return _offlineAccountStatus ??
          await LocalCacheService.instance.readJson(
            CacheKeys.accountStatus,
            (raw) => raw as String?,
          );
    }

    final userId = currentUserId;
    if (userId == null) return null;

    try {
      final profile = await _client
          .from('users')
          .select('status')
          .eq('id', userId)
          .maybeSingle();
      final status = profile?['status'] as String?;
      if (status != null) {
        await LocalCacheService.instance.writeJson(
          CacheKeys.accountStatus,
          status,
        );
        await OfflineCredentialStore.instance.updateAccountStatus(status);
      }
      return status;
    } catch (_) {
      return await LocalCacheService.instance.readJson(
            CacheKeys.accountStatus,
            (raw) => raw as String?,
          ) ??
          _offlineAccountStatus;
    }
  }

  Future<void> signOut() async {
    _clearOfflineSession(notify: false);
    try {
      await _client.auth.signOut();
    } catch (_) {
      // Offline sign-out still clears local unlock.
    }
    notifyListeners();
  }

  Future<({String email, String maskedEmail})> verifyIdForPasswordReset({
    required String studentId,
    required File idCardImage,
  }) async {
    if (!AppConstants.isValidStudentId(studentId)) {
      throw Exception('Invalid student ID format. Use 0XXX-XXXX');
    }

    final bytes = await idCardImage.readAsBytes();
    final response = await _client.functions.invoke(
      'student-verify-reset',
      body: {
        'student_id': studentId,
        'image_base64': base64Encode(bytes),
      },
    );

    if (response.status != 200) {
      final err =
          response.data is Map ? response.data['error'] : 'Verification failed';
      throw Exception(err ?? 'Verification failed');
    }

    final data = Map<String, dynamic>.from(response.data as Map);
    return (
      email: data['email'] as String,
      maskedEmail: data['masked_email'] as String? ?? data['email'] as String,
    );
  }

  Future<void> sendPasswordResetCode(String email) async {
    await _client.auth.signInWithOtp(
      email: email.trim().toLowerCase(),
      shouldCreateUser: false,
    );
  }

  Future<void> completePasswordResetWithCode({
    required String email,
    required String code,
    required String newPassword,
  }) async {
    if (newPassword.length < 8) {
      throw Exception('Password must be at least 8 characters.');
    }

    await _client.auth.verifyOTP(
      type: OtpType.email,
      email: email.trim().toLowerCase(),
      token: code.trim(),
    );

    await _client.auth.updateUser(UserAttributes(password: newPassword));
    await signOut();
  }

  bool get isSignedIn =>
      currentSession != null || _offlineAuthenticated;
}

class EmailNotVerifiedException implements Exception {
  final String email;
  EmailNotVerifiedException(this.email);

  @override
  String toString() => 'Email not verified';
}

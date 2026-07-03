import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/constants.dart';
import '../core/ocr_matching.dart';
import '../models/registration_draft.dart';

class AuthService extends ChangeNotifier {
  AuthService._();
  static final AuthService instance = AuthService._();

  SupabaseClient get _client => Supabase.instance.client;

  void init() {
    _client.auth.onAuthStateChange.listen((_) => notifyListeners());
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
    return user?.emailConfirmedAt != null;
  }

  bool get needsEmailVerification =>
      _client.auth.currentUser != null && !isEmailVerified;

  String? get currentUserEmail => _client.auth.currentUser?.email;

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

    final email = await resolveEmailForStudentId(studentId);
    try {
      await _client.auth.signInWithPassword(email: email, password: password);
    } on AuthException catch (e) {
      if (e.message.toLowerCase().contains('email not confirmed')) {
        throw EmailNotVerifiedException(email);
      }
      rethrow;
    }

    final userId = _client.auth.currentUser!.id;
    final profile = await _client
        .from('users')
        .select('status')
        .eq('id', userId)
        .maybeSingle();

    if (profile != null && profile['status'] == 'disabled') {
      await signOut();
      throw Exception('This account has been disabled.');
    }

    if (profile != null && profile['status'] != 'active' &&
        profile['status'] != 'pending') {
      await signOut();
      throw Exception('Your account is not active.');
    }

    await _client.from('users').update({
      'last_login_at': DateTime.now().toUtc().toIso8601String(),
    }).eq('id', userId);
  }

  Future<String?> fetchAccountStatus() async {
    final userId = _client.auth.currentUser?.id;
    if (userId == null) return null;

    final profile = await _client
        .from('users')
        .select('status')
        .eq('id', userId)
        .maybeSingle();

    return profile?['status'] as String?;
  }

  Future<void> signOut() => _client.auth.signOut();

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

  bool get isSignedIn => _client.auth.currentSession != null;
}

class EmailNotVerifiedException implements Exception {
  final String email;
  EmailNotVerifiedException(this.email);

  @override
  String toString() => 'Email not verified';
}

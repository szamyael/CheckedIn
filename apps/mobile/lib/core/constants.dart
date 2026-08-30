class AppConstants {
  static const qrEventType = 'checkedin_event';
  static const studentIdPattern = r'^0\d{3}-\d{4}$';
  static const studentEmailDomain = '@student.checkedin.local';

  /// Supabase email OTP length (signup, password reset).
  static const emailOtpLength = 8;

  static String studentAuthEmail(String studentId) {
    return '${studentId.toLowerCase()}$studentEmailDomain';
  }

  static String? normalizeStudentId(String raw) {
    final digits = raw.replaceAll(RegExp(r'\D'), '');
    if (digits.length != 8 || !digits.startsWith('0')) return null;
    return '${digits.substring(0, 4)}-${digits.substring(4)}';
  }

  static bool isValidStudentId(String id) {
    return RegExp(studentIdPattern).hasMatch(id);
  }
}

class ParsedStudentId {
  final String? studentId;
  final String? firstName;
  final String? middleName;
  final String? lastName;
  final String? nameExtension;
  final String? program;

  const ParsedStudentId({
    this.studentId,
    this.firstName,
    this.middleName,
    this.lastName,
    this.nameExtension,
    this.program,
  });

  factory ParsedStudentId.fromJson(Map<String, dynamic> json) {
    return ParsedStudentId(
      studentId: json['student_id'] as String?,
      firstName: json['first_name'] as String?,
      middleName: json['middle_name'] as String?,
      lastName: json['last_name'] as String?,
      nameExtension: json['name_extension'] as String?,
      program: json['program'] as String?,
    );
  }
}

class RegistrationDraft {
  String? studentId;
  String? email;
  String? firstName;
  String? middleName;
  String? lastName;
  String? nameExtension;
  String? program;
  String? section;
  int? yearLevel;
  String? idCardImagePath;
  String? avatarImagePath;
  bool avatarFromId = false;
  ParsedStudentId? ocrSnapshot;

  bool get hasRequiredFields =>
      studentId != null &&
      email != null &&
      email!.contains('@') &&
      firstName != null &&
      lastName != null &&
      program != null &&
      yearLevel != null;
}

String formatStudentDisplayName({
  String? firstName,
  String? middleName,
  String? lastName,
  String? nameExtension,
}) {
  final parts = <String>[
    if (firstName != null && firstName.trim().isNotEmpty) firstName.trim(),
    if (middleName != null && middleName.trim().isNotEmpty) middleName.trim(),
    if (lastName != null && lastName.trim().isNotEmpty) lastName.trim(),
    if (nameExtension != null && nameExtension.trim().isNotEmpty)
      nameExtension.trim(),
  ];
  return parts.join(', ');
}

import 'package:checkedin_mobile/core/constants.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('student ID normalization matches web format', () {
    expect(AppConstants.normalizeStudentId('01234567'), '0123-4567');
    expect(AppConstants.isValidStudentId('0123-4567'), isTrue);
    expect(
      AppConstants.studentAuthEmail('0123-4567'),
      '0123-4567@student.checkedin.local',
    );
  });
}

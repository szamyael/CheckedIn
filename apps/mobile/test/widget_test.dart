import 'package:checkedin_mobile/core/constants.dart';
import 'package:checkedin_mobile/services/bingo_service.dart';
import 'package:checkedin_mobile/services/notification_service.dart';
import 'package:checkedin_mobile/widgets/app_logo.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('notification sound is bundled as a Flutter asset', () async {
    final sound = await rootBundle.load('assets/audio/checkdin.mp3.mp3');

    expect(sound.lengthInBytes, greaterThan(0));
    expect(NotificationSoundService.assetPath, 'audio/checkdin.mp3.mp3');
  });

  test('app logo uses the transparent CheckedIn brand asset', () {
    expect(
      AppLogo.assetPath,
      'assets/images/Checkedin_logo_without_background.png',
    );
  });

  test('student ID normalization matches web format', () {
    expect(AppConstants.normalizeStudentId('01234567'), '0123-4567');
    expect(AppConstants.isValidStudentId('0123-4567'), isTrue);
    expect(
      AppConstants.studentAuthEmail('0123-4567'),
      '0123-4567@student.checkedin.local',
    );
  });

  test('an attended event completes its matching bingo cell', () {
    final cells = [
      BingoCellView(id: 'cell-a', position: 0, eventId: 'event-a'),
      BingoCellView(id: 'cell-b', position: 1, eventId: 'event-b'),
    ];

    expect(
      completedBingoCellIds(cells, {'event-b'}),
      {'cell-b'},
    );
  });

  test('counts each completed horizontal and diagonal line', () {
    final board = BingoBoardData(
      cardId: 'card',
      title: 'Campus',
      seasonLabel: '',
      streakThreshold: 3,
      cells: [
        for (var position = 0; position < 9; position++)
          BingoCellView(id: 'cell-$position', position: position),
      ],
      completedCellIds: {
        'cell-0',
        'cell-1',
        'cell-2',
        'cell-4',
        'cell-6',
        'cell-8',
      },
      awards: const [],
    );

    expect(board.completedLines, [
      [0, 1, 2],
      [0, 4, 8],
      [2, 4, 6],
    ]);
  });
}

import 'package:checkedin_mobile/core/constants.dart';
import 'package:checkedin_mobile/core/theme.dart';
import 'package:checkedin_mobile/services/bingo_service.dart';
import 'package:checkedin_mobile/services/notification_service.dart';
import 'package:checkedin_mobile/widgets/app_logo.dart';
import 'package:checkedin_mobile/widgets/appearance_sheet.dart';
import 'package:checkedin_mobile/widgets/student_ui.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('all supported platforms share the app page transition', () {
    final builders = AppTheme.build(
      AppColorTheme.navy,
      Brightness.light,
    ).pageTransitionsTheme.builders;

    expect(
      builders[TargetPlatform.android],
      same(builders[TargetPlatform.iOS]),
    );
    expect(
      builders[TargetPlatform.android],
      same(builders[TargetPlatform.windows]),
    );
  });

  testWidgets('reduced-motion page transitions keep a fade without sliding', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.build(AppColorTheme.navy, Brightness.light),
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context).copyWith(disableAnimations: true),
          child: child!,
        ),
        home: Scaffold(
          body: Builder(
            builder: (context) => TextButton(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const Scaffold(body: Text('Next page')),
                ),
              ),
              child: const Text('Open'),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Open'));
    await tester.pump(const Duration(milliseconds: 80));

    expect(find.byType(FadeTransition), findsWidgets);
    expect(find.byType(SlideTransition), findsNothing);
  });

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

  testWidgets('app brand uses the wordmark only when the title has room', (
    tester,
  ) async {
    Future<void> pumpBrand(double width) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SizedBox(width: width, child: const AppBrand()),
          ),
        ),
      );
    }

    await pumpBrand(240);
    expect(
      find.byWidgetPredicate(
        (widget) =>
            widget is Image &&
            widget.image is AssetImage &&
            (widget.image as AssetImage).assetName ==
                AppBrand.wordmarkAssetPath,
      ),
      findsOneWidget,
    );

    await pumpBrand(180);
    expect(
      find.byWidgetPredicate(
        (widget) =>
            widget is Image &&
            widget.image is AssetImage &&
            (widget.image as AssetImage).assetName == AppLogo.assetPath,
      ),
      findsOneWidget,
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

    expect(completedBingoCellIds(cells, {'event-b'}), {'cell-b'});
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

  testWidgets('shared banners use theme colors in dark mode', (tester) async {
    final theme = AppTheme.build(AppColorTheme.navy, Brightness.dark);

    await tester.pumpWidget(
      MaterialApp(
        theme: theme,
        home: Scaffold(
          body: Column(
            children: [
              const StudentInfoBanner(
                message: 'An informative note.',
                icon: Icons.info_outline,
              ),
              const StudentTealCallout(message: 'A helpful action.'),
            ],
          ),
        ),
      ),
    );

    final banner = tester.widget<Container>(
      find
          .ancestor(
            of: find.text('An informative note.'),
            matching: find.byType(Container),
          )
          .first,
    );
    final bannerDecoration = banner.decoration! as BoxDecoration;
    expect(bannerDecoration.color, theme.colorScheme.tertiaryContainer);
    expect(
      bannerDecoration.border!.top.color,
      theme.colorScheme.outlineVariant,
    );
    expect(
      tester.widget<Icon>(find.byIcon(Icons.info_outline)).color,
      theme.colorScheme.onTertiaryContainer,
    );
    expect(
      tester.widget<Text>(find.text('An informative note.')).style!.color,
      theme.colorScheme.onTertiaryContainer,
    );

    final callout = tester.widget<Ink>(find.byType(Ink));
    expect(
      (callout.decoration! as BoxDecoration).color,
      theme.colorScheme.primaryContainer,
    );
    expect(
      tester.widget<Text>(find.text('A helpful action.')).style!.color,
      theme.colorScheme.onPrimaryContainer,
    );
  });

  testWidgets('appearance sheet offers every color palette', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.build(AppColorTheme.navy, Brightness.light),
        home: Scaffold(
          body: Builder(
            builder: (context) => Center(
              child: ElevatedButton(
                onPressed: () => showAppearanceSheet(context),
                child: const Text('Appearance'),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('Appearance'));
    await tester.pumpAndSettle();

    for (final label in [
      'CheckedIn',
      'Violet',
      'Orange',
      'Maroon',
      'Army Green',
      'Black',
      'Grey',
    ]) {
      expect(find.text(label), findsOneWidget);
    }
    expect(tester.takeException(), isNull);
  });
}

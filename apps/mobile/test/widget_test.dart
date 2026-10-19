import 'dart:math' as math;

import 'package:checkedin_mobile/core/constants.dart';
import 'package:checkedin_mobile/core/theme.dart';
import 'package:checkedin_mobile/services/appearance_service.dart';
import 'package:checkedin_mobile/services/bingo_service.dart';
import 'package:checkedin_mobile/services/notification_service.dart';
import 'package:checkedin_mobile/screens/home/home_screen.dart';
import 'package:checkedin_mobile/widgets/app_logo.dart';
import 'package:checkedin_mobile/widgets/appearance_sheet.dart';
import 'package:checkedin_mobile/widgets/password_requirements.dart';
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

  test(
    'all palettes share web-equivalent surface, border, and action colors',
    () {
      const lightMuted = {
        AppColorTheme.navy: Color(0xFFEEF2F7),
        AppColorTheme.violet: Color(0xFFF1EBF5),
        AppColorTheme.orange: Color(0xFFF5EEE8),
        AppColorTheme.maroon: Color(0xFFF4EAEE),
        AppColorTheme.armyGreen: Color(0xFFEEF0E9),
        AppColorTheme.black: Color(0xFFEFEFEF),
        AppColorTheme.grey: Color(0xFFEDF0F4),
      };
      const lightBorders = {
        AppColorTheme.navy: Color(0xFFD9E1EC),
        AppColorTheme.violet: Color(0xFFE5DCED),
        AppColorTheme.orange: Color(0xFFEEDFD2),
        AppColorTheme.maroon: Color(0xFFEADDE2),
        AppColorTheme.armyGreen: Color(0xFFDFE3D8),
        AppColorTheme.black: Color(0xFFE2E2E2),
        AppColorTheme.grey: Color(0xFFDFE4EA),
      };
      const darkMuted = {
        AppColorTheme.navy: Color(0xFF223452),
        AppColorTheme.violet: Color(0xFF352941),
        AppColorTheme.orange: Color(0xFF3B2D22),
        AppColorTheme.maroon: Color(0xFF38262E),
        AppColorTheme.armyGreen: Color(0xFF2C3625),
        AppColorTheme.black: Color(0xFF2B2B2B),
        AppColorTheme.grey: Color(0xFF2C3744),
      };
      const darkBorders = {
        AppColorTheme.navy: Color(0xFF354A6A),
        AppColorTheme.violet: Color(0xFF554563),
        AppColorTheme.orange: Color(0xFF5B4332),
        AppColorTheme.maroon: Color(0xFF5A3B48),
        AppColorTheme.armyGreen: Color(0xFF46533B),
        AppColorTheme.black: Color(0xFF484848),
        AppColorTheme.grey: Color(0xFF465464),
      };
      const lightActions = {
        AppColorTheme.navy: Color(0xFF1E3A8A),
        AppColorTheme.violet: Color(0xFF68428C),
        AppColorTheme.orange: Color(0xFF9A4E18),
        AppColorTheme.maroon: Color(0xFF7B3047),
        AppColorTheme.armyGreen: Color(0xFF4B6339),
        AppColorTheme.black: Color(0xFF303030),
        AppColorTheme.grey: Color(0xFF526276),
      };
      const darkActions = {
        AppColorTheme.navy: Color(0xFF2F5D9F),
        AppColorTheme.violet: Color(0xFF68428C),
        AppColorTheme.orange: Color(0xFF9A4E18),
        AppColorTheme.maroon: Color(0xFF7B3047),
        AppColorTheme.armyGreen: Color(0xFF4B6339),
        AppColorTheme.black: Color(0xFF484848),
        AppColorTheme.grey: Color(0xFF526276),
      };

      for (final entry in lightMuted.entries) {
        final light = AppTheme.build(entry.key, Brightness.light);
        final dark = AppTheme.build(entry.key, Brightness.dark);
        final lightButton = light.filledButtonTheme.style!;
        final darkButton = dark.filledButtonTheme.style!;

        expect(light.colorScheme.surfaceContainerHighest, entry.value);
        expect(light.colorScheme.outline, lightBorders[entry.key]);
        expect(light.colorScheme.outlineVariant, lightBorders[entry.key]);
        expect(
          lightButton.backgroundColor?.resolve({}),
          lightActions[entry.key],
        );
        expect(lightButton.foregroundColor?.resolve({}), Colors.white);
        expect(dark.colorScheme.surfaceContainerHighest, darkMuted[entry.key]);
        expect(dark.colorScheme.outline, darkBorders[entry.key]);
        expect(dark.colorScheme.outlineVariant, darkBorders[entry.key]);
        expect(darkButton.backgroundColor?.resolve({}), darkActions[entry.key]);
        expect(darkButton.foregroundColor?.resolve({}), Colors.white);
      }
    },
  );

  test('large headings do not force a serif font against the web theme', () {
    final theme = AppTheme.build(AppColorTheme.navy, Brightness.light);

    expect(theme.textTheme.displaySmall?.fontFamily, isNot('serif'));
    expect(theme.textTheme.headlineSmall?.fontFamily, isNot('serif'));
  });

  testWidgets(
    'student page titles do not override the shared sans-serif font',
    (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(body: StudentPageTitle(title: 'Title')),
        ),
      );

      expect(
        tester.widget<Text>(find.text('Title')).style?.fontFamily,
        isNot('serif'),
      );
    },
  );

  testWidgets('student branded surfaces use the active action theme', (
    tester,
  ) async {
    late StudentUi studentUi;
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.build(AppColorTheme.orange, Brightness.dark),
        home: Builder(
          builder: (context) {
            studentUi = StudentUi.of(context);
            return const SizedBox.shrink();
          },
        ),
      ),
    );

    expect(studentUi.actionBackground, const Color(0xFF9A4E18));
    expect(studentUi.actionForeground, Colors.white);
  });

  testWidgets('password requirement success chips use dark semantic colors', (
    tester,
  ) async {
    late StudentUi studentUi;
    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.build(AppColorTheme.orange, Brightness.dark),
        builder: (context, child) {
          studentUi = StudentUi.of(context);
          return child!;
        },
        home: const Scaffold(body: PasswordRequirements(value: 'AB12!xyz')),
      ),
    );

    for (final chip in tester.widgetList<Chip>(find.byType(Chip))) {
      expect(chip.backgroundColor, studentUi.successSurface);
      expect(chip.side?.color, studentUi.successBorder);
      expect(chip.labelStyle?.color, studentUi.success);
    }
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

  testWidgets('attendance steps are centered evenly like the web portal', (
    tester,
  ) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Center(
            child: SizedBox(
              width: 400,
              child: StudentStepIndicator(current: 1),
            ),
          ),
        ),
      ),
    );

    final avatarCenters = tester
        .widgetList<CircleAvatar>(find.byType(CircleAvatar))
        .map((avatar) => tester.getCenter(find.byWidget(avatar)).dx)
        .toList();

    expect(avatarCenters, [250, 350, 450, 550]);
  });

  testWidgets('campus pass flips as one card in both directions', (
    tester,
  ) async {
    await tester.pumpWidget(
      MaterialApp(
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context).copyWith(disableAnimations: false),
          child: child!,
        ),
        home: Scaffold(
          body: Center(
            child: CampusPassCard(
              name: 'Student Name',
              studentId: '0123-4567',
              program: 'Program',
              yearLevel: 1,
              section: 'A',
              avatarUrl: null,
              campusPassToken: null,
              onScan: () {},
            ),
          ),
        ),
      ),
    );

    double cardRotation() {
      final transform = tester.widget<Transform>(
        find
            .descendant(
              of: find.byType(CampusPassCard),
              matching: find.byType(Transform),
            )
            .first,
      );
      return math.atan2(
        -transform.transform.storage[2],
        transform.transform.storage[0],
      );
    }

    Future<double> flipAndMeasure(Finder tapTarget) async {
      await tester.tap(tapTarget);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 250));
      final start = cardRotation();
      await tester.pump(const Duration(milliseconds: 100));
      final end = cardRotation();
      await tester.pumpAndSettle();
      return end - start;
    }

    expect(
      await flipAndMeasure(find.text('TAP CARD TO VIEW STUDENT ID')),
      greaterThan(0),
    );
    expect(find.text('STUDENT IDENTIFICATION'), findsOneWidget);
    expect(await flipAndMeasure(find.text('TAP TO RETURN')), lessThan(0));
    expect(find.text('YOUR CAMPUS PASS'), findsOneWidget);
  });

  test(
    'notification sound preference supports system or CheckedIn mp3',
    () async {
      await AppearanceService.instance.setNotificationSoundPreference(
        NotificationSoundPreference.system,
      );
      expect(
        AppearanceService.instance.notificationSoundPreference,
        NotificationSoundPreference.system,
      );

      await AppearanceService.instance.setNotificationSoundPreference(
        NotificationSoundPreference.checkedInMp3,
      );
      expect(
        AppearanceService.instance.notificationSoundPreference,
        NotificationSoundPreference.checkedInMp3,
      );
    },
  );

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

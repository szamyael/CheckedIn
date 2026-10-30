import 'dart:math' as math;

import 'package:checkedin_mobile/core/constants.dart';
import 'package:checkedin_mobile/core/theme.dart';
import 'package:checkedin_mobile/services/appearance_service.dart';
import 'package:checkedin_mobile/services/bingo_service.dart';
import 'package:checkedin_mobile/services/notification_service.dart';
import 'package:checkedin_mobile/screens/home/home_screen.dart';
import 'package:checkedin_mobile/screens/onboarding/swipe_animated_page.dart';
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

  test('all palettes share the warm-neutral sage CheckedIn identity', () {
    for (final palette in AppColorTheme.values) {
      final light = AppTheme.build(palette, Brightness.light);
      final dark = AppTheme.build(palette, Brightness.dark);
      final lightButton = light.filledButtonTheme.style!;
      final darkButton = dark.filledButtonTheme.style!;

      expect(light.scaffoldBackgroundColor, const Color(0xFFF7F8F7));
      expect(light.colorScheme.surface, const Color(0xFFFFFFFF));
      expect(
        light.colorScheme.surfaceContainerHighest,
        const Color(0xFFF1F3F1),
      );
      expect(light.colorScheme.outline, const Color(0xFFDCE3DD));
      expect(light.colorScheme.onSurfaceVariant, const Color(0xFF6B736E));
      expect(light.colorScheme.secondary, const Color(0xFF3F765F));
      expect(light.colorScheme.tertiary, const Color(0xFF8C672C));
      expect(light.colorScheme.error, const Color(0xFFA2443D));
      expect(light.textTheme.bodySmall?.color, const Color(0xFF6B736E));
      expect(lightButton.backgroundColor?.resolve({}), const Color(0xFF42675B));
      expect(lightButton.foregroundColor?.resolve({}), Colors.white);
      expect(light.colorScheme.primary, const Color(0xFF587D70));
      expect(dark.scaffoldBackgroundColor, const Color(0xFF202722));
      expect(dark.colorScheme.surface, const Color(0xFF29312C));
      expect(dark.colorScheme.surfaceContainerHighest, const Color(0xFF343D37));
      expect(dark.colorScheme.outline, const Color(0xFF4A554D));
      expect(dark.colorScheme.onSurfaceVariant, const Color(0xFFB9C3BC));
      expect(dark.colorScheme.primary, const Color(0xFFA8C6B9));
      expect(dark.colorScheme.onPrimary, const Color(0xFF202722));
      expect(dark.colorScheme.secondary, const Color(0xFF8AC7A5));
      expect(dark.colorScheme.onSecondary, const Color(0xFF202722));
      expect(dark.colorScheme.tertiary, const Color(0xFFD7B876));
      expect(dark.colorScheme.onTertiary, const Color(0xFF202722));
      expect(dark.colorScheme.error, const Color(0xFFF09084));
      expect(dark.textTheme.bodySmall?.color, const Color(0xFFB9C3BC));
      expect(darkButton.backgroundColor?.resolve({}), const Color(0xFF42675B));
      expect(darkButton.foregroundColor?.resolve({}), Colors.white);
    }
  });

  test('shared cards use restrained borders and accessible controls', () {
    final theme = AppTheme.build(AppColorTheme.navy, Brightness.light);
    final cardShape = theme.cardTheme.shape! as RoundedRectangleBorder;

    expect(cardShape.borderRadius, BorderRadius.circular(16));
    expect(
      cardShape.side.color,
      const Color(0xFFDCE3DD).withValues(alpha: 0.45),
    );
    expect(theme.filledButtonTheme.style?.minimumSize?.resolve({})?.height, 44);
    expect(theme.inputDecorationTheme.fillColor, const Color(0xFFF1F3F1));
  });

  test('form fields use consistent 12px corners and visible borders', () {
    for (final brightness in [Brightness.light, Brightness.dark]) {
      final theme = AppTheme.build(AppColorTheme.navy, brightness);
      final input = theme.inputDecorationTheme;
      final enabled = input.enabledBorder! as OutlineInputBorder;
      final focused = input.focusedBorder! as OutlineInputBorder;

      expect(enabled.borderRadius, BorderRadius.circular(12));
      expect(focused.borderRadius, BorderRadius.circular(12));
      expect(
        enabled.borderSide.color,
        brightness == Brightness.dark
            ? const Color(0xFF7B8A80)
            : const Color(0xFF7F8C85),
      );
    }
  });

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

    expect(studentUi.actionBackground, const Color(0xFF42675B));
    expect(studentUi.actionForeground, Colors.white);
  });

  testWidgets('student cards and tooltips do not use white glow shadows', (
    tester,
  ) async {
    for (final brightness in [Brightness.light, Brightness.dark]) {
      final theme = AppTheme.build(AppColorTheme.navy, brightness);
      await tester.pumpWidget(
        MaterialApp(
          theme: theme,
          home: const Scaffold(body: StudentCard(child: Text('Card'))),
        ),
      );

      final card = tester
          .widgetList<Container>(find.byType(Container))
          .map((container) => container.decoration)
          .whereType<BoxDecoration>()
          .singleWhere(
            (decoration) => decoration.boxShadow?.isNotEmpty == true,
          );
      expect(card.boxShadow, hasLength(1));

      final tooltip = theme.tooltipTheme.decoration! as BoxDecoration;
      expect(tooltip.boxShadow, hasLength(1));
    }
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

  testWidgets('reduced-motion page transitions skip movement and fading', (
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
    await tester.pumpAndSettle();

    expect(find.text('Next page'), findsOneWidget);
    expect(find.byType(FadeTransition), findsNothing);
    expect(find.byType(SlideTransition), findsNothing);
  });

  testWidgets('reduced motion disables onboarding parallax', (tester) async {
    final controller = PageController();
    addTearDown(controller.dispose);
    await tester.pumpWidget(
      MaterialApp(
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context).copyWith(disableAnimations: true),
          child: child!,
        ),
        home: Scaffold(
          body: SwipeAnimatedPage(
            controller: controller,
            index: 0,
            child: const Text('Onboarding page'),
          ),
        ),
      ),
    );

    expect(find.text('Onboarding page'), findsOneWidget);
    final onboardingPage = find.byType(SwipeAnimatedPage);
    expect(
      find.descendant(of: onboardingPage, matching: find.byType(Opacity)),
      findsNothing,
    );
    expect(
      find.descendant(of: onboardingPage, matching: find.byType(Transform)),
      findsNothing,
    );
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

  testWidgets('appearance sheet keeps display and sound settings', (
    tester,
  ) async {
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

    expect(find.text('Light'), findsOneWidget);
    expect(find.text('Dark'), findsOneWidget);
    expect(find.text('System'), findsNWidgets(2));
    expect(find.text('NOTIFICATION SOUND'), findsOneWidget);
    expect(find.text('COLOR THEME'), findsNothing);
    expect(tester.takeException(), isNull);
  });
}

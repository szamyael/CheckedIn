import 'package:flutter/material.dart';
import '../services/appearance_service.dart';

Future<void> showAppearanceSheet(BuildContext context) =>
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (_) => const _AppearanceSheet(),
    );

class _AppearanceSheet extends StatelessWidget {
  const _AppearanceSheet();

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
    animation: AppearanceService.instance,
    builder: (context, _) {
      final appearance = AppearanceService.instance;
      return SafeArea(
        child: ConstrainedBox(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.sizeOf(context).height * 0.9,
          ),
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 28),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Appearance',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Personalize the app without changing your account.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                  const SizedBox(height: 24),
                  const _SectionLabel('THEME MODE'),
                  const SizedBox(height: 10),
                  Row(
                    children: ThemeMode.values
                        .map(
                          (mode) => Expanded(
                            child: Padding(
                              padding: EdgeInsets.only(
                                right: mode == ThemeMode.system ? 0 : 8,
                              ),
                              child: ChoiceChip(
                                label: Text(_modeLabel(mode)),
                                selected: appearance.themeMode == mode,
                                onSelected: (_) =>
                                    appearance.setThemeMode(mode),
                              ),
                            ),
                          ),
                        )
                        .toList(),
                  ),
                  const SizedBox(height: 24),
                  const _SectionLabel('NOTIFICATION SOUND'),
                  const SizedBox(height: 10),
                  ...NotificationSoundPreference.values.map(
                    (preference) => RadioListTile<NotificationSoundPreference>(
                      contentPadding: EdgeInsets.zero,
                      title: Text(_notificationSoundLabel(preference)),
                      subtitle: Text(
                        preference == NotificationSoundPreference.system
                            ? 'Use the device default notification sound.'
                            : 'Play the CheckedIn custom sound.',
                      ),
                      value: preference,
                      groupValue: appearance.notificationSoundPreference,
                      onChanged: (_) =>
                          appearance.setNotificationSoundPreference(preference),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
    },
  );

  static String _modeLabel(ThemeMode mode) => switch (mode) {
    ThemeMode.light => 'Light',
    ThemeMode.dark => 'Dark',
    ThemeMode.system => 'System',
  };

  static String _notificationSoundLabel(
    NotificationSoundPreference preference,
  ) => switch (preference) {
    NotificationSoundPreference.system => 'System',
    NotificationSoundPreference.checkedInMp3 => 'CheckedIn MP3',
  };
}

class _SectionLabel extends StatelessWidget {
  final String value;
  const _SectionLabel(this.value);
  @override
  Widget build(BuildContext context) => Text(
    value,
    style: Theme.of(context).textTheme.labelSmall?.copyWith(
      fontWeight: FontWeight.bold,
      letterSpacing: 1.1,
    ),
  );
}

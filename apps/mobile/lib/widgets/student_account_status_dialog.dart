import 'package:flutter/material.dart';
import 'package:tabler_icons_plus/tabler_icons_plus.dart';

class StudentAccountStatusDialog extends StatelessWidget {
  const StudentAccountStatusDialog({
    super.key,
    required this.status,
    required this.reason,
    this.onRegisterAgain,
  });

  final String status;
  final String? reason;
  final VoidCallback? onRegisterAgain;

  String get _statusLabel => status.replaceAll('_', ' ');

  String get _title {
    if (status == 'needs_reregistration') return 'Registration needs changes';
    return 'Account $_statusLabel';
  }

  @override
  Widget build(BuildContext context) {
    final requiresReregistration = status == 'needs_reregistration';
    final colors = Theme.of(context).colorScheme;
    return AlertDialog(
      icon: Icon(
        requiresReregistration ? TablerIcons.alertTriangle : TablerIcons.ban,
        color: requiresReregistration
            ? colors.tertiary
            : colors.error,
      ),
      title: Text(_title),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              requiresReregistration
                  ? 'An administrator has asked you to register again. Review the reason and submit your application again.'
                  : 'Your account is currently $_statusLabel, so you cannot sign in.',
            ),
            const SizedBox(height: 16),
            const Text(
              'Account status details',
              style: TextStyle(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            Text(
              reason?.trim().isNotEmpty == true
                  ? reason!
                  : 'No reason was provided.',
            ),
            const SizedBox(height: 16),
            const Text(
              "If you have concerns, please visit your Department's Organization Office to address your account status.",
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('Close'),
        ),
        if (requiresReregistration && onRegisterAgain != null)
          FilledButton(
            onPressed: onRegisterAgain,
            child: const Text('Register again'),
          ),
      ],
    );
  }
}

class StudentRegistrationCompleteDialog extends StatelessWidget {
  const StudentRegistrationCompleteDialog({
    super.key,
    required this.onContinue,
  });

  final VoidCallback onContinue;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      icon: const Icon(TablerIcons.circleCheck),
      title: const Text('Registration complete'),
      content: const Text(
        'Your account is under review and waiting for approval. '
        'Verify your email to finish setting up your account.',
      ),
      actions: [
        FilledButton(
          onPressed: () {
            Navigator.of(context).pop();
            onContinue();
          },
          child: const Text('Continue to email verification'),
        ),
      ],
    );
  }
}

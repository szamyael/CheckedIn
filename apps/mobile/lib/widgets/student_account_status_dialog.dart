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
    final label = _statusLabel;
    return 'Account ${label[0].toUpperCase()}${label.substring(1)}';
  }

  @override
  Widget build(BuildContext context) {
    final requiresReregistration = status == 'needs_reregistration';
    return AlertDialog(
      icon: Icon(
        requiresReregistration ? TablerIcons.alertTriangle : TablerIcons.ban,
        color: requiresReregistration
            ? Colors.orange.shade800
            : Colors.red.shade700,
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

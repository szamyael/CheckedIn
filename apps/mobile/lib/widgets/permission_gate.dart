import 'package:flutter/material.dart';

import '../services/permission_service.dart';
import 'student_ui.dart';

class PermissionBlockedPanel extends StatelessWidget {
  final AppPermission permission;
  final VoidCallback onRetry;

  const PermissionBlockedPanel({
    super.key,
    required this.permission,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final service = PermissionService.instance;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: StudentCard(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Icon(
                permission == AppPermission.camera
                    ? Icons.photo_camera_outlined
                    : Icons.location_on_outlined,
                size: 40,
                color: StudentUi.teal,
              ),
              const SizedBox(height: 12),
              Text(
                service.title(permission),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              Text(
                service.rationale(permission),
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall,
              ),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: onRetry,
                child: const Text('Allow access'),
              ),
              const SizedBox(height: 8),
              OutlinedButton(
                onPressed: () =>
                    service.openSettings(type: permission),
                child: const Text('Open settings'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:permission_handler/permission_handler.dart';

enum AppPermission {
  camera,
  location,
}

class PermissionService {
  PermissionService._();
  static final PermissionService instance = PermissionService._();

  Permission _nativePermission(AppPermission type) {
    switch (type) {
      case AppPermission.camera:
        return Permission.camera;
      case AppPermission.location:
        return Permission.locationWhenInUse;
    }
  }

  String title(AppPermission type) {
    switch (type) {
      case AppPermission.camera:
        return 'Camera access needed';
      case AppPermission.location:
        return 'Location access needed';
    }
  }

  String rationale(AppPermission type) {
    switch (type) {
      case AppPermission.camera:
        return 'CheckedIn uses your camera to scan your student ID during registration, '
            'read event QR codes, and capture attendance selfies.';
      case AppPermission.location:
        return 'CheckedIn uses your location to confirm you are at the event venue '
            'before you can check in.';
    }
  }

  String settingsHint(AppPermission type) {
    switch (type) {
      case AppPermission.camera:
        return 'Open Settings → CheckedIn → Permissions → allow Camera.';
      case AppPermission.location:
        return 'Open Settings → CheckedIn → Permissions → allow Location, '
            'and make sure GPS is turned on.';
    }
  }

  Future<bool> isGranted(AppPermission type) async {
    switch (type) {
      case AppPermission.camera:
        return _nativePermission(type).isGranted;
      case AppPermission.location:
        final permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied ||
            permission == LocationPermission.deniedForever) {
          return false;
        }
        return await Geolocator.isLocationServiceEnabled();
    }
  }

  Future<PermissionRequestResult> request(AppPermission type) async {
    switch (type) {
      case AppPermission.camera:
        final status = await _nativePermission(type).request();
        if (status.isGranted) {
          return PermissionRequestResult.granted;
        }
        if (status.isPermanentlyDenied) {
          return PermissionRequestResult.permanentlyDenied;
        }
        return PermissionRequestResult.denied;

      case AppPermission.location:
        final servicesEnabled = await Geolocator.isLocationServiceEnabled();
        if (!servicesEnabled) {
          return PermissionRequestResult.locationServicesDisabled;
        }

        var permission = await Geolocator.checkPermission();
        if (permission == LocationPermission.denied) {
          permission = await Geolocator.requestPermission();
        }

        if (permission == LocationPermission.always ||
            permission == LocationPermission.whileInUse) {
          return PermissionRequestResult.granted;
        }
        if (permission == LocationPermission.deniedForever) {
          return PermissionRequestResult.permanentlyDenied;
        }
        return PermissionRequestResult.denied;
    }
  }

  /// Returns true when the permission is ready to use.
  Future<bool> ensure(
    BuildContext context,
    AppPermission type, {
    bool showRationaleFirst = false,
  }) async {
    if (await isGranted(type)) return true;

    if (showRationaleFirst && context.mounted) {
      final proceed = await showPermissionRationaleDialog(context, type);
      if (!proceed) return false;
    }

    final result = await request(type);
    if (result == PermissionRequestResult.granted) return true;

    if (!context.mounted) return false;
    await showPermissionDeniedDialog(context, type, result: result);
    return false;
  }

  Future<void> openSettings({AppPermission? type}) async {
    if (type == AppPermission.location) {
      final servicesEnabled = await Geolocator.isLocationServiceEnabled();
      if (!servicesEnabled) {
        await Geolocator.openLocationSettings();
        return;
      }
    }
    await openAppSettings();
  }

  Future<bool> showPermissionRationaleDialog(
    BuildContext context,
    AppPermission type,
  ) async {
    final choice = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(title(type)),
        content: Text(rationale(type)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Not now'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Continue'),
          ),
        ],
      ),
    );
    return choice == true;
  }

  Future<void> showPermissionDeniedDialog(
    BuildContext context,
    AppPermission type, {
    PermissionRequestResult? result,
  }) async {
    final isLocationOff =
        result == PermissionRequestResult.locationServicesDisabled;
    final body = isLocationOff
        ? 'Location services are turned off on this device. Enable GPS in system settings, '
            'then allow CheckedIn to use your location.'
        : '${rationale(type)}\n\n${settingsHint(type)}';

    await showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: Text(isLocationOff ? 'Turn on location' : title(type)),
        content: Text(body),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(ctx);
              await openSettings(type: type);
            },
            child: Text(isLocationOff ? 'Open location settings' : 'Open settings'),
          ),
        ],
      ),
    );
  }
}

enum PermissionRequestResult {
  granted,
  denied,
  permanentlyDenied,
  locationServicesDisabled,
}

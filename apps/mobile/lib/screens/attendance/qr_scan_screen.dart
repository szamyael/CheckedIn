import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../services/attendance_service.dart';
import '../../services/permission_service.dart';
import '../../services/screenshot_guard_service.dart';
import '../../widgets/permission_gate.dart';
import '../../widgets/student_ui.dart';

class QrScanScreen extends StatefulWidget {
  const QrScanScreen({super.key});

  @override
  State<QrScanScreen> createState() => _QrScanScreenState();
}

class _QrScanScreenState extends State<QrScanScreen> {
  final _attendance = AttendanceService();
  bool _handled = false;
  bool _cameraReady = false;
  bool _cameraBlocked = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    ScreenshotGuardService.instance.beginProtectedSession(reset: true);
    WidgetsBinding.instance.addPostFrameCallback((_) => _ensureCamera());
  }

  Future<void> _ensureCamera() async {
    final granted = await PermissionService.instance.ensure(
      context,
      AppPermission.camera,
    );
    if (!mounted) return;
    setState(() {
      _cameraReady = granted;
      _cameraBlocked = !granted;
    });
  }

  void _onDetect(BarcodeCapture capture) {
    if (_handled) return;
    final raw = capture.barcodes.firstOrNull?.rawValue;
    if (raw == null) return;

    final token = _attendance.parseQrToken(raw);
    if (token == null) {
      setState(() => _error = 'Invalid QR code. Scan a CheckedIn event code.');
      return;
    }

    _handled = true;
    context.push('/attendance/resolve', extra: token);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scan Event QR')),
      body: Column(
        children: [
          Expanded(
            child: _cameraReady
                ? MobileScanner(onDetect: _onDetect)
                : _cameraBlocked
                    ? PermissionBlockedPanel(
                        permission: AppPermission.camera,
                        onRetry: () {
                          setState(() => _cameraBlocked = false);
                          _ensureCamera();
                        },
                      )
                    : const Center(child: CircularProgressIndicator()),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              children: [
                if (_error != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: StudentErrorBanner(message: _error!),
                  ),
                Text(
                  'Point your camera at the event QR code. Scan once to check in, or scan again after check-in to check out (no OTP or selfie needed for checkout).',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

import 'package:screen_capture_event/screen_capture_event.dart';

/// Tracks screenshot and screen-recording activity during the attendance flow.
class ScreenshotGuardService {
  ScreenshotGuardService._();
  static final ScreenshotGuardService instance = ScreenshotGuardService._();

  ScreenCaptureEvent _createListener() => ScreenCaptureEvent();
  ScreenCaptureEvent? _listener;
  int _screenshotCount = 0;
  bool _screenRecording = false;
  bool _active = false;

  int get screenshotCount => _screenshotCount;
  bool get screenRecording => _screenRecording;
  bool get isCompromised => _screenshotCount > 0 || _screenRecording;

  Map<String, dynamic> integrityPayload() => {
        'screenshot_events': _screenshotCount,
        'screen_recording': _screenRecording,
        'captured_at_ms': DateTime.now().toUtc().millisecondsSinceEpoch,
        'live_camera_capture': true,
      };

  Future<void> beginProtectedSession({bool reset = false}) async {
    if (_active) {
      if (reset) {
        _screenshotCount = 0;
        _screenRecording = false;
      }
      return;
    }
    _active = true;
    _screenshotCount = 0;
    _screenRecording = false;

    _listener = _createListener();
    _listener!.addScreenShotListener((_) {
      _screenshotCount++;
    });
    _listener!.addScreenRecordListener((recording) {
      _screenRecording = recording;
    });
    _listener!.watch();

    try {
      await _listener!.preventAndroidScreenShot(true);
    } catch (_) {
      // iOS does not support this API.
    }
  }

  Future<void> endProtectedSession() async {
    if (!_active) return;
    _active = false;

    try {
      await _listener?.preventAndroidScreenShot(false);
    } catch (_) {}

    _listener?.dispose();
    _listener = null;
    _screenshotCount = 0;
    _screenRecording = false;
  }

  String? validateBeforeCapture() {
    if (!_active) return null;
    if (_screenRecording) {
      return 'Screen recording is active. Stop recording to check in.';
    }
    if (_screenshotCount > 0) {
      return 'A screenshot was detected during check-in. Take a new live selfie without capturing the screen.';
    }
    return null;
  }
}

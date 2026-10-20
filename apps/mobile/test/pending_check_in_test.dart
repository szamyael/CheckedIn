import 'package:flutter_test/flutter_test.dart';
import 'package:checkedin_mobile/models/pending_check_in.dart';
import 'package:checkedin_mobile/services/attendance_service.dart';
import 'package:checkedin_mobile/services/connectivity_service.dart';

void main() {
  test('keeps the QR-scan device timezone offset in the offline queue', () {
    final item = PendingCheckIn(
      id: 'submission-1',
      qrToken: 'qr-token',
      latitude: 0,
      longitude: 0,
      localSelfiePath: 'selfie.jpg',
      capturedAt: DateTime.utc(2026, 10, 14, 1, 18, 52),
      deviceUtcOffsetMinutes: 480,
    );

    final restored = PendingCheckIn.fromJson(item.toJson());

    expect(restored.deviceUtcOffsetMinutes, 480);
  });

  test(
    'loads queued submissions created before device offsets were recorded',
    () {
      const oldQueueItem = {
        'id': 'legacy-1',
        'qr_token': 'qr-token',
        'latitude': 0,
        'longitude': 0,
        'local_selfie_path': 'selfie.jpg',
        'captured_at': '2026-10-14T01:18:52.000Z',
      };

      final restored = PendingCheckIn.fromJson(oldQueueItem);

      expect(restored.deviceUtcOffsetMinutes, isNull);
    },
  );

  test('recognizes an expired attendance OTP as recoverable', () {
    expect(
      AttendanceService.isRecoverableOtpError(
        'Invalid or expired attendance OTP',
      ),
      isTrue,
    );
    expect(
      AttendanceService.isRecoverableOtpError('QR code has expired'),
      isFalse,
    );
  });

  test('does not require GPS for online event venue metadata', () {
    expect(
      AttendanceService.requiresLocationForCheckIn({
        'requires_location': true,
        'venue_name': ' Online Event ',
      }),
      isFalse,
    );
    expect(
      AttendanceService.requiresLocationForCheckIn({
        'requires_location': true,
        'venue_name': 'Main Hall',
      }),
      isTrue,
    );
    expect(
      AttendanceService.requiresLocationForCheckIn({
        'requires_location': true,
        'venue_name': 'Online Event - Google Meet',
      }),
      isFalse,
    );
  });

  test('treats an HTTP response from Supabase as reachable internet', () {
    expect(ConnectivityService.isReachableHttpStatus(401), isTrue);
    expect(ConnectivityService.isReachableHttpStatus(204), isTrue);
    expect(ConnectivityService.isReachableHttpStatus(500), isFalse);
  });
}

enum PendingCheckInStatus { pending, syncing, failed }

class PendingCheckIn {
  final String id;
  final String qrToken;
  final double latitude;
  final double longitude;
  final String localSelfiePath;
  final DateTime capturedAt;
  final PendingCheckInStatus status;
  final String? lastError;
  final String? eventTitleHint;
  final String? eventId;
  final String? otpCode;
  final Map<String, dynamic>? captureIntegrity;

  const PendingCheckIn({
    required this.id,
    required this.qrToken,
    required this.latitude,
    required this.longitude,
    required this.localSelfiePath,
    required this.capturedAt,
    this.status = PendingCheckInStatus.pending,
    this.lastError,
    this.eventTitleHint,
    this.eventId,
    this.otpCode,
    this.captureIntegrity,
  });

  PendingCheckIn copyWith({
    PendingCheckInStatus? status,
    String? lastError,
    String? eventTitleHint,
    String? eventId,
    String? otpCode,
    Map<String, dynamic>? captureIntegrity,
  }) {
    return PendingCheckIn(
      id: id,
      qrToken: qrToken,
      latitude: latitude,
      longitude: longitude,
      localSelfiePath: localSelfiePath,
      capturedAt: capturedAt,
      status: status ?? this.status,
      lastError: lastError,
      eventTitleHint: eventTitleHint ?? this.eventTitleHint,
      eventId: eventId ?? this.eventId,
      otpCode: otpCode ?? this.otpCode,
      captureIntegrity: captureIntegrity ?? this.captureIntegrity,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'qr_token': qrToken,
        'latitude': latitude,
        'longitude': longitude,
        'local_selfie_path': localSelfiePath,
        'captured_at': capturedAt.toUtc().toIso8601String(),
        'status': status.name,
        'last_error': lastError,
        'event_title_hint': eventTitleHint,
        'event_id': eventId,
        'otp_code': otpCode,
        'capture_integrity': captureIntegrity,
      };

  factory PendingCheckIn.fromJson(Map<String, dynamic> json) {
    return PendingCheckIn(
      id: json['id'] as String,
      qrToken: json['qr_token'] as String,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      localSelfiePath: json['local_selfie_path'] as String,
      capturedAt: DateTime.parse(json['captured_at'] as String),
      status: PendingCheckInStatus.values.byName(
        json['status'] as String? ?? 'pending',
      ),
      lastError: json['last_error'] as String?,
      eventTitleHint: json['event_title_hint'] as String?,
      eventId: json['event_id'] as String?,
      otpCode: json['otp_code'] as String?,
      captureIntegrity: json['capture_integrity'] is Map
          ? Map<String, dynamic>.from(json['capture_integrity'] as Map)
          : null,
    );
  }
}

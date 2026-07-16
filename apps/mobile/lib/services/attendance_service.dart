import 'dart:convert';
import 'dart:io';

import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/constants.dart';
import '../core/selfie_integrity_analyzer.dart';
import '../models/pending_check_in.dart';
import 'auth_service.dart';
import 'connectivity_service.dart';
import 'local_cache_service.dart';
import 'offline_storage_service.dart';
import 'screenshot_guard_service.dart';

enum CheckInOutcome { synced, queuedOffline }

class CheckInSubmission {
  final CheckInOutcome outcome;
  final Map<String, dynamic>? serverResult;
  final PendingCheckIn? pending;

  const CheckInSubmission.synced(this.serverResult)
      : outcome = CheckInOutcome.synced,
        pending = null;

  const CheckInSubmission.queuedOffline(this.pending)
      : outcome = CheckInOutcome.queuedOffline,
        serverResult = null;
}

class AttendanceService {
  SupabaseClient get _client => Supabase.instance.client;

  String? get currentUserId => AuthService.instance.currentUserId;

  Future<bool> hasConnectivity() => ConnectivityService.instance.refresh();

  Future<Position> getCurrentPosition() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      throw Exception(
        'Location services are disabled. Open system settings and enable GPS.',
      );
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      throw Exception('Location permission was denied. Allow location to check in.');
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception(
        'Location permission is permanently denied. Enable it in app settings.',
      );
    }

    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 0,
        timeLimit: Duration(seconds: 25),
      ),
    );
  }

  Future<String> uploadSelfie(File selfieFile) async {
    final userId = AuthService.instance.currentUserId;
    if (userId == null || AuthService.instance.isOfflineMode) {
      throw Exception('Selfie upload requires an online session.');
    }
    final path = '$userId/${DateTime.now().millisecondsSinceEpoch}.jpg';
    await _client.storage.from('selfies').upload(path, selfieFile);
    return path;
  }

  String? parseQrToken(String raw) {
    try {
      final data = jsonDecode(raw) as Map<String, dynamic>;
      if (data['type'] == AppConstants.qrEventType) {
        return data['qr_token'] as String?;
      }
    } catch (_) {
      if (RegExp(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        caseSensitive: false,
      ).hasMatch(raw)) {
        return raw;
      }
    }
    return null;
  }

  Future<Map<String, dynamic>> fetchCheckInMeta(String qrToken) async {
    final cacheKey = CacheKeys.checkInMeta(qrToken);

    try {
      final response = await _client.functions.invoke(
        'event-check-in-meta',
        body: {'qr_token': qrToken},
      );
      if (response.status != 200) {
        throw Exception('Could not load event details');
      }
      final meta = Map<String, dynamic>.from(response.data as Map);
      await LocalCacheService.instance.writeJson(cacheKey, meta);
      return meta;
    } catch (_) {
      final cached = await LocalCacheService.instance.readJson(
        cacheKey,
        (raw) {
          if (raw is! Map) return null;
          return Map<String, dynamic>.from(raw);
        },
      );
      if (cached != null) return cached;

      return {
        'requires_otp': false,
        'title': 'Event (offline)',
        'offline_fallback': true,
      };
    }
  }

  /// Server-side geofence check. Must pass before OTP / selfie.
  Future<Map<String, dynamic>> verifyLocationForCheckIn({
    required String qrToken,
    required double latitude,
    required double longitude,
  }) async {
    final cacheKey = CacheKeys.checkInMeta(qrToken);

    try {
      final response = await _client.functions.invoke(
        'event-check-in-meta',
        body: {
          'qr_token': qrToken,
          'latitude': latitude,
          'longitude': longitude,
        },
      );

      final data = response.data is Map
          ? Map<String, dynamic>.from(response.data as Map)
          : <String, dynamic>{};

      if (response.status == 200 && data['location_ok'] == true) {
        await LocalCacheService.instance.writeJson(cacheKey, data);
        return data;
      }

      // Non-200 with body still carries distance / error for the UI.
      if (data.isNotEmpty) {
        data['location_ok'] = false;
        return data;
      }

      throw Exception(
        data['error']?.toString() ??
            'Location verification failed (${response.status})',
      );
    } catch (e) {
      // Offline: verify locally against cached venue coordinates.
      final cached = await LocalCacheService.instance.readJson(
        cacheKey,
        (raw) {
          if (raw is! Map) return null;
          return Map<String, dynamic>.from(raw);
        },
      );

      final venueLat = (cached?['latitude'] as num?)?.toDouble();
      final venueLng = (cached?['longitude'] as num?)?.toDouble();
      final radius = (cached?['location_radius_m'] as num?)?.toDouble() ?? 100;

      if (venueLat == null || venueLng == null) {
        throw Exception(
          'Cannot verify location offline without cached event venue. '
          'Connect once near the event, then retry.',
        );
      }

      final distanceM = Geolocator.distanceBetween(
        latitude,
        longitude,
        venueLat,
        venueLng,
      );

      if (distanceM > radius) {
        return {
          ...?cached,
          'location_ok': false,
          'distance_m': distanceM.round(),
          'allowed_radius_m': radius.round(),
          'error':
              'You are outside the event location (${distanceM.round()}m away; allowed ${radius.round()}m)',
        };
      }

      return {
        ...?cached,
        'location_ok': true,
        'distance_m': distanceM.round(),
        'allowed_radius_m': radius.round(),
      };
    }
  }

  Future<Map<String, dynamic>> checkIn({
    required String qrToken,
    required double latitude,
    required double longitude,
    required String selfiePath,
    DateTime? clientCheckedInAt,
    String? otpCode,
    String? eventId,
    Map<String, dynamic>? captureIntegrity,
  }) async {
    final body = <String, dynamic>{
      'qr_token': qrToken,
      'latitude': latitude,
      'longitude': longitude,
      'selfie_path': selfiePath,
    };
    if (clientCheckedInAt != null) {
      body['client_checked_in_at'] = clientCheckedInAt.toUtc().toIso8601String();
    }
    if (otpCode != null && otpCode.isNotEmpty) {
      body['otp_code'] = otpCode;
    }
    if (eventId != null && eventId.isNotEmpty) {
      body['event_id'] = eventId;
    }
    if (captureIntegrity != null) {
      body['capture_integrity'] = captureIntegrity;
    }

    final response = await _client.functions.invoke('check-in', body: body);

    if (response.status != 200) {
      final data = response.data;
      final err = data is Map ? data['error'] : 'Check-in failed';
      throw Exception(err ?? 'Check-in failed');
    }

    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> buildCaptureIntegrity(File selfieFile) async {
    final guard = ScreenshotGuardService.instance;
    final analysis = await SelfieIntegrityAnalyzer.analyze(selfieFile);

    return {
      ...guard.integrityPayload(),
      'analysis_issues': analysis.issues,
    };
  }

  Future<CheckInSubmission> submitCheckIn({
    required String qrToken,
    required double latitude,
    required double longitude,
    required File selfieFile,
    String? otpCode,
    String? eventId,
    String? eventTitleHint,
  }) async {
    final capturedAt = DateTime.now().toUtc();

    final guardError = ScreenshotGuardService.instance.validateBeforeCapture();
    if (guardError != null) {
      throw Exception(guardError);
    }

    final analysis = await SelfieIntegrityAnalyzer.analyze(selfieFile);
    if (analysis.blocksCheckIn) {
      throw Exception(
        'This photo looks like a screenshot. Use the camera to take a live selfie.',
      );
    }

    final captureIntegrity = await buildCaptureIntegrity(selfieFile);

    if (await OfflineStorageService.instance.hasPendingForQrToken(qrToken)) {
      throw Exception(
        'You already have a pending check-in for this event waiting to sync.',
      );
    }

    final online = await hasConnectivity();
    final canSyncNow =
        online && !AuthService.instance.isOfflineMode && _client.auth.currentSession != null;

    if (canSyncNow) {
      try {
        final selfiePath = await uploadSelfie(selfieFile);
        final result = await checkIn(
          qrToken: qrToken,
          latitude: latitude,
          longitude: longitude,
          selfiePath: selfiePath,
          otpCode: otpCode,
          eventId: eventId,
          captureIntegrity: captureIntegrity,
        );
        return CheckInSubmission.synced(result);
      } catch (e) {
        if (!_isNetworkError(e)) rethrow;
      }
    }

    final pending = await OfflineStorageService.instance.enqueue(
      qrToken: qrToken,
      latitude: latitude,
      longitude: longitude,
      selfieFile: selfieFile,
      capturedAt: capturedAt,
      eventTitleHint: eventTitleHint,
      eventId: eventId,
      otpCode: otpCode,
      captureIntegrity: captureIntegrity,
    );
    return CheckInSubmission.queuedOffline(pending);
  }

  bool _isNetworkError(Object e) {
    final message = e.toString().toLowerCase();
    return message.contains('socket') ||
        message.contains('network') ||
        message.contains('connection') ||
        message.contains('timeout') ||
        message.contains('failed host lookup') ||
        message.contains('clientexception');
  }
}

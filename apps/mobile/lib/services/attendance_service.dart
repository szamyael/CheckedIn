import 'dart:convert';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../core/constants.dart';
import '../models/pending_check_in.dart';
import 'offline_storage_service.dart';
import 'screenshot_guard_service.dart';
import '../core/selfie_integrity_analyzer.dart';

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

  String? get currentUserId => _client.auth.currentUser?.id;

  Future<bool> hasConnectivity() async {
    final results = await Connectivity().checkConnectivity();
    return results.any((r) => r != ConnectivityResult.none);
  }

  Future<Position> getCurrentPosition() async {
    final enabled = await Geolocator.isLocationServiceEnabled();
    if (!enabled) {
      throw Exception('Location services are disabled. Please enable GPS.');
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied ||
        permission == LocationPermission.deniedForever) {
      throw Exception('Location permission is required for attendance.');
    }

    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
      ),
    );
  }

  Future<String> uploadSelfie(File selfieFile) async {
    final userId = _client.auth.currentUser!.id;
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
    final response = await _client.functions.invoke(
      'event-check-in-meta',
      body: {'qr_token': qrToken},
    );
    if (response.status != 200) {
      throw Exception('Could not load event details');
    }
    return Map<String, dynamic>.from(response.data as Map);
  }

  Future<Map<String, dynamic>> checkIn({
    required String qrToken,
    required double latitude,
    required double longitude,
    required String selfiePath,
    DateTime? clientCheckedInAt,
    String? otpCode,
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

    if (online) {
      try {
        final selfiePath = await uploadSelfie(selfieFile);
        final result = await checkIn(
          qrToken: qrToken,
          latitude: latitude,
          longitude: longitude,
          selfiePath: selfiePath,
          otpCode: otpCode,
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

import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

import '../models/pending_check_in.dart';
import 'attendance_service.dart';
import 'offline_storage_service.dart';

class OfflineSyncService extends ChangeNotifier {
  OfflineSyncService._();
  static final OfflineSyncService instance = OfflineSyncService._();

  final _storage = OfflineStorageService.instance;
  final _attendance = AttendanceService();
  bool _syncing = false;
  List<PendingCheckIn> _pending = [];

  List<PendingCheckIn> get pending => List.unmodifiable(_pending);
  int get pendingCount => _pending.length;
  bool get isSyncing => _syncing;

  Future<void> init() async {
    await refresh();
    Connectivity().onConnectivityChanged.listen((_) {
      syncPending();
    });
    await syncPending();
  }

  Future<void> refresh() async {
    _pending = await _storage.loadPending();
    notifyListeners();
  }

  Future<bool> hasConnectivity() async {
    final results = await Connectivity().checkConnectivity();
    return results.any((r) => r != ConnectivityResult.none);
  }

  Future<void> syncPending() async {
    if (_syncing) return;
    if (!await hasConnectivity()) return;
    if (_clientSessionMissing()) return;

    _syncing = true;
    notifyListeners();

    try {
      _pending = await _storage.loadPending();
      for (final item in List<PendingCheckIn>.from(_pending)) {
        await _syncOne(item);
      }
    } finally {
      _syncing = false;
      await refresh();
    }
  }

  bool _clientSessionMissing() {
    return AttendanceService().currentUserId == null;
  }

  Future<void> _syncOne(PendingCheckIn item) async {
    final syncing = item.copyWith(
      status: PendingCheckInStatus.syncing,
      lastError: null,
    );
    await _storage.update(syncing);

    try {
      final selfieFile = File(item.localSelfiePath);
      if (!await selfieFile.exists()) {
        throw Exception('Selfie file missing for pending check-in.');
      }

      final selfiePath = await _attendance.uploadSelfie(selfieFile);
      final result = await _attendance.checkIn(
        qrToken: item.qrToken,
        latitude: item.latitude,
        longitude: item.longitude,
        selfiePath: selfiePath,
        clientCheckedInAt: item.capturedAt,
        captureIntegrity: item.captureIntegrity,
      );

      final eventTitle =
          (result['event'] as Map?)?['title'] as String? ?? item.eventTitleHint;
      if (eventTitle != null && eventTitle != item.eventTitleHint) {
        await _storage.update(item.copyWith(eventTitleHint: eventTitle));
      }

      await _storage.remove(item.id);
    } catch (e) {
      final message = e.toString().replaceFirst('Exception: ', '');
      if (_isPermanentFailure(message)) {
        await _storage.remove(item.id);
      } else {
        await _storage.update(
          item.copyWith(
            status: PendingCheckInStatus.failed,
            lastError: message,
          ),
        );
      }
    }
  }

  bool _isPermanentFailure(String message) {
    final lower = message.toLowerCase();
    return lower.contains('already checked in') ||
        lower.contains('invalid or expired qr') ||
        lower.contains('not active') ||
        lower.contains('pending admin approval') ||
        lower.contains('attendance window is not open') ||
        lower.contains('qr code has expired') ||
        lower.contains('outside the event location') ||
        lower.contains('screenshot') ||
        lower.contains('screen recording');
  }
}

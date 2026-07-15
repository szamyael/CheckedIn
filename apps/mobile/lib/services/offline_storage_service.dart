import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';
import 'package:uuid/uuid.dart';

import '../models/pending_check_in.dart';

class OfflineStorageService {
  OfflineStorageService._();
  static final OfflineStorageService instance = OfflineStorageService._();

  static const _queueFileName = 'pending_checkins.json';
  static const _selfieDirName = 'pending_selfies';

  Future<Directory> _appDir() => getApplicationDocumentsDirectory();

  Future<File> _queueFile() async {
    final dir = await _appDir();
    return File('${dir.path}/$_queueFileName');
  }

  Future<Directory> _selfieDir() async {
    final dir = await _appDir();
    final selfies = Directory('${dir.path}/$_selfieDirName');
    if (!await selfies.exists()) {
      await selfies.create(recursive: true);
    }
    return selfies;
  }

  Future<List<PendingCheckIn>> loadPending() async {
    final file = await _queueFile();
    if (!await file.exists()) return [];

    final raw = await file.readAsString();
    if (raw.trim().isEmpty) return [];

    final list = jsonDecode(raw) as List;
    return list
        .map((e) => PendingCheckIn.fromJson(Map<String, dynamic>.from(e as Map)))
        .toList();
  }

  Future<void> _saveAll(List<PendingCheckIn> items) async {
    final file = await _queueFile();
    final encoded = jsonEncode(items.map((e) => e.toJson()).toList());
    await file.writeAsString(encoded);
  }

  Future<bool> hasPendingForQrToken(String qrToken) async {
    final items = await loadPending();
    return items.any((item) => item.qrToken == qrToken);
  }

  Future<PendingCheckIn> enqueue({
    required String qrToken,
    required double latitude,
    required double longitude,
    required File selfieFile,
    required DateTime capturedAt,
    String? eventTitleHint,
    String? eventId,
    String? otpCode,
    Map<String, dynamic>? captureIntegrity,
  }) async {
    if (await hasPendingForQrToken(qrToken)) {
      throw Exception(
        'You already have a pending check-in for this event. It will sync when online.',
      );
    }

    final id = const Uuid().v4();
    final dir = await _selfieDir();
    final dest = File('${dir.path}/$id.jpg');
    await selfieFile.copy(dest.path);

    final item = PendingCheckIn(
      id: id,
      qrToken: qrToken,
      latitude: latitude,
      longitude: longitude,
      localSelfiePath: dest.path,
      capturedAt: capturedAt,
      eventTitleHint: eventTitleHint,
      eventId: eventId,
      otpCode: otpCode,
      captureIntegrity: captureIntegrity,
    );

    final items = await loadPending()..add(item);
    await _saveAll(items);
    return item;
  }

  Future<void> update(PendingCheckIn item) async {
    final items = await loadPending();
    final index = items.indexWhere((e) => e.id == item.id);
    if (index == -1) return;
    items[index] = item;
    await _saveAll(items);
  }

  Future<void> remove(String id) async {
    final items = await loadPending();
    final match = items.where((e) => e.id == id).firstOrNull;
    if (match != null) {
      final selfie = File(match.localSelfiePath);
      if (await selfie.exists()) {
        await selfie.delete();
      }
    }
    items.removeWhere((e) => e.id == id);
    await _saveAll(items);
  }
}

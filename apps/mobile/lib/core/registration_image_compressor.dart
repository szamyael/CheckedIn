import 'dart:io';
import 'dart:typed_data';

import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';

/// Shrink photos before uploading so registration payloads stay under edge limits.
class RegistrationImageCompressor {
  RegistrationImageCompressor._();

  static Future<List<int>> compressFile(
    File file, {
    int maxSide = 1280,
    int quality = 78,
  }) async {
    final raw = await file.readAsBytes();
    return compressBytes(raw, maxSide: maxSide, quality: quality);
  }

  static Future<List<int>> compressBytes(
    List<int> raw, {
    int maxSide = 1280,
    int quality = 78,
  }) async {
    final decoded = img.decodeImage(Uint8List.fromList(raw));
    if (decoded == null) return raw;

    img.Image resized = decoded;
    final longest = decoded.width > decoded.height ? decoded.width : decoded.height;
    if (longest > maxSide) {
      if (decoded.width >= decoded.height) {
        resized = img.copyResize(decoded, width: maxSide);
      } else {
        resized = img.copyResize(decoded, height: maxSide);
      }
    }

    return img.encodeJpg(resized, quality: quality);
  }

  static Future<File> compressToTempFile(
    File file, {
    int maxSide = 1280,
    int quality = 78,
  }) async {
    final bytes = await compressFile(file, maxSide: maxSide, quality: quality);
    final dir = await getTemporaryDirectory();
    final out = File(
      '${dir.path}/reg_${DateTime.now().millisecondsSinceEpoch}.jpg',
    );
    await out.writeAsBytes(bytes, flush: true);
    return out;
  }
}

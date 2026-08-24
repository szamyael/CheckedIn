import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:image/image.dart' as img;
import 'package:path_provider/path_provider.dart';

/// Crops a face / portrait region from a student ID for the profile avatar.
///
/// Uses the left portrait zone common on Philippine student IDs.
/// (ML Kit face detection can be layered on later without changing callers.)
class IdFaceCropper {
  IdFaceCropper._();

  static Future<File?> cropToTempFile(File idCardImage) async {
    try {
      final bytes = await idCardImage.readAsBytes();
      final decoded = img.decodeImage(bytes);
      if (decoded == null) return null;

      final portrait = _leftPortrait(decoded);
      final square = _toSquareAvatar(portrait);
      final jpg = img.encodeJpg(square, quality: 88);

      final dir = await getTemporaryDirectory();
      final out = File(
        '${dir.path}/id_avatar_${DateTime.now().millisecondsSinceEpoch}.jpg',
      );
      await out.writeAsBytes(Uint8List.fromList(jpg));
      return out;
    } catch (_) {
      return null;
    }
  }

  static img.Image _leftPortrait(img.Image source) {
    final w = source.width;
    final h = source.height;
    final sx = (w * 0.04).round().clamp(0, w - 1);
    final sy = (h * 0.20).round().clamp(0, h - 1);
    final sw = (w * 0.36).round().clamp(1, w - sx);
    final sh = (h * 0.55).round().clamp(1, h - sy);
    return img.copyCrop(source, x: sx, y: sy, width: sw, height: sh);
  }

  static img.Image _toSquareAvatar(img.Image portrait) {
    final size = math.max(portrait.width, portrait.height);
    final canvas = img.Image(width: size, height: size);
    img.fill(canvas, color: img.ColorRgb8(15, 23, 42));
    final ox = ((size - portrait.width) / 2).round();
    final oy = ((size - portrait.height) / 2).round();
    img.compositeImage(canvas, portrait, dstX: ox, dstY: oy);
    return img.copyResize(canvas, width: 320, height: 320);
  }
}

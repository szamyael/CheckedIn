import 'dart:io';

import 'package:image/image.dart' as img;

class SelfieIntegrityResult {
  final bool passed;
  final List<String> issues;

  const SelfieIntegrityResult({required this.passed, required this.issues});

  bool get blocksCheckIn =>
      issues.any((i) => _blockingIssues.contains(i));

  static const _blockingIssues = {
    'png_not_camera',
    'screenshot_metadata',
    'invalid_image_format',
    'file_too_small',
  };
}

class SelfieIntegrityAnalyzer {
  static const _screenSizes = <(int, int)>[
    (1080, 2400),
    (1080, 2340),
    (1170, 2532),
    (1284, 2778),
    (1440, 3200),
    (720, 1600),
    (1080, 1920),
    (828, 1792),
    (750, 1334),
    (1242, 2688),
  ];

  static Future<SelfieIntegrityResult> analyze(File file) async {
    final issues = <String>[];
    final bytes = await file.readAsBytes();

    if (bytes.length < 2048) {
      issues.add('file_too_small');
    }

    if (bytes.length >= 4 &&
        bytes[0] == 0x89 &&
        bytes[1] == 0x50 &&
        bytes[2] == 0x4E &&
        bytes[3] == 0x47) {
      issues.add('png_not_camera');
    }

    final isJpeg = bytes.length >= 2 && bytes[0] == 0xFF && bytes[1] == 0xD8;
    if (!isJpeg && !issues.contains('png_not_camera')) {
      issues.add('invalid_image_format');
    }

    final scanLen = bytes.length < 65536 ? bytes.length : 65536;
    final header = String.fromCharCodes(bytes.sublist(0, scanLen));

    if (RegExp(
      r'screenshot|screen.?capture|snipping|screen.?shot',
      caseSensitive: false,
    ).hasMatch(header)) {
      issues.add('screenshot_metadata');
    }

    if (isJpeg && !header.contains('Exif')) {
      issues.add('missing_exif');
    }

    try {
      final decoded = img.decodeImage(bytes);
      if (decoded != null) {
        final w = decoded.width;
        final h = decoded.height;
        for (final (sw, sh) in _screenSizes) {
          if ((w == sw && h == sh) || (w == sh && h == sw)) {
            issues.add('screen_resolution_match');
            break;
          }
        }
      }
    } catch (_) {}

    return SelfieIntegrityResult(
      passed: !issues.any(SelfieIntegrityResult._blockingIssues.contains),
      issues: issues,
    );
  }
}

/// Normalizes and compares OCR fields vs user-entered registration data.
class OcrMatching {
  static String normalize(String? value) {
    return (value ?? '')
        .toLowerCase()
        .replaceAll(RegExp(r'[.,]'), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  static String normalizeProgram(String? value) {
    var v = normalize(value);
    v = v.replaceAll(RegExp(r'^b\.?\s*s\.?\s*'), 'bs ');
    return v.trim();
  }

  static bool nameMatches(String? ocr, String? user) {
    final a = normalize(ocr);
    final b = normalize(user);
    if (b.isEmpty) return false;
    if (a.isEmpty) return true;
    return a == b;
  }

  static bool middleNameMatches(String? ocr, String? user) {
    final a = normalize(ocr);
    final b = normalize(user);
    if (a.isEmpty) return true;
    if (b.isEmpty) return true;
    if (a == b) return true;
    if (a.length == 1 && b.startsWith(a)) return true;
    if (b.length == 1 && a.startsWith(b)) return true;
    return false;
  }

  static bool programMatches(String? ocr, String? user) {
    final a = normalizeProgram(ocr);
    final b = normalizeProgram(user);
    if (b.isEmpty) return false;
    if (a.isEmpty) return true;
    if (a == b) return true;
    if (a.contains(b) || b.contains(a)) return true;

    final coreA = _programCore(a);
    final coreB = _programCore(b);
    if (coreA == coreB) return true;
    if (coreA.contains(coreB) || coreB.contains(coreA)) return true;

    return false;
  }

  static String _programCore(String value) {
    return value.replaceFirst(RegExp(r'^bs\s+'), '').trim();
  }

  static bool studentIdMatches(String? ocr, String? user) {
    if (ocr == null || user == null) return false;
    final oDigits = ocr.replaceAll(RegExp(r'\D'), '');
    final uDigits = user.replaceAll(RegExp(r'\D'), '');
    return oDigits == uDigits && oDigits.length == 8;
  }
}

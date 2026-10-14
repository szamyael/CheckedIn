import 'package:flutter/material.dart';

class AppLogo extends StatelessWidget {
  final double size;
  final BoxFit fit;

  const AppLogo({
    super.key,
    this.size = 120,
    this.fit = BoxFit.contain,
  });

  static const assetPath = 'assets/images/Checkedin_logo_without_background.png';

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      assetPath,
      width: size,
      height: size,
      fit: fit,
      semanticLabel: 'CheckedIn logo',
    );
  }
}

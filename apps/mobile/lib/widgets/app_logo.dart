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
    final image = Image.asset(
      assetPath,
      width: size,
      height: size,
      fit: fit,
      semanticLabel: 'CheckedIn logo',
    );
    return Theme.of(context).brightness == Brightness.dark
        ? ColorFiltered(
            colorFilter: const ColorFilter.mode(Colors.white, BlendMode.srcIn),
            child: image,
          )
        : image;
  }
}

class AppBrand extends StatelessWidget {
  const AppBrand({super.key});

  static const wordmarkAssetPath = 'assets/images/checkedin-horizontal.png';

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => constraints.maxWidth < 200
          ? const AppLogo(size: 34)
          : Theme.of(context).brightness == Brightness.dark
          ? ColorFiltered(
              colorFilter: const ColorFilter.mode(
                Colors.white,
                BlendMode.srcIn,
              ),
              child: Image.asset(
                wordmarkAssetPath,
                width: 160,
                height: 48,
                fit: BoxFit.contain,
                semanticLabel: 'CheckedIn logo',
              ),
            )
          : Image.asset(
              wordmarkAssetPath,
              width: 160,
              height: 48,
              fit: BoxFit.contain,
              semanticLabel: 'CheckedIn logo',
            ),
    );
  }
}

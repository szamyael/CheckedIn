import Image from "next/image";

type BrandLogoProps = {
  variant?: "transparent" | "background";
  className?: string;
  priority?: boolean;
};

export function BrandLogo({
  variant = "transparent",
  className = "",
  priority = false,
}: BrandLogoProps) {
  const src =
    variant === "background"
      ? "/logos/banner-with-background.png"
      : "/logos/checkedin-horizontal.svg";

  return (
    <Image
      src={src}
      alt="CheckedIn"
      width={850}
      height={256}
      priority={priority}
      className={`h-auto w-auto max-w-full object-contain ${className}`}
    />
  );
}

export function BrandMark({
  className = "",
  size = 40,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Image
      src="/logos/checkedin-symbol.svg"
      alt="CheckedIn"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}

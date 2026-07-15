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
      : "/logos/banner-transparent.png";

  return (
    <Image
      src={src}
      alt="CheckedIn — QR Events Attendance Monitoring & Incentives System"
      width={320}
      height={120}
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
      src="/logos/logo.png"
      alt="CheckedIn"
      width={size}
      height={size}
      className={`object-contain ${className}`}
    />
  );
}

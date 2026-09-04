import { cn } from "@/lib/utils";

export function OrgLogo({
  logoUrl,
  size = "md",
  className,
}: {
  name: string;
  logoUrl?: string | null;
  brandColor?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim =
    size === "lg" ? "h-20 w-20 text-xl" : size === "sm" ? "h-8 w-8 text-xs" : "h-12 w-12 text-sm";

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className={cn(
          dim,
          "rounded-[var(--radius-md)] object-cover ring-2 ring-surface-raised",
          className,
        )}
      />
    );
  }

  return null;
}

export function OrgBanner({
  bannerUrl,
  className,
}: {
  bannerUrl?: string | null;
  brandColor?: string | null;
  className?: string;
}) {
  if (bannerUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={bannerUrl}
        alt=""
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }
  return null;
}

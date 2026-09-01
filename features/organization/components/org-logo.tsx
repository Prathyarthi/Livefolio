import { cn } from "@/lib/utils";

export function OrgLogo({
  name,
  logoUrl,
  brandColor,
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

  return (
    <div
      className={cn(
        dim,
        "flex items-center justify-center rounded-[var(--radius-md)] font-semibold text-white ring-2 ring-surface-raised",
        className,
      )}
      style={{ background: brandColor || "var(--brand-primary)" }}
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

export function OrgBanner({
  bannerUrl,
  brandColor,
  className,
}: {
  bannerUrl?: string | null;
  brandColor?: string | null;
  className?: string;
}) {
  const brand = brandColor || "var(--brand-primary)";
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
  return (
    <div
      className={cn("h-full w-full", className)}
      style={{
        background: `linear-gradient(135deg, ${brand} 0%, color-mix(in srgb, ${brand} 55%, #111827) 100%)`,
      }}
    />
  );
}

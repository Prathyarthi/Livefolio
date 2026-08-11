import Link from "next/link";
import { siteConfig } from "@/lib/site";
import { cn } from "@/lib/utils";

type LogoVariant = "default" | "light";

function LogoMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.svg"
      alt=""
      width={52}
      height={52}
      className={cn("shrink-0", className)}
      aria-hidden
    />
  );
}

type LogoProps = {
  variant?: LogoVariant;
  className?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
  href?: string;
};

export function Logo({
  variant = "default",
  className,
  wordmarkClassName,
  showWordmark = true,
  href = "/",
}: LogoProps) {
  const isLight = variant === "light";

  return (
    <Link
      href={href}
      className={cn("flex items-center gap-2.5", className)}
      aria-label={`${siteConfig.name} home`}
    >
      <LogoMark />
      {showWordmark ? (
        <span
          className={cn(
            "font-display text-[20px] font-bold tracking-[-0.01em]",
            wordmarkClassName ??
              (isLight ? "text-white" : "text-brand-primary")
          )}
        >
          {siteConfig.name}
        </span>
      ) : null}
    </Link>
  );
}

export { LogoMark };

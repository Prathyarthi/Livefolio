"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { resolveTechIcon, techIconUrl } from "./tech-catalog";

export function TechIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const { slug } = resolveTechIcon(name);
  const [showIcon, setShowIcon] = useState(Boolean(slug));

  useEffect(() => {
    setShowIcon(Boolean(slug));
  }, [slug]);

  if (slug && showIcon) {
    return (
      <img
        src={techIconUrl(slug)}
        alt=""
        className={cn("h-3.5 w-3.5 shrink-0", className)}
        loading="lazy"
        onError={() => setShowIcon(false)}
      />
    );
  }

  return (
    <span
      className={cn(
        "inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--lf-accent)_15%,transparent)] text-[8px] font-bold text-[var(--lf-accent)]",
        className,
      )}
    >
      {name.trim().slice(0, 1).toUpperCase() || "•"}
    </span>
  );
}

export function TechChip({
  name,
  className,
  iconClassName,
}: {
  name: string;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span className={cn("inline-flex max-w-full items-center gap-1.5", className)}>
      <TechIcon name={name} className={iconClassName} />
      <span className="min-w-0 truncate">{name}</span>
    </span>
  );
}

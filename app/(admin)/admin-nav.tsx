"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/emails", label: "Emails" },
  { href: "/admin/emails/preview", label: "Previews" },
  { href: "/dashboard", label: "Dashboard" },
] as const;

function isActive(href: string, pathname: string): boolean {
  if (href === "/dashboard") return false;
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/emails") return pathname === "/admin/emails";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full border border-border-default bg-surface-sunken/80 p-1"
      aria-label="Admin"
    >
      {links.map((link) => {
        const active = isActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-surface-raised font-medium text-text-primary shadow-[var(--shadow-card)]"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

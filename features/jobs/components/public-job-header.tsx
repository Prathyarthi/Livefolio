import type { ReactNode } from "react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";

export function PublicJobHeader({ action }: { action?: ReactNode }) {
  return (
    <header className="glass-nav sticky top-0 z-20">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-6">
        <Logo />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {action}
        </div>
      </div>
    </header>
  );
}

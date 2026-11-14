"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DocsSearch } from "@/features/docs/components/docs-search";
import { DocsSidebarNav } from "@/features/docs/components/docs-sidebar-nav";

export function DocsHeader() {
  const [open, setOpen] = useState(false);
  const { status } = useSession();
  const authenticated = status === "authenticated";

  return (
    <header className="glass-nav sticky top-0 z-[100] border-b border-border-default">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-3 px-4 sm:px-6">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-label="Open docs menu"
            >
              <Menu className="size-5" aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0">
            <SheetHeader className="border-b border-border-default">
              <SheetTitle>Livefolio Docs</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100svh-4rem)] px-3 py-4">
              <DocsSidebarNav onNavigate={() => setOpen(false)} />
            </ScrollArea>
          </SheetContent>
        </Sheet>

        <div className="flex shrink-0 items-center gap-2">
          <Logo wordmarkClassName="hidden sm:inline" />
          <Link
            href="/docs"
            className="rounded-md border border-border-default px-2 py-0.5 text-xs font-semibold text-text-secondary hover:text-text-primary"
          >
            Docs
          </Link>
        </div>

        <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 md:ml-6 md:justify-start">
          <DocsSearch className="hidden max-w-sm md:block" />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <Button size="sm" className="hidden sm:inline-flex" asChild>
            <Link href={authenticated ? "/dashboard" : "/sign-up"}>
              {authenticated ? "Dashboard" : "Get started"}
            </Link>
          </Button>
        </div>
      </div>
      <div className="border-t border-border-default px-4 py-2 md:hidden">
        <DocsSearch />
      </div>
    </header>
  );
}

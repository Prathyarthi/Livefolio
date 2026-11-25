"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const linkClass =
  "rounded-full px-3 py-1.5 text-sm text-[#68717b] transition-colors hover:bg-[#eef0f4] hover:text-[#2f343a] @md:px-4 @md:py-2";

export function PastelNavbar({
  items,
}: {
  items: Array<{ id: string; label: string }>;
}) {
  const [open, setOpen] = useState(false);
  if (items.length === 0) return null;

  return (
    <nav className="w-full min-w-0 max-w-full">
      <div className="mt-8 hidden w-full items-center justify-start gap-1.5 rounded-full border border-[#2f343a]/10 bg-[#fbfbfc]/85 p-1.5 shadow-[0_18px_45px_rgba(47,52,58,0.08)] @md:flex @md:gap-2 @md:p-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className={cn(linkClass, "shrink-0 whitespace-nowrap")}
          >
            {item.label}
          </a>
        ))}
      </div>

      <div className="absolute right-5 top-10 z-40 @md:hidden sm:right-6">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex size-10 items-center justify-center rounded-full border border-[#2f343a]/10 bg-[#fbfbfc]/85 text-[#68717b] shadow-[0_18px_45px_rgba(47,52,58,0.08)] transition-colors hover:bg-[#eef0f4] hover:text-[#2f343a]"
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
          {open ? (
            <div className="absolute right-0 z-40 mt-2 flex min-w-44 flex-col gap-0.5 rounded-3xl border border-[#2f343a]/10 bg-[#fbfbfc] p-1.5 shadow-[0_18px_45px_rgba(47,52,58,0.08)]">
              {items.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setOpen(false)}
                  className={cn(linkClass, "block w-full text-right")}
                >
                  {item.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

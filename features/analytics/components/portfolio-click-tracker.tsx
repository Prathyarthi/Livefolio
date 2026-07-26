"use client";

import { useEffect, useRef } from "react";
import {
  isClickType,
  MAX_CLICK_LABEL_CHARS,
  type ClickType,
} from "@/features/analytics/lib/click-types";

function isTrackableAnchor(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("javascript:")) {
    return false;
  }

  if (anchor.dataset.lfTrack) return true;

  try {
    const url = new URL(anchor.href, window.location.href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.origin === window.location.origin) return false;
    return true;
  } catch {
    return false;
  }
}

function resolveType(anchor: HTMLAnchorElement): ClickType {
  const raw = anchor.dataset.lfTrack;
  return isClickType(raw) ? raw : "outbound";
}

function resolveLabel(anchor: HTMLAnchorElement): string {
  const fromData = anchor.dataset.lfLabel?.trim();
  if (fromData) return fromData.slice(0, MAX_CLICK_LABEL_CHARS);

  const text = anchor.textContent?.replace(/\s+/g, " ").trim();
  if (text) return text.slice(0, MAX_CLICK_LABEL_CHARS);

  try {
    return new URL(anchor.href).hostname.slice(0, MAX_CLICK_LABEL_CHARS);
  } catch {
    return "";
  }
}

export function PortfolioClickTracker({ slug }: { slug: string }) {
  const slugRef = useRef(slug);
  slugRef.current = slug;

  useEffect(() => {
    if (!slug) return;

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0 && event.button !== 1) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!isTrackableAnchor(anchor)) return;

      const payload = {
        slug: slugRef.current,
        type: resolveType(anchor),
        label: resolveLabel(anchor),
        url: anchor.href,
        targetId: anchor.dataset.lfId || undefined,
      };

      fetch("/api/analytics/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Ignore beacon failures — never block navigation.
      });
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [slug]);

  return null;
}
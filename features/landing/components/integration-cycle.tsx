"use client";

import { useEffect, useState } from "react";
import { integrationCycle } from "@/lib/site";

const TYPE_MS = 70;
const ERASE_MS = 45;
const HOLD_MS = 1500;

export function IntegrationCycle() {
  const [platformIndex, setPlatformIndex] = useState(0);
  // Non-empty on SSR so "connected through …" is a complete sentence before JS.
  const [text, setText] = useState<string>(() => integrationCycle[0] ?? "integrations");
  const [erasing, setErasing] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (reducedMotion) return;

    const word = integrationCycle[platformIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!erasing) {
      if (text.length < word.length) {
        timeout = setTimeout(() => {
          setText(word.slice(0, text.length + 1));
        }, TYPE_MS);
      } else {
        timeout = setTimeout(() => setErasing(true), HOLD_MS);
      }
    } else if (text.length > 0) {
      timeout = setTimeout(() => {
        setText(text.slice(0, -1));
      }, ERASE_MS);
    } else {
      setErasing(false);
      setPlatformIndex((index) => (index + 1) % integrationCycle.length);
    }

    return () => clearTimeout(timeout);
  }, [text, erasing, platformIndex, reducedMotion]);

  if (reducedMotion) {
    return <span>integrations</span>;
  }

  const visible =
    text || integrationCycle[platformIndex] || "integrations";

  return (
    <span
      className="integration-cycle"
      aria-live="polite"
      aria-label={`Connected through ${visible}`}
    >
      <span className="integration-cycle__word">{visible}</span>
      <span className="integration-cycle__cursor" aria-hidden>
        ▊
      </span>
    </span>
  );
}

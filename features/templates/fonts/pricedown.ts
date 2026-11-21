import localFont from "next/font/local";

/**
 * Pricedown Black (Ray Larabie / Typodermic) — the GTA wordmark face.
 * Free desktop license from dafont; SaaS / webfont embedding may need a
 * commercial Typodermic license for production shipping.
 */
export const pricedown = localFont({
  src: [
    {
      path: "./files/pricedown-bl.otf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-pricedown",
  display: "swap",
});

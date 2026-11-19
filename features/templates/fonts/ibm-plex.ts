import localFont from "next/font/local";

/**
 * Self-hosted IBM Plex — avoids next/font/google build flakes when Google
 * returns extensionless /l/font?kit= URLs (Turbopack/webpack both fail).
 */
export const developerPlexMono = localFont({
  src: [
    {
      path: "./files/ibm-plex-mono-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./files/ibm-plex-mono-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./files/ibm-plex-mono-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-developer-mono",
  display: "swap",
});

export const developerPlexSans = localFont({
  src: [
    {
      path: "./files/ibm-plex-sans-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./files/ibm-plex-sans-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./files/ibm-plex-sans-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-developer-sans",
  display: "swap",
});

export const corporatePlexSans = localFont({
  src: [
    {
      path: "./files/ibm-plex-sans-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./files/ibm-plex-sans-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./files/ibm-plex-sans-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-corporate-sans",
  display: "swap",
});

export const corporatePlexSerif = localFont({
  src: [
    {
      path: "./files/ibm-plex-serif-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./files/ibm-plex-serif-latin-500-normal.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./files/ibm-plex-serif-latin-600-normal.woff2",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-corporate-serif",
  display: "swap",
});

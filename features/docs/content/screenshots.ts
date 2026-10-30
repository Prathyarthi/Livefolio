import type { DocScreenshot } from "@/features/docs/types";

/**
 * Every screenshot used by the docs lives in `public/docs/<name>.png`.
 * Flip `available` to `true` once the real capture has been added.
 * The full capture checklist is in `features/docs/SCREENSHOTS.md`.
 */
const SCREENSHOTS = {
  "landing": { alt: "Livefolio home page", available: true },
  "sign-up": { alt: "Sign up page with Google and GitHub buttons", available: true },
  "sign-in": { alt: "Sign in page", available: true },
  "pricing": { alt: "Pricing page with Free and Pro plans", available: true },
  "contact": { alt: "Contact and support page", available: true },
  "dashboard-overview": { alt: "Dashboard overview", available: true },
  "dashboard-create-portfolio": { alt: "Create portfolio button on the dashboard", available: false },
  "import-resume": { alt: "Import page with the Resume source selected", available: true },
  "import-integrations": { alt: "Import page with GitHub and other sources", available: false },
  "edit-basic-info": { alt: "Edit page on the Basic Info step", available: true },
  "edit-experience": { alt: "Edit page on the Experience step", available: true },
  "edit-projects": { alt: "Edit page on the Projects step", available: true },
  "edit-custom-sections": { alt: "Edit page on the Custom Sections step", available: true },
  "edit-social": { alt: "Edit page on the Social Links step", available: true },
  "edit-publish-step": { alt: "Publish step with subdomain and Open to work", available: true },
  "templates": { alt: "Templates gallery", available: true },
  "preview": { alt: "Preview page with toolbar", available: true },
  "preview-sections": { alt: "Preview editor with the Sections tab", available: true },
  "publish-dialog": { alt: "Publish dialog with subdomain field", available: false },
  "share-dialog": { alt: "Share your portfolio dialog", available: true },
  "references": { alt: "References page", available: true },
  "analytics": { alt: "Analytics dashboard", available: true },
  "billing": { alt: "Billing page", available: true },
  "settings": { alt: "Settings page", available: true },
} as const satisfies Record<string, { alt: string; available: boolean }>;

export type DocScreenshotName = keyof typeof SCREENSHOTS;

export function shot(name: DocScreenshotName, caption?: string): DocScreenshot {
  const entry = SCREENSHOTS[name];
  return {
    src: `/docs/${name}.png`,
    alt: entry.alt,
    caption,
    available: entry.available,
  };
}

export function listDocScreenshots() {
  return Object.entries(SCREENSHOTS).map(([name, entry]) => ({
    name,
    file: `public/docs/${name}.png`,
    ...entry,
  }));
}

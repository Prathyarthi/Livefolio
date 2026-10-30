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
  "dashboard-overview": { alt: "Dashboard overview", available: false },
  "dashboard-create-portfolio": { alt: "Create portfolio button on the dashboard", available: false },
  "import-resume": { alt: "Import page with the Resume source selected", available: false },
  "import-integrations": { alt: "Import page with GitHub and other sources", available: false },
  "edit-basic-info": { alt: "Edit page on the Basic Info step", available: false },
  "edit-experience": { alt: "Edit page on the Experience step", available: false },
  "edit-projects": { alt: "Edit page on the Projects step", available: false },
  "edit-custom-sections": { alt: "Edit page on the Custom Sections step", available: false },
  "edit-social": { alt: "Edit page on the Social Links step", available: false },
  "edit-publish-step": { alt: "Publish step with subdomain and Open to work", available: false },
  "templates": { alt: "Templates gallery", available: false },
  "preview": { alt: "Preview page with toolbar", available: false },
  "preview-sections": { alt: "Preview editor with the Sections tab", available: false },
  "publish-dialog": { alt: "Publish dialog with subdomain field", available: false },
  "share-dialog": { alt: "Share your portfolio dialog", available: false },
  "references": { alt: "References page", available: false },
  "analytics": { alt: "Analytics dashboard", available: false },
  "billing": { alt: "Billing page", available: false },
  "settings": { alt: "Settings page", available: false },
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

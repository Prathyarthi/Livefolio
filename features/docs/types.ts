import type { LucideIcon } from "lucide-react";

/**
 * Inline text in docs content supports a tiny subset of markdown:
 * `**bold**`, `` `code` `` and `[label](href)`.
 */
export type DocText = string;

export type DocScreenshot = {
  /** Path under /public, e.g. `/docs/sign-up.png`. */
  src: string;
  alt: string;
  caption?: DocText;
  /**
   * `false` renders a clearly-labelled placeholder until the real capture
   * is added to `public/docs/` (see `features/docs/SCREENSHOTS.md`).
   */
  available: boolean;
};

export type DocStep = {
  title: DocText;
  body?: DocText;
  screenshot?: DocScreenshot;
};

export type DocBlock =
  | { type: "paragraph"; text: DocText }
  | { type: "heading"; text: string }
  | { type: "steps"; steps: DocStep[] }
  | { type: "list"; items: DocText[] }
  | {
      type: "callout";
      variant: "info" | "tip" | "warning";
      title?: string;
      text: DocText;
    }
  | { type: "screenshot"; screenshot: DocScreenshot }
  | { type: "faq"; items: { question: string; answer: DocText }[] };

export type DocArticle = {
  slug: string;
  title: string;
  description: string;
  /** Dashboard path the article is about, shown as a quick link. */
  appPath?: string;
  blocks: DocBlock[];
};

export type DocCategory = {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  articles: DocArticle[];
};

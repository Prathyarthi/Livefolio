import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";
import { stripRichTextToPlain } from "@/lib/rich-text";

export type FaqItem = { question: string; answer: string };

/** Raw HTML inside posts is escaped (not rendered). Posts are plain markdown. */
const md = new MarkdownIt({ html: false, linkify: true, breaks: false });

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Add stable ids to headings and open external links safely. */
md.core.ruler.push("blog_headings_and_links", (state) => {
  const used = new Map<string, number>();
  const tokens = state.tokens;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.type === "heading_open") {
      const inline = tokens[i + 1];
      const base = slugifyHeading(inline?.content ?? "") || "section";
      const count = used.get(base) ?? 0;
      used.set(base, count + 1);
      token.attrSet("id", count === 0 ? base : `${base}-${count}`);
    }
    if (token.type === "inline" && token.children) {
      for (const child of token.children) {
        if (child.type !== "link_open") continue;
        const href = String(child.attrGet("href") ?? "");
        if (/^https?:\/\//i.test(href)) {
          child.attrSet("target", "_blank");
          child.attrSet("rel", "noopener noreferrer");
        }
      }
    }
    if (token.type === "inline" && token.children) {
      for (const child of token.children) {
        if (child.type === "image") child.attrSet("loading", "lazy");
      }
    }
  }
});

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "h2", "h3", "h4", "p", "br", "hr", "strong", "em", "del", "code", "pre",
    "blockquote", "ul", "ol", "li", "a", "img",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    img: ["src", "alt", "title", "loading", "width", "height"],
    h2: ["id"],
    h3: ["id"],
    h4: ["id"],
    th: ["align"],
    td: ["align"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: { img: ["http", "https"] },
  allowProtocolRelative: false,
};

/** Markdown -> sanitized HTML. `# h1` is demoted: the page title is the only h1. */
export function renderMarkdown(markdown: string): string {
  const html = md.render(markdown).replace(/<(\/?)h1\b/g, "<$1h2");
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

/**
 * FAQ convention: a `## FAQ` (or `## Frequently asked questions`) heading, with
 * each question as a `### Question?` subheading and the answer as the markdown
 * beneath it, up to the next `###` or `##`. Returns [] when there is no FAQ.
 */
export function extractFaq(markdown: string): FaqItem[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const items: FaqItem[] = [];
  let inFaq = false;
  let inFence = false;
  let question: string | null = null;
  let answerLines: string[] = [];

  const flush = () => {
    if (question) {
      const answer = stripRichTextToPlain(answerLines.join("\n"))
        .replace(/\s*\n+\s*/g, " ")
        .trim();
      if (answer) items.push({ question, answer });
    }
    question = null;
    answerLines = [];
  };

  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const h2 = !inFence && line.match(/^##\s+(.+?)\s*#*\s*$/);
    const h3 = !inFence && line.match(/^###\s+(.+?)\s*#*\s*$/);

    if (h2) {
      flush();
      inFaq = /^(faq|faqs|frequently asked questions)\??$/i.test(h2[1].trim());
      continue;
    }
    if (!inFaq) continue;
    if (h3) {
      flush();
      question = stripRichTextToPlain(h3[1]);
      continue;
    }
    if (question) answerLines.push(line);
  }
  flush();
  return items;
}

export function countWords(markdown: string): number {
  const plain = stripRichTextToPlain(markdown);
  return plain ? plain.split(/\s+/).length : 0;
}

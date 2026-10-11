import DOMPurify from "isomorphic-dompurify";
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
});

/** Tags/attrs allowed when rendering or persisting rich description HTML. */
const PURIFY_CONFIG: {
  ALLOWED_TAGS: string[];
  ALLOWED_ATTR: string[];
  ALLOW_DATA_ATTR: boolean;
} = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "del",
    "code",
    "a",
    "span",
    "ul",
    "ol",
    "li",
    "h2",
    "h3",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "style", "class"],
  ALLOW_DATA_ATTR: false,
};

const STYLE_ALLOW =
  /^(?:\s*(?:color|font-size)\s*:\s*[^;]+;?\s*)+$/i;

function scrubStyleAttribute(html: string): string {
  return html.replace(/\sstyle=(["'])(.*?)\1/gi, (_match, quote, style: string) => {
    const parts = style
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => {
        const [prop, ...rest] = part.split(":");
        if (!prop || rest.length === 0) return false;
        const name = prop.trim().toLowerCase();
        const value = rest.join(":").trim();
        if (!value || /expression|url\s*\(/i.test(value)) return false;
        return name === "color" || name === "font-size";
      });
    if (parts.length === 0) return "";
    const cleaned = parts.join("; ");
    if (!STYLE_ALLOW.test(`${cleaned};`)) return "";
    return ` style=${quote}${cleaned}${quote}`;
  });
}

/** Strip markdown / HTML marks to approximate visible plain text (for length checks). */
export function stripRichTextToPlain(value: string): string {
  return value
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<\/?[^>]+>/g, " ")
    .replace(/(\*\*|__)(.*?)\1/g, "$2")
    .replace(/(\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s+/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/** Force external links to open in a new tab safely. */
function withNewTabLinks(html: string): string {
  return html.replace(/<a\b([^>]*)>/gi, (_match, attrs: string) => {
    let next = attrs
      .replace(/\s*target=(["'])(.*?)\1/gi, "")
      .replace(/\s*rel=(["'])(.*?)\1/gi, "");
    return `<a${next} target="_blank" rel="noopener noreferrer">`;
  });
}

export function sanitizeRichHtml(html: string): string {
  const purified = DOMPurify.sanitize(html, PURIFY_CONFIG);
  return withNewTabLinks(scrubStyleAttribute(purified));
}

/**
 * Convert a single inline/block fragment (paragraph, list item, heading label)
 * that may contain Markdown + limited HTML into sanitized HTML.
 */
export function inlineRichTextToSafeHtml(text: string): string {
  if (!text.trim()) return "";
  const rendered = md.renderInline(text);
  return sanitizeRichHtml(rendered);
}

/** Full markdown document → sanitized HTML (editor round-trips / tests). */
export function markdownToSafeHtml(markdown: string): string {
  if (!markdown.trim()) return "";
  return sanitizeRichHtml(md.render(markdown));
}
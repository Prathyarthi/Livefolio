import MarkdownIt from "markdown-it";
import sanitizeHtml from "sanitize-html";

const md = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false,
});

/** Tags/attrs allowed when rendering or persisting rich description HTML. */
const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
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
  allowedAttributes: {
    a: ["href", "target", "rel", "class", "style"],
    "*": ["class", "style"],
  },
  allowedStyles: {
    "*": {
      // Keep color / font-size; reject expression() and url().
      color: [/^(?!.*(?:expression|url\s*\())[^;]+$/i],
      "font-size": [/^(?!.*(?:expression|url\s*\())[^;]+$/i],
    },
  },
};

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
    const next = attrs
      .replace(/\s*target=(["'])(.*?)\1/gi, "")
      .replace(/\s*rel=(["'])(.*?)\1/gi, "");
    return `<a${next} target="_blank" rel="noopener noreferrer">`;
  });
}

export function sanitizeRichHtml(html: string): string {
  return withNewTabLinks(sanitizeHtml(html, SANITIZE_OPTIONS));
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
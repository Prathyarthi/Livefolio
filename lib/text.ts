/** Strip leading bullet markers — templates add their own list styling. */
export function stripBulletPrefix(line: string): string {
  return line
    .replace(/^[\u2022\u2023\u25E6\u2043\u2219\u2013\u2014•·▪▸►‣]+\s*/, "")
    .replace(/^[-−]\s*/, "")
    .replace(/^\*(?!\*)\s*/, "")
    .trim();
}

export function normalizeMultilineText(text: string): string {
  return text
    .split(/\n+/)
    .map(stripBulletPrefix)
    .filter(Boolean)
    .join("\n");
}

export type DescriptionPart =
  | { type: "heading"; text: string }
  | { type: "item"; text: string };

export type DescriptionGroup =
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] };

const ACTION_VERB_START =
  /^(led|built|developed|created|implemented|designed|managed|owned|improved|reduced|increased|collaborated|worked|helped|wrote|shipped|launched|migrated|optimized|architected|maintained|supported|delivered|drove|established|introduced|refactored|scaled|automated|coordinated|mentored|spearheaded|executed|performed|conducted|analyzed|integrated|deployed|configured|monitored|resolved|fixed|debugged|tested|reviewed|documented|presented|negotiated|achieved|exceeded|generated|grew|transformed|modernized|rebuilt|rewrote|contributed|assisted|participated|responsible)\b/i;

function unwrapHeadingMarkers(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\*\*(.+?)\*\*:?\s*$/, "$1")
    .replace(/^__(.+?)__:?\s*$/, "$1")
    .replace(/:\s*$/, "")
    .trim();
}

function isAllCapsHeading(text: string): boolean {
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 6) return false;
  return letters === letters.toUpperCase();
}

function isTitleCaseHeading(text: string): boolean {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 7) return false;
  const significant = words.filter(
    (word) => !/^(and|or|of|the|a|an|for|in|on|to|&)$/i.test(word),
  );
  if (significant.length === 0) return false;
  return significant.every((word) => /^[\p{Lu}]/u.test(word));
}

export function isDescriptionHeading(line: string, nextLine?: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  if (/^#{1,6}\s+\S/.test(trimmed)) return true;
  if (/^\*\*[^*].+?\*\*:?\s*$/.test(trimmed)) return true;
  if (/^__[^_].+?__:?\s*$/.test(trimmed)) return true;

  const withoutMarkdown = trimmed
    .replace(/^#{1,6}\s+/, "")
    .replace(/^\*\*(.+?)\*\*:?\s*$/, "$1")
    .replace(/^__(.+?)__:?\s*$/, "$1")
    .trim();

  if (/:$/.test(withoutMarkdown)) {
    const title = withoutMarkdown.replace(/:$/, "").trim();
    if (!title || /https?:\/\//i.test(title)) return false;
    const words = title.split(/\s+/).filter(Boolean);
    return words.length >= 1 && words.length <= 8 && title.length <= 80;
  }

  if (!nextLine?.trim()) return false;
  if (/[.!?]$/.test(withoutMarkdown)) return false;
  if (withoutMarkdown.includes(",")) return false;
  if (withoutMarkdown.length > 60) return false;
  if (ACTION_VERB_START.test(withoutMarkdown)) return false;

  const words = withoutMarkdown.split(/\s+/).filter(Boolean);
  if (words.length === 1) {
    const letters = words[0].replace(/[^A-Za-z]/g, "");
    return (
      letters.length >= 8 &&
      /^[\p{Lu}]/u.test(words[0]) &&
      !ACTION_VERB_START.test(withoutMarkdown)
    );
  }
  if (words.length < 2 || words.length > 7) return false;

  return isAllCapsHeading(withoutMarkdown) || isTitleCaseHeading(withoutMarkdown);
}

export function parseDescriptionParts(text: string): DescriptionPart[] {
  const lines = text
    .split(/\n+/)
    .map(stripBulletPrefix)
    .filter(Boolean);

  return lines.map((line, index) => {
    if (isDescriptionHeading(line, lines[index + 1])) {
      return { type: "heading", text: unwrapHeadingMarkers(line) };
    }
    return { type: "item", text: line };
  });
}

export function groupDescriptionParts(parts: DescriptionPart[]): DescriptionGroup[] {
  const groups: DescriptionGroup[] = [];

  for (const part of parts) {
    if (part.type === "heading") {
      groups.push({ type: "heading", text: part.text });
      continue;
    }

    const last = groups[groups.length - 1];
    if (last?.type === "list") {
      last.items.push(part.text);
    } else {
      groups.push({ type: "list", items: [part.text] });
    }
  }

  return groups;
}

/**
 * Tiny front-matter parser for blog posts (no dependency).
 *
 * Supported values: plain / "quoted" / 'quoted' strings, true / false,
 * inline lists `[a, b]` and block lists (`key:` followed by `- item` lines).
 * Not supported: nested objects and multi-line strings. Keep each value on one line.
 */

export type FrontMatterValue = string | boolean | string[];

export type ParsedFrontMatter = {
  data: Record<string, FrontMatterValue>;
  content: string;
};

function unquote(value: string): string {
  const v = value.trim();
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    return v.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  if (v.length >= 2 && v.startsWith("'") && v.endsWith("'")) {
    return v.slice(1, -1).replace(/''/g, "'");
  }
  return v;
}

function splitInlineList(inner: string): string[] {
  const items: string[] = [];
  let current = "";
  let quote: string | null = null;
  for (const char of inner) {
    if (quote) {
      if (char === quote) quote = null;
      current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      current += char;
    } else if (char === ",") {
      items.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  items.push(current);
  return items.map(unquote).filter((item) => item.length > 0);
}

function parseScalar(raw: string): FrontMatterValue {
  const v = raw.trim();
  if (v.startsWith("[") && v.endsWith("]")) {
    return splitInlineList(v.slice(1, -1));
  }
  if (v === "true") return true;
  if (v === "false") return false;
  return unquote(v);
}

export function parseFrontMatter(source: string): ParsedFrontMatter {
  const text = source.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const match = text.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  if (!match) return { data: {}, content: text };

  const data: Record<string, FrontMatterValue> = {};
  const lines = match[1].split("\n");
  let listKey: string | null = null;

  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const listItem = line.match(/^\s+-\s+(.*)$/);
    if (listItem && listKey) {
      const current = data[listKey];
      if (Array.isArray(current)) current.push(unquote(listItem[1]));
      continue;
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):(?:\s+(.*)|\s*)$/);
    if (!pair) {
      throw new Error(`Invalid front matter line: "${line}"`);
    }
    const [, key, rest = ""] = pair;
    if (rest.trim() === "") {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = parseScalar(rest);
      listKey = null;
    }
  }

  return { data, content: text.slice(match[0].length) };
}

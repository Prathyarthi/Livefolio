import { stripBulletPrefix } from "@/lib/text";

export type DescriptionNode =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function headingLabel(text: string): string {
  return text.trim().replace(/:+$/, "").trim();
}

/** Short label lines from resumes ("Achievements:", "Impact:") — not sentences. */
export function isHeadingLine(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed.endsWith(":")) return false;
  const label = headingLabel(trimmed);
  if (label.length < 2 || label.length > 48) return false;
  if (/[.!?]/.test(label)) return false;
  if (/^https?:/i.test(label)) return false;
  const words = label.split(/\s+/);
  return words.length > 0 && words.length <= 6;
}

type ClassifiedLine =
  | { type: "blank" }
  | { type: "heading"; text: string }
  | { type: "text"; text: string };

function classifyLine(raw: string): ClassifiedLine {
  const trimmed = raw.trim();
  if (!trimmed) return { type: "blank" };

  const markdownHeading = trimmed.match(/^#{1,3}\s+(.+)$/);
  if (markdownHeading) {
    const text = headingLabel(markdownHeading[1] ?? "");
    return text ? { type: "heading", text } : { type: "blank" };
  }

  const text = stripBulletPrefix(trimmed);
  if (!text) return { type: "blank" };
  if (isHeadingLine(text)) {
    const heading = headingLabel(text);
    return heading ? { type: "heading", text: heading } : { type: "blank" };
  }
  return { type: "text", text };
}

function flushText(buffer: string[], nodes: DescriptionNode[]) {
  if (buffer.length === 1) {
    nodes.push({ type: "paragraph", text: buffer[0] });
  } else if (buffer.length > 1) {
    nodes.push({ type: "list", items: [...buffer] });
  }
  buffer.length = 0;
}

export function parseDescription(text: string): DescriptionNode[] {
  if (!text.trim()) return [];

  const nodes: DescriptionNode[] = [];
  const buffer: string[] = [];

  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = classifyLine(raw);
    if (line.type === "blank") {
      flushText(buffer, nodes);
      continue;
    }
    if (line.type === "heading") {
      flushText(buffer, nodes);
      nodes.push({ type: "heading", text: line.text });
      continue;
    }
    buffer.push(line.text);
  }
  flushText(buffer, nodes);
  return nodes;
}

function serializeNode(node: DescriptionNode): string {
  if (node.type === "heading") {
    const label = headingLabel(node.text);
    return label ? `${label}:` : "";
  }
  if (node.type === "paragraph") return node.text.trim();
  return node.items.map((item) => item.trim()).filter(Boolean).join("\n");
}

export function serializeDescription(nodes: DescriptionNode[]): string {
  let output = "";
  let previous: DescriptionNode | undefined;

  for (const node of nodes) {
    const chunk = serializeNode(node);
    if (!chunk) continue;
    if (!output) {
      output = chunk;
      previous = node;
      continue;
    }
    const separator = previous?.type === "heading" ? "\n" : "\n\n";
    output += `${separator}${chunk}`;
    previous = node;
  }

  return output;
}

function listItemsFromUnknown(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(/\n+/)
      .map(stripBulletPrefix)
      .filter(Boolean);
  }
  if (!Array.isArray(value)) return [];
  const items: string[] = [];
  for (const entry of value) {
    if (typeof entry === "string") {
      const text = stripBulletPrefix(entry);
      if (text) items.push(text);
      continue;
    }
    const record = asRecord(entry);
    const text = stripBulletPrefix(
      String(record?.text ?? record?.body ?? record?.content ?? ""),
    );
    if (text) items.push(text);
  }
  return items;
}

function mergeNodes(nodes: DescriptionNode[]): DescriptionNode[] {
  const merged: DescriptionNode[] = [];
  for (const node of nodes) {
    const previous = merged[merged.length - 1];
    if (node.type === "list" && previous?.type === "list") {
      previous.items.push(...node.items);
      continue;
    }
    merged.push(
      node.type === "list" ? { type: "list", items: [...node.items] } : node,
    );
  }
  return merged;
}

function nodesFromItem(item: unknown): DescriptionNode[] {
  if (typeof item === "string") return parseDescription(item);
  const record = asRecord(item);
  if (!record) return [];

  const type = String(record.type ?? "").toLowerCase();
  if (type === "heading") {
    const text = headingLabel(
      String(record.text ?? record.heading ?? record.title ?? ""),
    );
    return text ? [{ type: "heading", text }] : [];
  }
  if (type === "paragraph" || type === "text") {
    const text = String(record.text ?? record.body ?? "").trim();
    return text ? [{ type: "paragraph", text }] : [];
  }
  if (type === "list" || type === "bullets") {
    const items = listItemsFromUnknown(record.items ?? record.bullets);
    return items.length > 0 ? [{ type: "list", items }] : [];
  }
  if (type === "bullet" || type === "item") {
    const text = stripBulletPrefix(String(record.text ?? record.body ?? ""));
    return text ? [{ type: "list", items: [text] }] : [];
  }

  const heading = headingLabel(
    String(record.heading ?? record.title ?? ""),
  );
  const items = listItemsFromUnknown(
    record.items ?? record.bullets ?? record.points,
  );
  const nodes: DescriptionNode[] = [];
  if (heading) nodes.push({ type: "heading", text: heading });
  if (items.length > 0) {
    nodes.push({ type: "list", items });
    return nodes;
  }
  const text = String(record.text ?? record.description ?? record.body ?? "").trim();
  if (text) nodes.push(...parseDescription(text));
  return nodes;
}

export function nodesFromUnknown(value: unknown): DescriptionNode[] {
  if (value == null) return [];
  if (typeof value === "string" || typeof value === "number") {
    return parseDescription(String(value));
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    if (value.every((entry) => typeof entry === "string")) {
      const items = value.map((entry) => stripBulletPrefix(entry)).filter(Boolean);
      if (items.length === 0) return [];
      if (
        items.length === 1
        || items.some(
          (item) =>
            item.includes("\n")
            || isHeadingLine(item)
            || /^#{1,3}\s+/.test(item),
        )
      ) {
        return mergeNodes(items.flatMap((item) => parseDescription(item)));
      }
      return [{ type: "list", items }];
    }
    return mergeNodes(value.flatMap((entry) => nodesFromItem(entry)));
  }

  return nodesFromItem(value);
}

/** Canonical stored form: headings, paragraphs, and lists as plain text. */
export function normalizeDescription(value: unknown): string {
  return serializeDescription(nodesFromUnknown(value));
}
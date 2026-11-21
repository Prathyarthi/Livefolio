/** Strip leading bullet markers — templates add their own list styling. */
export function stripBulletPrefix(line: string): string {
  return line
    .replace(/^[\u2022\u2023\u25E6\u2043\u2219•·▪▸►‣\-*]+\s*/, "")
    .replace(/\\+\s*$/, "")
    .trim();
}

export function normalizeMultilineText(text: string): string {
  return text
    .split(/\n+/)
    .map(stripBulletPrefix)
    .filter(Boolean)
    .join("\n");
}
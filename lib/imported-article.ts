export interface ImportedArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  tags: string[];
  readTime?: number;
}

export function plainTextFromHtml(value: string, maxLength = 200): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
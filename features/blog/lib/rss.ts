import { absoluteUrl } from "@/lib/seo";
import { renderMarkdown } from "@/features/blog/lib/markdown";
import {
  BLOG_DESCRIPTION,
  BLOG_PATH,
  BLOG_RSS_PATH,
  BLOG_TITLE,
  postUrl,
} from "@/features/blog/lib/seo";
import type { BlogPost } from "@/features/blog/types";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cdata(value: string): string {
  return `<![CDATA[${value.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/** Make root-relative links and images absolute so feed readers can resolve them. */
function absolutizeHtml(html: string): string {
  return html.replace(/(href|src)="\/(?!\/)/g, `$1="${absoluteUrl("/")}`);
}

export function buildRssFeed(posts: BlogPost[]): string {
  const lastBuild = posts[0]
    ? new Date(`${posts[0].updated ?? posts[0].date}T00:00:00Z`)
    : new Date(0);

  const items = posts
    .map((post) => {
      const url = postUrl(post.slug);
      return `    <item>
      <title>${esc(post.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="true">${esc(url)}</guid>
      <pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate>
      <dc:creator>${esc(post.authorName)}</dc:creator>
      <description>${esc(post.description)}</description>
${post.tags.map((tag) => `      <category>${esc(tag)}</category>`).join("\n")}
      <content:encoded>${cdata(absolutizeHtml(renderMarkdown(post.content)))}</content:encoded>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${esc(BLOG_TITLE)}</title>
    <link>${esc(absoluteUrl(BLOG_PATH))}</link>
    <description>${esc(BLOG_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuild.toUTCString()}</lastBuildDate>
    <atom:link href="${esc(absoluteUrl(BLOG_RSS_PATH))}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>
`;
}

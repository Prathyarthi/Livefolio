import {
  plainTextFromHtml,
  type ImportedArticle,
} from "@/lib/imported-article";

export interface HashnodeProfile {
  username: string;
  name: string;
  profileUrl: string;
  articles: ImportedArticle[];
}

const HASHNODE_TIMEOUT_MS = 20_000;

function feedUrlForInput(input: string): { username: string; feedUrl: string; profileUrl: string } {
  const trimmed = input.trim();
  if (!trimmed) throw new Error("Hashnode username or blog URL is required");

  if (/^https?:\/\//i.test(trimmed) || trimmed.includes(".")) {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    let parsed: URL;
    try {
      parsed = new URL(withProtocol);
    } catch {
      throw new Error("Enter a Hashnode username or a full blog URL");
    }
    const host = parsed.hostname.replace(/^www\./, "");
    const username = host.endsWith(".hashnode.dev")
      ? host.slice(0, -".hashnode.dev".length)
      : host;
    return {
      username,
      feedUrl: `${parsed.origin}/rss.xml`,
      profileUrl: parsed.origin,
    };
  }

  const handle = trimmed.replace(/^@/, "");
  if (!/^[A-Za-z0-9-]+$/.test(handle)) {
    throw new Error("Enter a Hashnode username or a full blog URL");
  }

  const profileUrl = `https://${handle}.hashnode.dev`;
  return {
    username: handle,
    feedUrl: `${profileUrl}/rss.xml`,
    profileUrl,
  };
}

function extractTag(xml: string, tagName: string): string {
  const match = xml.match(new RegExp(`<${tagName}>([^<]*)</${tagName}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function extractCDATA(xml: string, tagName: string): string {
  const match = xml.match(new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i"));
  if (!match) return "";
  const content = match[1] ?? "";
  const cdata = content.match(/!\[CDATA\[([\s\S]*?)\]\]/);
  return (cdata?.[1] ?? content).trim();
}

function parseFeed(xml: string): { name: string; articles: ImportedArticle[] } {
  const channel = xml.match(/<channel>([\s\S]*?)<item>/i)?.[1] ?? xml;
  const name = extractCDATA(channel, "title") || extractTag(channel, "title");
  const articles: ImportedArticle[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1] ?? "";
    const title = extractCDATA(item, "title") || "Untitled";
    const url = extractTag(item, "link") || extractTag(item, "guid");
    const description = plainTextFromHtml(
      extractCDATA(item, "description") || extractTag(item, "description")
    );
    const publishedAt = extractTag(item, "pubDate");
    const tags: string[] = [];
    const categoryRegex = /<category>([\s\S]*?)<\/category>/g;
    let category: RegExpExecArray | null;
    while ((category = categoryRegex.exec(item)) !== null) {
      const tag = (category[1] ?? "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
      if (tag) tags.push(tag);
    }
    if (title && url) {
      articles.push({ title, description, url, publishedAt, tags });
    }
  }

  return { name, articles };
}

export async function fetchHashnodeArticles(input: string): Promise<HashnodeProfile> {
  const target = feedUrlForInput(input);
  const res = await fetch(target.feedUrl, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml",
      "User-Agent": "Livefolio",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(HASHNODE_TIMEOUT_MS),
  });

  const body = await res.text();
  if (!res.ok || !body.includes("<rss")) {
    throw new Error(
      "Hashnode publication not found. Use your username, or paste the blog URL if it uses a custom domain."
    );
  }

  const parsed = parseFeed(body);
  return {
    username: target.username,
    name: parsed.name || target.username,
    profileUrl: target.profileUrl,
    articles: parsed.articles,
  };
}
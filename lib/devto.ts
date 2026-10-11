import {
  plainTextFromHtml,
  type ImportedArticle,
} from "@/lib/imported-article";

export interface DevtoProfile {
  username: string;
  name: string;
  articles: ImportedArticle[];
}

const DEVTO_TIMEOUT_MS = 20_000;

type DevtoArticleResponse = {
  title?: string;
  description?: string | null;
  url?: string;
  published_timestamp?: string;
  tag_list?: string[] | string;
  tags?: string;
  reading_time_minutes?: number;
};

type DevtoUserResponse = {
  username?: string;
  name?: string;
};

export async function fetchDevtoArticles(username: string): Promise<DevtoProfile> {
  const handle = username.trim().replace(/^@/, "");
  if (!handle) throw new Error("Dev.to username is required");

  const headers = {
    Accept: "application/json",
    "User-Agent": "Livefolio",
  };

  const userRes = await fetch(
    `https://dev.to/api/users/by_username?url=${encodeURIComponent(handle)}`,
    { headers, cache: "no-store", signal: AbortSignal.timeout(DEVTO_TIMEOUT_MS) }
  );

  if (userRes.status === 404) {
    throw new Error(`Dev.to user "${handle}" not found`);
  }
  if (!userRes.ok) {
    throw new Error(`Dev.to API error: ${userRes.status}`);
  }

  const user = (await userRes.json()) as DevtoUserResponse;
  const articlesRes = await fetch(
    `https://dev.to/api/articles?username=${encodeURIComponent(handle)}&per_page=30`,
    { headers, cache: "no-store", signal: AbortSignal.timeout(DEVTO_TIMEOUT_MS) }
  );

  if (!articlesRes.ok) {
    throw new Error(`Dev.to API error: ${articlesRes.status}`);
  }

  const payload = (await articlesRes.json()) as DevtoArticleResponse[];
  const articles = (Array.isArray(payload) ? payload : []).flatMap((article) => {
    const title = article.title?.trim();
    const url = article.url?.trim();
    if (!title || !url) return [];

    const tagList = Array.isArray(article.tag_list)
      ? article.tag_list
      : typeof article.tags === "string"
        ? article.tags.split(",").map((tag) => tag.trim())
        : [];

    return [
      {
        title,
        description: plainTextFromHtml(article.description ?? ""),
        url,
        publishedAt: article.published_timestamp ?? "",
        tags: tagList.filter(Boolean),
        readTime:
          typeof article.reading_time_minutes === "number"
            ? Math.max(1, Math.round(article.reading_time_minutes))
            : undefined,
      },
    ];
  });

  return {
    username: user.username?.trim() || handle,
    name: user.name?.trim() || handle,
    articles,
  };
}
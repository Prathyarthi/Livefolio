# Blog posts

Posts live here as markdown files. **Adding a post = dropping in one `.md` file.** No code changes, routes or imports are needed. At build time every post gets:

- an article page at `/blog/<slug>` (statically generated)
- an entry on the `/blog` index (newest first)
- an entry in `/sitemap.xml` and in the RSS feed at `/blog/rss.xml`
- a canonical URL `https://livefolio.me/blog/<slug>` (built from the site base URL, `NEXT_PUBLIC_APP_URL` in production), Open Graph and Twitter tags, and Article JSON-LD
- FAQ JSON-LD when the post has an FAQ section (see below)

Files named `README.md` or starting with `_` are ignored. Only `.md` files are supported (no MDX).

## Front matter template

```yaml
---
title: "Post title"
slug: post-title            # lowercase letters, numbers, hyphens; becomes /blog/post-title
date: 2026-11-15            # YYYY-MM-DD, used for ordering and datePublished
updated: 2026-11-20         # optional, YYYY-MM-DD, used for dateModified and sitemap lastmod
description: "Meta description, also the excerpt on the index (aim for 150 to 160 characters)."
keyword: primary keyword
cover: /blog/post-title.png # file in public/, 1200x630 PNG or JPG works best for social cards
author: Prathyarthi Kashyap, Founder   # optional, this is the default; format "Name, Role"
tags: [portfolio, resume]
draft: false                # optional, true hides the post everywhere
---
```

Required: `title`, `slug`, `date`, `description`, `keyword`, `cover`. The build fails with a clear message if one is missing or invalid, if two posts share a slug, or if the cover file does not exist in `public/`.

Front matter values must fit on one line. Quote values that contain a colon.

## Writing

- Do not add an `# H1`. The page title is the H1. Start sections at `## H2`.
- Raw HTML is not rendered. Use markdown only.
- Images: put files in `public/blog/` and reference them as `![alt text](/blog/file.png)`.
- Never use em dashes in copy.

## FAQ convention

Add a `## FAQ` heading. Each question is a `### Question?` subheading and the answer is the markdown beneath it:

```md
## FAQ

### Can I use Livefolio without a GitHub account?

Yes. Upload a resume PDF and publish.

### Another question?

Another answer.
```

The section renders as normal article content and is also emitted as `FAQPage` JSON-LD. Only the `## FAQ` (or `## Frequently asked questions`) section is read; headings elsewhere are not treated as questions.

## Publishing through the API (no PR)

Posts can also be created and published without a repo change through a protected API. They are stored in the `blog_posts` table and render exactly like file posts (same page, index, sitemap, RSS, Open Graph and JSON-LD, including the FAQ convention above). Drafts are never public: their URL returns 404 until the post is published.

Every request needs `Authorization: Bearer <BLOG_API_KEY>`. If `BLOG_API_KEY` is not set on the server, every call is rejected with 503.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/blog` | Create a post (draft by default). 201 `{ slug, status, url }` |
| `GET` | `/api/blog/<slug>` | Read a post, drafts included |
| `PATCH` | `/api/blog/<slug>` | Partial update. `{"status":"published"}` publishes a draft |

Fields: `title`, `slug`, `date` (YYYY-MM-DD), `description`, `keyword`, `body` (markdown) are required on create; `cover` (absolute https URL, 1200x630 recommended; the default OG image is used when omitted), `author` ("Name, Role", defaults to the founder), `tags` (string array) and `status` (`draft` or `published`) are optional. The slug cannot be changed with PATCH. Unknown fields and em dashes are rejected with 400. A slug already used by a file post or an API post returns 409.

```bash
curl -X POST https://livefolio.me/api/blog \
  -H "Authorization: Bearer $BLOG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Post title","slug":"post-title","date":"2026-11-20","description":"Meta description.","keyword":"primary keyword","tags":["portfolio"],"body":"Intro paragraph.\n\n## FAQ\n\n### A question?\n\nThe answer."}'

curl -X PATCH https://livefolio.me/api/blog/post-title \
  -H "Authorization: Bearer $BLOG_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status":"published"}'
```

Writes refresh `/blog`, the post page, the RSS feed and the sitemap right away. If the database is unreachable, the public blog keeps serving file posts.

## Cross-posting (Medium, Dev.to, Hashnode)

These posts are the canonical source. When cross-posting, set the canonical URL on the other platform to `https://livefolio.me/blog/<slug>`. The RSS feed at `https://livefolio.me/blog/rss.xml` includes the full article HTML.

## Preview

```bash
bun dev
# http://localhost:3000/blog
```

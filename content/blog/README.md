# Blog posts

You can manage posts in two ways:

1. **Admin CMS** (preferred): `/admin/blog` for emails listed in `ADMIN_EMAILS`. Create, edit, publish and delete posts there. APIs under `/api/admin/blog` are `requireAdmin()` only.
2. **Markdown files** (fallback): drop a `.md` file here. DB posts override the same slug.

At runtime every published post gets:

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

## Cross-posting (Medium, Dev.to, Hashnode)

These posts are the canonical source. When cross-posting, set the canonical URL on the other platform to `https://livefolio.me/blog/<slug>`. The RSS feed at `https://livefolio.me/blog/rss.xml` includes the full article HTML.

## Preview

```bash
bun dev
# http://localhost:3000/blog
```

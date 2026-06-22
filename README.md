# blog-tanstack — deco.cx Blog Template

A production-ready blog template built with [TanStack Start](https://tanstack.com/start), [deco.cx](https://deco.cx) CMS, and Tailwind CSS v4. Supports server-side rendering, reading progress, search, categories, authors, and a magazine-style layout.

## Features

- **Magazine layout** — hero cover story, duo feature grid, and article feed on the home page
- **Full-text search** — server-side filtered search with highlighted matches
- **Categories & Authors** — filtered listing pages with paginated results
- **Reading progress bar** — visible on individual post pages
- **Hero scroll header** — transparent header transitions to white/blur on scroll over post cover images
- **Responsive** — mobile-first with a slide-out drawer menu
- **CMS-powered** — all content is managed via `.deco/blocks/` JSON files and the deco.cx admin

## Getting started

### Requirements

- [Bun](https://bun.sh) (recommended) or Node.js 20+

### Install and run

```sh
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build for production

```sh
bun run build
bun run start
```

## Project structure

```
src/
  sections/Blog/       # All blog UI sections (BlogHome, BlogHeader, BlogSearch, …)
  sections/Seo/        # SEO sections (SeoBlogPost, SeoV2)
  loaders/             # Custom loaders (BlogpostList → BlogPost[])
  server/cms/          # Generated CMS wiring (sections.gen.ts, loaders.gen.ts, blocks.gen.json)
  setup.ts             # CMS bootstrap — registers loaders, sections, and request-to-param

.deco/blocks/          # CMS content (posts, categories, authors, pages)
```

## Content management

### Adding posts

Create a file in `.deco/blocks/collections%2Fblog%2Fposts/your-post.json`:

```json
{
  "name": "collections/blog/posts/your-post",
  "__resolveType": "blog/loaders/Blogpost.ts",
  "post": {
    "title": "Your Post Title",
    "slug": "your-post",
    "date": "2025-01-01",
    "excerpt": "Short description…",
    "image": "https://images.unsplash.com/photo-…?w=1280&h=720&fit=crop&q=80",
    "authors": [{ "name": "Author Name", "email": "author@example.com" }],
    "categories": [{ "name": "Engineering", "slug": "engineering" }],
    "sections": []
  }
}
```

Then add the entry to `src/server/cms/blocks.gen.json` (or run the CMS regeneration script).

### Adding categories / authors

Follow the same pattern in:
- `.deco/blocks/collections%2Fblog%2Fcategories/`
- `.deco/blocks/collections%2Fblog%2Fauthors/`

## Deployment

This template is pre-configured for [deco.cx hosting](https://deco.cx):

```sh
git push origin main
```

The production site is available at `https://blog-tanstack.deco.site`.

## Links

- [deco.cx docs](https://www.deco.cx/docs/en/overview)
- [TanStack Start docs](https://tanstack.com/start/latest)
- [Blog app source (@decocms/apps)](https://github.com/deco-cx/apps/tree/main/blog)
- [Discord](https://deco.cx/discord)

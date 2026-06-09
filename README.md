# Semperr

The marketing site and blog for [Semperr](https://www.semperr.com) — a data brokerage that helps law firms drive lead volume and connect with higher-value clients.

![Semperr](public/images/og/home.jpg)

## Overview

Semperr delivers pre-qualified, high-intent leads to law firms specializing in personal injury, mass tort, and other practice areas. This repository powers the public-facing website including the homepage, about page, blog, and resource pages.

## Tech stack

- [Next.js](https://nextjs.org) (App Router)
- [Once UI](https://once-ui.com) component library
- MDX for blog content
- Deployed on [Vercel](https://vercel.com)

## Getting started

```bash
npm install
npm run dev
```

## Project structure

```
src/
  app/           # Next.js pages (home, about, blog, work, terms, privacy)
  components/    # Shared components (Header, Footer, blog posts, etc.)
  resources/     # Site config, content, icons, and styles
    content.tsx          # All page copy and metadata
    once-ui.config.ts    # Theme, routes, SEO, and design tokens
  utils/         # Helpers (MDX parsing, date formatting)
```

## Blog

Blog posts live in `src/app/blog/posts/` as `.mdx` files. Add a new file to publish a new post.
# Automated News Feed — newsdata.io

## Overview

The homepage news section pulls fresh articles from
[newsdata.io](https://newsdata.io) **every 2 hours** (on the even hour, UTC),
maintains a rolling **1-year archive**, validates every image URL via HEAD
request before trusting it, and **never downloads external images** — it only
links to them.

The GitHub Action writes to the `news-data` branch as a single force-pushed
commit so the repo never accumulates news commits.

---

## How it works

```
GitHub Action (every 2 hours, cron "0 */2 * * *")
  │
  ├─ Checkout news-data branch  (reads existing data/news.json)
  ├─ Pull latest aggregate-news.js from main branch
  ├─ Run scripts/aggregate-news.js
  │     ├─ fetch newsdata.io: category=business
  │     ├─ fetch newsdata.io: category=technology
  │     ├─ fetch newsdata.io: q="legal tech" OR "legaltech" …
  │     ├─ normalize → canonical article shape
  │     ├─ dedupe (fresh batch + existing archive, by link)
  │     ├─ HEAD-check new image URLs
  │     │     • require HTTPS + 200 + content-type: image/*
  │     │     • timeout 5s, concurrency 12
  │     ├─ merge with existing archive
  │     ├─ prune > 365 days, cap at 5000 articles
  │     └─ write data/news.json
  └─ git commit --amend + force push to news-data
```

The frontend (`index.html`) fetches
`https://raw.githubusercontent.com/maherhasannn/semperr/news-data/data/news.json`
with an hourly cache-buster, then renders a robust mosaic that adapts to
however many images came back.

---

## Required setup (one-time)

### 1. Add the API key to GitHub Secrets

Repo → Settings → Secrets and variables → Actions → **New repository secret**

- Name: `NEWSDATA_API_KEY`
- Value: your `pub_…` key from newsdata.io

### 2. Ensure the `news-data` branch exists

If it doesn't already, create it from main:

```bash
git checkout --orphan news-data
git rm -rf .
mkdir data && echo '{"articles":[],"lastUpdated":"2026-01-01T00:00:00Z","articleCount":0}' > data/news.json
git add data/news.json
git commit -m "Initial news-data branch"
git push origin news-data
```

### 3. Trigger the first run manually

GitHub → Actions → **Update News Feed** → **Run workflow**

---

## Canonical article shape (`data/news.json`)

```json
{
  "lastUpdated": "2026-04-24T18:53:33.841Z",
  "articleCount": 70,
  "provider": "newsdata.io",
  "retentionDays": 365,
  "categories": { "Enterprise": 29, "Tech": 24, "AI": 7, "Legal": 10 },
  "articles": [
    {
      "title": "…",
      "link": "https://…",
      "source": "Express",
      "category": "Enterprise",
      "description": "… (max 240 chars)",
      "image": "https://…jpg",       // null if no valid image
      "publishedAt": 1777013580000,   // unix ms
      "author": "rachel vickers-price"
    }
  ]
}
```

Categories assigned by `classify()` in `scripts/aggregate-news.js`:

- `Legal` — legal-focused query, or matches legal keywords
- `AI` — title/description matches AI/ML keywords
- `Finance` — business query + venture/funding/M&A keywords
- `Enterprise` — business query, everything else
- `Tech` — technology query, non-AI

---

## Images: linked, never downloaded

1. `aggregate-news.js` makes a **HEAD request** on every new `image_url`.
2. Rejects anything that is not `https://`, not `200 OK`, or whose
   `Content-Type` doesn't start with `image/`.
3. Invalid URLs are stored as `image: null` — the frontend then renders the
   article as a text card instead.
4. Previously-validated images are **not re-checked** on subsequent runs,
   which keeps us comfortably under newsdata.io's 200-requests/day free tier.
5. Client-side `onerror` is a belt-and-braces fallback: if an image fails at
   render time (e.g. the origin went down after we validated), its media box
   is hidden so the card gracefully collapses.

---

## Robust mosaic

The frontend (`index.html`, the `Live News Feed` IIFE) is now tolerant of
arbitrary image counts and aspect ratios returned by newsdata.io:

- Featured card only if a valid image exists.
- Side image cards use `aspect-ratio: 16 / 10` + `object-fit: cover`, so any
  image shape is cropped consistently.
- `grid-auto-flow: dense` fills holes left by collapsed / failed cards.
- **Two mini sections** are injected between rows:
  - `Editor's Briefs` — 3 headline + snippet cards, mid-grid
  - `Also on the Radar` — 3 headline + snippet cards, after the main grid
- `We're Also Reading` — text-only roundup of whatever remains.

---

## Manual runs

```bash
# Local
NEWSDATA_API_KEY=pub_xxx npm run update-news
# writes ./data/news.json

# Remote: GitHub Actions → Update News Feed → Run workflow
```

---

## Tuning

| Knob | Where | Default |
|---|---|---|
| Cron schedule | `.github/workflows/update-news.yml` | `0 */2 * * *` |
| Queries | `QUERIES` in `scripts/aggregate-news.js` | 3 queries |
| Pages per query | env `NEWSDATA_MAX_PAGES` | `1` (10 articles) |
| HEAD concurrency | `HEAD_CONCURRENCY` | `12` |
| HEAD timeout | `HEAD_TIMEOUT_MS` | `5000` ms |
| Retention | `ONE_YEAR_MS` | 365 days |
| Archive cap | `MAX_ARCHIVE` | 5000 articles |

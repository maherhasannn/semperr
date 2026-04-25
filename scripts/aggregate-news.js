#!/usr/bin/env node
/**
 * The Charterr — newsdata.io aggregator.
 *
 * Pulls fresh articles every run, merges them into a rolling 1-year
 * archive, validates image URLs via HEAD request, and writes
 * data/news.json. External images are NEVER downloaded, only linked to;
 * if an image URL cannot be validated it is dropped.
 *
 * Required env:
 *   NEWSDATA_API_KEY  — from https://newsdata.io (pub_...)
 * Optional env:
 *   NEWSDATA_MAX_PAGES  — per-query page fetches (default 1)
 */

const fs = require('fs').promises;
const path = require('path');

const API_KEY = process.env.NEWSDATA_API_KEY;
const MAX_PAGES = parseInt(process.env.NEWSDATA_MAX_PAGES || '1', 10);
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const MAX_ARCHIVE = 5000;
const HEAD_CONCURRENCY = 12;
const HEAD_TIMEOUT_MS = 5000;

if (!API_KEY) {
  console.error('ERROR: NEWSDATA_API_KEY environment variable is required.');
  process.exit(1);
}

// US/Canada + Europe only. Post-filtered against the returned `country` field
// because some aggregators (e.g. Econotimes) list multiple countries.
const COUNTRY_ALLOWLIST = new Set([
  // North America (Americas only)
  'united states of america', 'canada',
  // UK & Ireland
  'united kingdom', 'ireland',
  // Western Europe
  'germany', 'france', 'italy', 'spain', 'portugal', 'netherlands', 'belgium',
  'luxembourg', 'switzerland', 'austria',
  // Northern Europe / Nordics
  'sweden', 'norway', 'denmark', 'finland', 'iceland',
  // Central / Eastern Europe
  'poland', 'czech republic', 'slovakia', 'hungary', 'slovenia', 'estonia',
  'latvia', 'lithuania',
  // Southern Europe
  'greece', 'malta', 'cyprus', 'croatia',
]);
// newsdata.io caps this param at 5 countries. We send the 5 largest
// English/European markets on the wire; the full COUNTRY_ALLOWLIST is
// enforced post-fetch so anything from a smaller EU market that the API
// happens to return (e.g. multi-country aggregators) is still accepted.
const COUNTRY_QUERY = ['us','gb','ca','de','fr'].join(',');

// Queries run on every refresh. Kept conservative to stay well under the
// 200 requests/day free tier (we run 12x/day).
const QUERIES = [
  { name: 'Business',   baseCategory: 'business',   params: { category: 'business',   country: COUNTRY_QUERY } },
  { name: 'Technology', baseCategory: 'technology', params: { category: 'technology', country: COUNTRY_QUERY } },
  { name: 'Legal',      baseCategory: 'legal',      params: { q: '"legal tech" OR "legaltech" OR "law firm AI" OR "legal AI"', country: COUNTRY_QUERY } },
];

function passesCountryFilter(a) {
  const countries = Array.isArray(a.country) ? a.country : [];
  if (!countries.length) return false; // no country info → drop
  return countries.some(c => COUNTRY_ALLOWLIST.has(String(c).toLowerCase()));
}

// ---------------------------------------------------------------------------
// newsdata.io fetch
// ---------------------------------------------------------------------------

async function fetchQuery(query) {
  const out = [];
  let page = null;
  for (let i = 0; i < MAX_PAGES; i++) {
    const url = new URL('https://newsdata.io/api/1/latest');
    url.searchParams.set('apikey', API_KEY);
    url.searchParams.set('language', 'en');
    url.searchParams.set('removeduplicate', '1');
    for (const [k, v] of Object.entries(query.params)) url.searchParams.set(k, v);
    if (page) url.searchParams.set('page', page);

    try {
      const res = await fetch(url.toString());
      if (!res.ok) {
        console.error(`[${query.name}] HTTP ${res.status}`);
        break;
      }
      const json = await res.json();
      if (json.status !== 'success') {
        console.error(`[${query.name}] API status=${json.status} message=${json.message}`);
        break;
      }
      out.push(...(json.results || []));
      page = json.nextPage;
      if (!page) break;
    } catch (err) {
      console.error(`[${query.name}] fetch error:`, err.message);
      break;
    }
  }
  console.log(`[${query.name}] fetched ${out.length} raw items`);
  return { raw: out, query };
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

const AI_KEYWORDS = /\b(ai|a\.i\.|artificial intelligence|machine learning|\bllm\b|gen ?ai|openai|anthropic|\bgpt\b|claude|gemini|copilot|chatgpt|neural net|large language model)\b/i;
const FINANCE_KEYWORDS = /\b(venture|\bvc\b|startup|seed round|series [a-z]\b|funding round|raises? \$|ipo|acquires?|acquisition|private equity|\bpe\b|hedge fund|m&a|buyout)\b/i;
const LEGAL_KEYWORDS = /\b(law firm|legal tech|legaltech|legal ai|lawyer|attorney|litigation|bigLaw|in-house counsel)\b/i;

function classify(article, baseCategory) {
  const text = `${article.title || ''} ${article.description || ''}`;
  if (baseCategory === 'legal') return 'Legal';
  if (AI_KEYWORDS.test(text)) return 'AI';
  if (LEGAL_KEYWORDS.test(text)) return 'Legal';
  if (baseCategory === 'business') {
    if (FINANCE_KEYWORDS.test(text)) return 'Finance';
    return 'Enterprise';
  }
  return 'Tech';
}

function parsePubDate(s) {
  if (!s) return Date.now();
  // newsdata.io returns "YYYY-MM-DD HH:MM:SS" (UTC).
  const iso = s.replace(' ', 'T') + 'Z';
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : Date.now();
}

function cleanDescription(text, maxLength = 240) {
  if (!text) return '';
  const cleaned = String(text).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (cleaned.length > maxLength) return cleaned.slice(0, maxLength).trim() + '…';
  return cleaned;
}

function normalize(raw, query) {
  const out = [];
  let droppedForCountry = 0;
  for (const r of raw) {
    if (!r.title || !r.link) continue;
    if (r.duplicate) continue;
    if (!passesCountryFilter(r)) { droppedForCountry++; continue; }
    const primaryCountry = Array.isArray(r.country)
      ? (r.country.find(c => COUNTRY_ALLOWLIST.has(String(c).toLowerCase())) || r.country[0])
      : null;
    const article = {
      title: String(r.title).trim(),
      link: String(r.link).trim(),
      source: r.source_name || r.source_id || 'Unknown',
      country: primaryCountry ? String(primaryCountry).toLowerCase() : null,
      category: classify(r, query.baseCategory),
      description: cleanDescription(r.description),
      image: typeof r.image_url === 'string' && r.image_url.trim() ? r.image_url.trim() : null,
      imageSize: 0,
      publishedAt: parsePubDate(r.pubDate),
      author: Array.isArray(r.creator) && r.creator.length ? r.creator[0] : null,
    };
    out.push(article);
  }
  if (droppedForCountry) {
    console.log(`[${query.name}] dropped ${droppedForCountry} articles outside US/EU allowlist`);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Image validation (HEAD request, never downloads the body)
// ---------------------------------------------------------------------------

async function validateImage(url) {
  if (!url) return null;
  if (!/^https:\/\//i.test(url)) return null;

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), HEAD_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: ac.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CharterrBot/1.0)' },
    });
    if (!res.ok) return null;
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (!ct.startsWith('image/')) return null;
    const cl = parseInt(res.headers.get('content-length') || '0', 10);
    return { url, size: cl || 0 };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function validateAllImages(articles) {
  let i = 0;
  let kept = 0;
  let dropped = 0;
  async function worker() {
    while (i < articles.length) {
      const idx = i++;
      const a = articles[idx];
      if (!a.image) continue;
      const result = await validateImage(a.image);
      if (result) {
        kept++;
        a.imageSize = result.size;
      } else {
        a.image = null;
        a.imageSize = 0;
        dropped++;
      }
    }
  }
  const workers = Array.from({ length: HEAD_CONCURRENCY }, worker);
  await Promise.all(workers);
  console.log(`Image validation: ${kept} kept, ${dropped} dropped`);
  return articles;
}

// ---------------------------------------------------------------------------
// Archive merge
// ---------------------------------------------------------------------------

async function loadArchive(file) {
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.articles)) return parsed.articles;
  } catch {
    /* no existing archive */
  }
  return [];
}

function mergeAndPrune(archive, fresh) {
  const now = Date.now();
  const cutoff = now - ONE_YEAR_MS;
  const map = new Map();
  // Existing archive first, then fresh — fresh overwrites on duplicate link.
  // Retroactively apply country allowlist so any previously-stored foreign
  // article gets purged on next run.
  let retroDropped = 0;
  for (const a of archive) {
    if (!a || !a.link) continue;
    if (a.publishedAt <= cutoff) continue;
    if (a.country && !COUNTRY_ALLOWLIST.has(String(a.country).toLowerCase())) {
      retroDropped++;
      continue;
    }
    // Legacy articles without `country` are grandfathered in so the first run
    // after deploying this filter doesn't nuke the entire archive. Fresh
    // runs will replace them over time.
    map.set(a.link, a);
  }
  for (const a of fresh) {
    if (a.publishedAt > cutoff) map.set(a.link, a);
  }
  if (retroDropped) console.log(`Retroactively dropped ${retroDropped} archive articles outside allowlist`);
  const all = Array.from(map.values());
  all.sort((a, b) => b.publishedAt - a.publishedAt);
  return all.slice(0, MAX_ARCHIVE);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const cwd = process.cwd();
  const dataDir = path.join(cwd, 'data');
  const outPath = path.join(dataDir, 'news.json');

  console.log('Starting newsdata.io aggregation...');
  console.log(`Archive target: ${outPath}`);

  await fs.mkdir(dataDir, { recursive: true });
  const archive = await loadArchive(outPath);
  console.log(`Existing archive: ${archive.length} articles`);

  const results = await Promise.all(QUERIES.map(fetchQuery));
  let fresh = results.flatMap(({ raw, query }) => normalize(raw, query));
  console.log(`Normalized fresh articles: ${fresh.length}`);

  // Dedupe fresh batch against itself (different queries can return overlap)
  const seen = new Set();
  fresh = fresh.filter(a => {
    if (seen.has(a.link)) return false;
    seen.add(a.link);
    return true;
  });
  console.log(`After intra-batch dedupe: ${fresh.length}`);

  // Only validate images for articles that aren't already in the archive with
  // a known-good image — saves HEAD requests over time.
  const archiveByLink = new Map(archive.map(a => [a.link, a]));
  const toValidate = fresh.filter(a => {
    const existing = archiveByLink.get(a.link);
    if (existing && existing.image && existing.image === a.image) {
      // Carry forward imageSize from prior run
      a.imageSize = existing.imageSize || 0;
      return false;
    }
    return true;
  });
  console.log(`Image HEAD checks needed: ${toValidate.length} / ${fresh.length}`);
  await validateAllImages(toValidate);

  const merged = mergeAndPrune(archive, fresh);

  const categories = {};
  let withImg = 0;
  for (const a of merged) {
    categories[a.category] = (categories[a.category] || 0) + 1;
    if (a.image) withImg++;
  }

  const output = {
    lastUpdated: new Date().toISOString(),
    articleCount: merged.length,
    provider: 'newsdata.io',
    retentionDays: 365,
    categories,
    articles: merged,
  };

  await fs.writeFile(outPath, JSON.stringify(output, null, 2));
  console.log('---');
  console.log(`Wrote ${outPath}`);
  console.log(`Total: ${merged.length} articles  (with valid image: ${withImg})`);
  console.log('Categories:', categories);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Daily quote rotation for The Charterr.
 *
 * Reads data/quotes.json (all 90 quotes), picks the quote for today
 * based on UTC day-of-year, and writes data/daily-quote.json with
 * just that single entry. The frontend fetches daily-quote.json.
 *
 * Deterministic: same UTC date → same quote for all visitors.
 */

const fs = require('fs').promises;
const path = require('path');

async function main() {
  const cwd = process.cwd();
  const quotesPath = path.join(cwd, 'data', 'quotes.json');
  const outPath = path.join(cwd, 'data', 'daily-quote.json');

  const raw = await fs.readFile(quotesPath, 'utf8');
  const { quotes } = JSON.parse(raw);

  if (!quotes || !quotes.length) {
    console.error('No quotes found in', quotesPath);
    process.exit(1);
  }

  // Day-of-year (UTC), 0-indexed.
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  const dayOfYear = Math.floor((now - start) / (24 * 60 * 60 * 1000));
  const index = dayOfYear % quotes.length;

  const pick = quotes[index];

  const output = {
    date: now.toISOString().slice(0, 10),
    index,
    total: quotes.length,
    quote: pick,
  };

  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, JSON.stringify(output, null, 2));

  console.log(`Quote ${index + 1}/${quotes.length} for ${output.date}:`);
  console.log(`  "${pick.text.slice(0, 80)}…"`);
  console.log(`  — ${pick.author}`);
  console.log(`Wrote ${outPath}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});

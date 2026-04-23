#!/usr/bin/env node

const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'thumbnail'],
      ['enclosure', 'enclosure'],
      ['content:encoded', 'fullContent']
    ]
  }
});

// News sources configuration
const SOURCES = [
  // Finance/PE/VC - ✅ Working sources
  { name: 'Crunchbase News', url: 'https://news.crunchbase.com/feed/', category: 'Finance' },
  { name: 'PE Hub', url: 'https://www.pehub.com/feed/', category: 'Finance' },

  // Legal Tech - ✅ Working sources
  { name: 'Above the Law', url: 'https://abovethelaw.com/feed/', category: 'Legal' },
  { name: 'Artificial Lawyer', url: 'https://www.artificiallawyer.com/feed/', category: 'Legal' },

  // AI/ML - ✅ Working sources
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/', category: 'AI' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/', category: 'AI' },

  // Enterprise/SaaS - ✅ Working sources
  { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'Enterprise' },
  { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'Tech' },
  { name: 'Ars Technica', url: 'https://feeds.arstechnica.com/arstechnica/index', category: 'Tech' },

  // Additional sources to reach 2 dozen (add more as needed)
  { name: 'Hacker News', url: 'https://hnrss.org/frontpage', category: 'Tech' },
  { name: 'MIT Tech Review', url: 'https://www.technologyreview.com/feed/', category: 'Tech' },
  { name: 'Wired', url: 'https://www.wired.com/feed/rss', category: 'Tech' },
];

// Extract image URL from article
function extractImageUrl(item) {
  // Try enclosure first (most RSS feeds)
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }

  // Try media:content
  if (item.media && item.media.$) {
    return item.media.$.url;
  }

  // Try media:thumbnail
  if (item.thumbnail && item.thumbnail.$) {
    return item.thumbnail.$.url;
  }

  // Try extracting from content:encoded HTML
  if (item.fullContent) {
    const imgMatch = item.fullContent.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) return imgMatch[1];
  }

  // Try extracting from description HTML
  if (item.content) {
    const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) return imgMatch[1];
  }

  return null;
}

// Clean and truncate description
function cleanDescription(text, maxLength = 200) {
  if (!text) return '';

  // Remove HTML tags
  const cleaned = text.replace(/<[^>]*>/g, '').trim();

  // Truncate
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength).trim() + '...';
  }

  return cleaned;
}

// Fetch articles from a single source
async function fetchSource(source) {
  try {
    console.log(`Fetching ${source.name}...`);
    const feed = await parser.parseURL(source.url);

    return feed.items.map(item => ({
      title: item.title,
      link: item.link,
      source: source.name,
      category: source.category,
      description: cleanDescription(item.contentSnippet || item.content),
      image: extractImageUrl(item),
      publishedAt: new Date(item.pubDate || item.isoDate).getTime(),
      author: item.creator || item.author || null,
    }));
  } catch (error) {
    console.error(`Error fetching ${source.name}:`, error.message);
    return [];
  }
}

// Main aggregation function
async function aggregateNews() {
  console.log('Starting news aggregation...');

  // Fetch all sources in parallel
  const results = await Promise.all(
    SOURCES.map(source => fetchSource(source))
  );

  // Flatten and combine all articles
  let allArticles = results.flat();

  // Sort by published date (newest first)
  allArticles.sort((a, b) => b.publishedAt - a.publishedAt);

  // Auto-prune: Keep only last 90 days
  const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
  allArticles = allArticles.filter(article => article.publishedAt > ninetyDaysAgo);

  // Limit to 100 most recent articles to keep file size reasonable
  allArticles = allArticles.slice(0, 100);

  console.log(`Aggregated ${allArticles.length} articles from ${SOURCES.length} sources`);

  // Create output object
  const output = {
    lastUpdated: new Date().toISOString(),
    articleCount: allArticles.length,
    articles: allArticles,
  };

  // Ensure data directory exists
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.mkdir(dataDir, { recursive: true });
  } catch (err) {
    // Directory might already exist
  }

  // Write to file
  const outputPath = path.join(dataDir, 'news.json');
  await fs.writeFile(outputPath, JSON.stringify(output, null, 2));

  console.log(`✅ News feed saved to ${outputPath}`);
  console.log(`   Articles: ${allArticles.length}`);
  console.log(`   Categories: ${[...new Set(allArticles.map(a => a.category))].join(', ')}`);
}

// Run
aggregateNews().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

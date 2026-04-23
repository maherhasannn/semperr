# Automated News Feed System

## 🎯 Overview

Your news feed automatically updates every 12 hours (6am & 6pm UTC) by aggregating articles from 12+ sources across Finance, Legal Tech, AI, and Enterprise.

**Zero commit bloat:** The `news-data` branch is force-pushed each update, keeping only 1 commit forever.

---

## 📡 How It Works

```
GitHub Action (every 12 hours)
  ↓
Fetches RSS feeds from 12 sources
  ↓
Extracts articles with images
  ↓
Auto-prunes articles older than 90 days
  ↓
Force-pushes to news-data branch
  ↓
Updates data/news.json
```

---

## 🗞️ Current Sources (12 feeds)

### Finance & PE/VC
- ✅ Crunchbase News
- ✅ PE Hub

### Legal Tech
- ✅ Above the Law
- ✅ Artificial Lawyer

### AI & ML
- ✅ VentureBeat AI
- ✅ TechCrunch AI

### Enterprise & Tech
- ✅ TechCrunch
- ✅ The Verge
- ✅ Ars Technica
- ✅ Hacker News
- ✅ MIT Tech Review
- ✅ Wired

**All sources provide images via RSS feeds** (no web scraping needed!)

---

## 📥 Using the News Feed on Your Site

### Fetch from the news-data branch:

```javascript
// Fetch latest news
fetch('https://raw.githubusercontent.com/maherhasannn/semperr/news-data/data/news.json')
  .then(res => res.json())
  .then(data => {
    console.log(`${data.articleCount} articles`);
    console.log(`Last updated: ${data.lastUpdated}`);

    // Loop through articles
    data.articles.forEach(article => {
      console.log(article.title);
      console.log(article.source);
      console.log(article.category);
      console.log(article.image); // Null if no image
    });
  });
```

### Article structure:

```json
{
  "title": "Era computer raises $11M to build...",
  "link": "https://techcrunch.com/...",
  "source": "TechCrunch",
  "category": "Enterprise",
  "description": "Era thinks that we will see many...",
  "image": "https://...",
  "publishedAt": 1776960000000,
  "author": "Ivan Mehta"
}
```

---

## 🔧 Manual Trigger

Test the workflow anytime:
1. Go to: `Actions` tab on GitHub
2. Select `Update News Feed`
3. Click `Run workflow`

---

## ➕ Adding More Sources

Edit `scripts/aggregate-news.js`:

```javascript
const SOURCES = [
  // Add any RSS feed
  { name: 'Source Name', url: 'https://example.com/feed/', category: 'Category' },
];
```

Then push to main. The next scheduled run will include it.

---

## 📊 Current Stats

- **100 articles** (last 90 days)
- **12 sources** aggregated
- **Auto-prunes** old content
- **5 categories:** Finance, Legal, AI, Enterprise, Tech
- **Updates:** Every 12 hours
- **File size:** ~200KB

---

## 🚀 Next Steps

Want to display news on your homepage? I can build:

1. **News carousel** - Rotating featured articles
2. **Category filters** - Filter by Finance/Legal/AI/Tech
3. **Latest news sidebar** - Real-time updates
4. **Email digest** - Daily/weekly newsletter

Just let me know!

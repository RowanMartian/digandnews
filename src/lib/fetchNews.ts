import type { NewsItem } from '../data/news';

const NEWS_CATEGORY: Record<string, 'history' | 'archaeology' | 'paleontology'> = {
  archaeology: 'archaeology',
  archeology: 'archaeology',
  paleontology: 'paleontology',
  dinosaur: 'paleontology',
  dinosaurs: 'paleontology',
  fossil: 'paleontology',
  history: 'history',
  ancient: 'history',
  roman: 'history',
  medieval: 'history',
  excavation: 'archaeology',
  discovery: 'archaeology',
};

function inferCategory(title: string, description: string): 'history' | 'archaeology' | 'paleontology' {
  const text = `${title} ${description}`.toLowerCase();
  if (/paleontol|dinosaur|fossil|cretaceous|jurassic|triassic|theropod|sauropod|tyrannosaur|fossil/.test(text)) return 'paleontology';
  if (/archaeolog|excavation|dig|artifact|mummy|tomb|mosaic|roman|egypt|pompeii|neanderthal|cave art|pottery/.test(text)) return 'archaeology';
  return 'history';
}

const RSS_FEEDS = [
  'https://rss.sciencedaily.com/all.xml',
  'https://www.sciencedaily.com/rss/fossils_ruins.xml',
  'https://www.sciencedaily.com/rss/fossils_ruins/paleontology.xml',
  'https://www.sciencedaily.com/rss/fossils_ruins/archaeology.xml',
  'https://www.sci.news/feeds/news.paleontology.xml',
  'https://www.sci.news/feeds/news.archaeology.xml',
  'https://www.archaeology.org/feed',
];

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

function parseRssXml(xml: string): { title: string; description: string; link: string; pubDate: string }[] {
  const items: { title: string; description: string; link: string; pubDate: string }[] = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? '';
    const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() ?? block.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? '';
    const desc = block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1]?.replace(/<[^>]+>/g, '').trim() ?? '';
    const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() ?? '';
    if (title) items.push({ title, description: desc, link, pubDate });
  }
  return items;
}

function formatDate(pubDate: string): string {
  if (!pubDate) return new Date().toISOString().slice(0, 10);
  try {
    const d = new Date(pubDate);
    return isNaN(d.getTime()) ? pubDate.slice(0, 10) : d.toISOString().slice(0, 10);
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function normalizeLink(link: string): string {
  const s = link.trim();
  if (!s) return '';
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, '').toLowerCase();
    const path = u.pathname.replace(/\/+$/, '') || '/';
    return `${host}${path}`;
  } catch {
    return s.toLowerCase();
  }
}

function dedupeKey(link: string, title: string): string {
  if (link) return normalizeLink(link);
  return title.toLowerCase().trim().slice(0, 100);
}

export async function fetchNewsFromFeeds(): Promise<NewsItem[]> {
  const seen = new Set<string>();
  const results: NewsItem[] = [];
  const feedUrls = RSS_FEEDS.map((url) => CORS_PROXY + encodeURIComponent(url));
  let idCounter = 0;

  await Promise.all(
    feedUrls.map(async (url) => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const text = await res.text();
        const items = parseRssXml(text);
        for (const it of items) {
          const key = dedupeKey(it.link, it.title);
          if (seen.has(key)) continue;
          seen.add(key);
          idCounter += 1;
          const category = inferCategory(it.title, it.description);
          results.push({
            id: `rss-${idCounter}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            title: it.title,
            category,
            date: formatDate(it.pubDate),
            excerpt: it.description.slice(0, 280) || it.title,
            source: url.includes('sciencedaily') ? 'ScienceDaily' : url.includes('sci.news') ? 'Sci.News' : url.includes('archaeology.org') ? 'Archaeology Magazine' : 'RSS',
            link: it.link || undefined,
            isArticle: false,
          });
        }
      } catch {
        // ignore failed feed
      }
    })
  );

  return results.sort((a, b) => (b.date > a.date ? 1 : -1));
}

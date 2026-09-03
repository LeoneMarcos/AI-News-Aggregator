import { decodeHtmlEntities, isWithinHours, stripHtml } from './utils';
import type { Article, FeedOptions, FeedProgress, FeedSource } from './types';

export const SOURCES: FeedSource[] = [
  { id: 'techcrunch', name: 'TechCrunch', feedUrl: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
  { id: 'marktechpost', name: 'MarkTechPost', feedUrl: 'https://www.marktechpost.com/feed/' },
  { id: 'mit', name: 'MIT Tech Review', feedUrl: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/' },
  { id: 'venturebeat', name: 'VentureBeat', feedUrl: 'https://venturebeat.com/category/ai/feed/' },
  { id: 'theverge', name: 'The Verge', feedUrl: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
];

const CORS_PROXIES: Array<(url: string) => string> = [
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`,
];
const CACHE_KEY = 'ai_news_aggregator_feed_cache';
const LEGACY_CACHE_KEY = 'neural_feed_cache';
const CACHE_TTL = 15 * 60 * 1000;
const PROXY_TIMEOUT = 5000;

interface RawFeedItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
  author?: string;
  content?: string;
}

interface Rss2JsonResponse {
  status?: string;
  items?: RawFeedItem[];
}

interface FeedResult {
  items: Article[];
  status: 'loaded' | 'failed';
}

function simpleHash(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function xmlText(parent: Element, tagName: string): string {
  try {
    const elements = parent.getElementsByTagName(tagName);
    return elements.length > 0 ? elements[0].textContent?.trim() || '' : '';
  } catch {
    return '';
  }
}

function normalizeFeedItem(item: RawFeedItem, source: FeedSource): Article {
  const rawDescription = stripHtml(item.content || item.description || '');
  return {
    id: `${source.id}_${simpleHash(item.link || item.title || '')}`,
    sourceId: source.id,
    sourceName: source.name,
    title: decodeHtmlEntities(item.title || ''),
    description: rawDescription.substring(0, 600) + (rawDescription.length > 600 ? '...' : ''),
    link: item.link || '',
    pubDate: item.pubDate || new Date().toISOString(),
    author: item.author || source.name,
  };
}

function parseXmlEntry(entry: Element, source: FeedSource): Article | null {
  const title = xmlText(entry, 'title');
  if (!title) return null;
  let link = xmlText(entry, 'link');
  if (!link) {
    for (const element of Array.from(entry.getElementsByTagName('link'))) {
      const href = element.getAttribute('href');
      if (href) { link = href; break; }
    }
  }
  const contentEncoded = xmlText(entry, 'content:encoded') || xmlText(entry, 'content');
  const description = contentEncoded || xmlText(entry, 'description') || xmlText(entry, 'summary');
  return normalizeFeedItem({
    title,
    link,
    description,
    pubDate: xmlText(entry, 'pubDate') || xmlText(entry, 'published') || xmlText(entry, 'updated'),
    author: xmlText(entry, 'dc:creator') || xmlText(entry, 'author') || source.name,
    content: contentEncoded || description,
  }, source);
}

function parseRssXml(xmlTextValue: string, source: FeedSource): Article[] {
  const document = new DOMParser().parseFromString(xmlTextValue, 'text/xml');
  if (document.querySelector('parsererror')) return [];
  let entries = Array.from(document.querySelectorAll('item'));
  if (entries.length === 0) entries = Array.from(document.querySelectorAll('entry'));
  return entries.flatMap((entry) => {
    try {
      const article = parseXmlEntry(entry, source);
      return article ? [article] : [];
    } catch {
      return [];
    }
  });
}

async function fetchProxy(makeProxyUrl: (url: string) => string, source: FeedSource, controller: AbortController): Promise<Article[]> {
  const proxyUrl = makeProxyUrl(source.feedUrl);
  const timeoutId = window.setTimeout(() => controller.abort(), PROXY_TIMEOUT);
  try {
    const response = await fetch(proxyUrl, { signal: controller.signal });
    if (!response.ok) throw new Error(`Proxy returned ${response.status}`);
    if (proxyUrl.includes('rss2json.com')) {
      const data = await response.json() as Rss2JsonResponse;
      if (data.status !== 'ok' || !data.items?.length) throw new Error('RSS JSON response was empty');
      return data.items.map((item) => normalizeFeedItem(item, source));
    }
    const items = parseRssXml(await response.text(), source);
    if (items.length === 0) throw new Error('RSS XML response was empty');
    return items;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchSingleFeed(source: FeedSource): Promise<FeedResult> {
  const controllers = CORS_PROXIES.map(() => new AbortController());
  try {
    const items = await Promise.any(CORS_PROXIES.map((makeProxyUrl, index) => fetchProxy(makeProxyUrl, source, controllers[index])));
    return { items, status: 'loaded' };
  } catch {
    // All proxy attempts failed.
  } finally {
    controllers.forEach((controller) => controller.abort());
  }
  console.warn(`[AI News Aggregator] All proxies failed for ${source.name}`);
  return { items: [], status: 'failed' };
}

function loadCache(key: string): Article[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { timestamp?: number; articles?: Article[] };
    if (!parsed.timestamp || Date.now() - parsed.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return parsed.articles || null;
  } catch {
    return null;
  }
}

function saveCache(key: string, articles: Article[]): void {
  try {
    localStorage.setItem(key, JSON.stringify({ timestamp: Date.now(), articles }));
  } catch {
    // Storage full — ignore.
  }
}

function filterByHours(articles: Article[], hours: number): Article[] {
  const filtered = articles.filter((article) => isWithinHours(article.pubDate, hours));
  return filtered.length === 0 && articles.length > 0 ? articles.slice(0, 30) : filtered;
}

export async function fetchAllFeeds({ forceRefresh = false, hoursLimit = 24, selectedSourceIds = null, onProgress = null, onArticles = null }: FeedOptions = {}): Promise<Article[]> {
  const activeSources = selectedSourceIds?.length
    ? SOURCES.filter((source) => selectedSourceIds.includes(source.id))
    : SOURCES;
  const sourceKey = activeSources.map((source) => source.id).sort().join(',');
  const cacheKey = `${CACHE_KEY}_${sourceKey}`;
  const notifyProgress = (progress: FeedProgress) => {
    try { onProgress?.(progress); } catch { /* Progress UI must not interrupt loading. */ }
  };

  if (!forceRefresh) {
    let cached = loadCache(cacheKey);
    if (!cached) {
      cached = loadCache(`${LEGACY_CACHE_KEY}_${sourceKey}`);
      if (cached) saveCache(cacheKey, cached);
    }
    if (cached) {
      console.log('[AI News Aggregator] Loaded from cache');
      notifyProgress({ completed: activeSources.length, total: activeSources.length, sourceId: null, status: 'cached' });
      return filterByHours(cached, hoursLimit);
    }
  }

  let completed = 0;
  const articles: Article[] = [];
  const notifyArticles = () => {
    try { onArticles?.([...articles]); } catch { /* Progressive rendering must not interrupt loading. */ }
  };
  const promises = activeSources.map(async (source) => {
    let status: FeedProgress['status'] = 'failed';
    try {
      const result = await fetchSingleFeed(source);
      articles.push(...result.items);
      articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      notifyArticles();
      status = result.status;
      return result.items;
    } finally {
      completed += 1;
      notifyProgress({ completed, total: activeSources.length, sourceId: source.id, status });
    }
  });
  const results = await Promise.allSettled(promises);
  articles.splice(0, articles.length, ...results.flatMap((result) => result.status === 'fulfilled' ? result.value : []));
  articles.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
  saveCache(cacheKey, articles);
  return filterByHours(articles, hoursLimit);
}

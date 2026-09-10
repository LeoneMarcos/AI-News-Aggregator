import { chromium } from 'playwright';
import { copyFile, mkdir, unlink } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173/';
const rawDir = path.resolve('showcase-assets', 'raw-auto');
const screenshotsDir = path.resolve('showcase-assets', 'screenshots');
const stableRawPath = path.join(rawDir, 'ai-news-aggregator-showcase-raw.webm');
const sources = [
  { id: 'techcrunch', name: 'TechCrunch', marker: 'techcrunch.com', delay: 450 },
  { id: 'marktechpost', name: 'MarkTechPost', marker: 'marktechpost.com', delay: 700 },
  { id: 'mit', name: 'MIT Tech Review', marker: 'technologyreview.com', delay: 950 },
  { id: 'venturebeat', name: 'VentureBeat', marker: 'venturebeat.com', delay: 1200 },
  { id: 'theverge', name: 'The Verge', marker: 'theverge.com', delay: 1450 },
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const xmlEscape = (value) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

function sourceForRequest(requestUrl) {
  const decoded = decodeURIComponent(requestUrl);
  return sources.find((source) => decoded.includes(source.marker));
}

function sampleArticles(source) {
  const now = Date.now();
  return [0, 1, 2].map((index) => ({
    title: `${source.name} — AI development ${index + 1}`,
    link: `https://example.com/${source.id}/${index + 1}`,
    description: `A deterministic showcase article from ${source.name}, used to demonstrate the feed layout, filtering, and progressive loading states.`,
    pubDate: new Date(now - index * 25 * 60 * 1000).toUTCString(),
  }));
}

function rssXml(source) {
  const items = sampleArticles(source)
    .map(
      (article) => `<item><title>${xmlEscape(article.title)}</title><link>${article.link}</link><description>${xmlEscape(article.description)}</description><pubDate>${article.pubDate}</pubDate></item>`,
    )
    .join('');
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${source.name}</title>${items}</channel></rss>`;
}

await mkdir(rawDir, { recursive: true });
await mkdir(screenshotsDir, { recursive: true });

let browser;
let context;
let page;
let video;
let failure;
try {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: rawDir, size: { width: 1440, height: 900 } },
  });
  context.setDefaultTimeout(12_000);
  context.setDefaultNavigationTimeout(20_000);
  await context.addInitScript(() => {
    localStorage.removeItem('ai_news_aggregator_user_prefs');
    localStorage.removeItem('neural_user_prefs');
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('ai_news_aggregator_feed_cache') || key.startsWith('neural_feed_cache')) {
        localStorage.removeItem(key);
      }
    }
  });
  page = await context.newPage();
  video = page.video();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.route('**/*', async (route) => {
    const requestUrl = route.request().url();
    if (
      !requestUrl.includes('corsproxy.io') &&
      !requestUrl.includes('allorigins.win') &&
      !requestUrl.includes('rss2json.com')
    ) {
      await route.continue();
      return;
    }

    const source = sourceForRequest(requestUrl);
    if (!source) {
      await route.abort();
      return;
    }

    await wait(source.delay);
    if (requestUrl.includes('rss2json.com')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ status: 'ok', items: sampleArticles(source) }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/xml',
      body: rssXml(source),
    });
  });

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole('dialog', { name: 'AI News Aggregator setup' }).waitFor();
  await wait(900);

  for (const source of sources) {
    const button = page.getByRole('button', { name: source.name, exact: true });
    await button.click();
    await wait(250);
  }
  await wait(900);

  await page.getByRole('button', { name: /Start reading/i }).click();
  await wait(500);
  await page.getByRole('progressbar', { name: 'News loading progress' }).waitFor();
  await wait(1_100);

  await page.locator('.news-card:not(.skeleton-card)').first().waitFor();
  await page.getByText('Loading sources', { exact: true }).waitFor({ state: 'detached' });
  await wait(1_200);
  await page.screenshot({ path: path.join(screenshotsDir, 'poster.png') });

  const techCrunchFilter = page.getByRole('button', { name: 'TechCrunch', exact: true });
  await techCrunchFilter.click();
  await wait(1_500);
  const cards = page.locator('.news-card:not(.skeleton-card)');
  if ((await cards.count()) === 0) throw new Error('Expected filtered showcase articles.');

  await techCrunchFilter.click();
  await wait(600);
  await page.getByRole('button', { name: 'All sources', exact: true }).click();
  await wait(900);

  if (pageErrors.length) throw new Error(`Application errors during capture: ${pageErrors.join(' | ')}`);
} catch (error) {
  failure = error;
} finally {
  if (context) await context.close().catch(() => undefined);
  if (browser) await browser.close().catch(() => undefined);
}

if (!video) throw new Error('Playwright did not expose the recorded showcase video.');
const recordedPath = await video.path();
await copyFile(recordedPath, stableRawPath);
if (recordedPath !== stableRawPath) await unlink(recordedPath).catch(() => undefined);
if (failure) throw failure;

console.log(
  JSON.stringify({
    rawVideo: stableRawPath,
    poster: path.join(screenshotsDir, 'poster.png'),
    viewport: '1440x900',
  }),
);

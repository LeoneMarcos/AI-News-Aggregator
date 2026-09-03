import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const readProjectFile = (filePath: string) => readFileSync(resolve(process.cwd(), filePath), 'utf8');

describe('static SEO contract', () => {
  it('exposes canonical, social, and structured metadata in the document shell', () => {
    const html = readProjectFile('index.html');
    const document = new DOMParser().parseFromString(html, 'text/html');

    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(
      'AI News Aggregator brings selected artificial intelligence news into a focused, filterable feed.',
    );
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      'https://ainews.leonemarcos.com/',
    );
    expect(document.querySelector('meta[property="og:title"]')?.getAttribute('content')).toBe('AI News Aggregator');
    expect(document.querySelector('meta[property="og:url"]')?.getAttribute('content')).toBe(
      'https://ainews.leonemarcos.com/',
    );
    expect(document.querySelector('meta[name="twitter:card"]')?.getAttribute('content')).toBe('summary');

    const structuredData = document.querySelector('script[type="application/ld+json"]')?.textContent ?? '';
    expect(JSON.parse(structuredData)).toMatchObject({
      '@type': 'WebSite',
      name: 'AI News Aggregator',
      url: 'https://ainews.leonemarcos.com/',
    });
  });

  it('keeps crawler files as valid static text with stable URLs', () => {
    const robots = readProjectFile('public/robots.txt');
    const sitemap = readProjectFile('public/sitemap.xml');

    expect(robots).toContain('User-agent: *');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Sitemap: https://ainews.leonemarcos.com/sitemap.xml');
    expect(robots).not.toMatch(/<!doctype html>|<html/i);
    expect(sitemap).toContain('<urlset');
    expect(sitemap).toContain('<loc>https://ainews.leonemarcos.com/</loc>');
  });
});

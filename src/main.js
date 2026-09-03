import * as Sentry from '@sentry/browser';
import { createIcons, Settings, ExternalLink } from 'lucide';
import { fetchAllFeeds, SOURCES } from './feed.js';
import { timeAgo, escapeHtml } from './utils.js';
import { showSetup, loadPrefs, clearPrefs } from './setup.js';

if (import.meta.env.PROD) Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()], tracesSampleRate: 1.0, replaysSessionSampleRate: 0.1, replaysOnErrorSampleRate: 1.0 });
let articles = []; let currentFilter = 'all'; let activeSources = SOURCES.map((source) => source.id);
const newsGrid = document.getElementById('news-grid'); const sidebarNav = document.getElementById('sidebar-nav'); const settingsBtn = document.getElementById('settings-btn');

async function init() { const prefs = loadPrefs(); if (!prefs) { showSetup(async (selectedPrefs) => { applyPrefs(selectedPrefs); await loadFeed(); }); return; } applyPrefs(prefs); await loadFeed(); }
function applyPrefs(prefs) { activeSources = prefs.sources?.length ? prefs.sources : SOURCES.map((source) => source.id); currentFilter = 'all'; renderSidebar(); }
function renderSidebar() {
  sidebarNav.innerHTML = '';
  const allSourcesLink = createSidebarLink('all', 'All sources', currentFilter === 'all'); allSourcesLink.addEventListener('click', (event) => { event.preventDefault(); setFilter('all'); }); sidebarNav.appendChild(allSourcesLink);
  SOURCES.filter((source) => activeSources.includes(source.id)).forEach((source) => { const link = createSidebarLink(source.id, source.name, currentFilter === source.id); link.addEventListener('click', (event) => { event.preventDefault(); setFilter(source.id); }); sidebarNav.appendChild(link); });
}
function createSidebarLink(id, name, isActive) { const link = document.createElement('a'); link.href = '#'; link.dataset.sourceId = id; link.className = `source-link${isActive ? ' active-nav-item' : ''}`; link.textContent = name; return link; }
function setFilter(filterId) { currentFilter = filterId; renderSidebar(); renderFeed(); }
async function loadFeed() { renderLoading(); try { articles = await fetchAllFeeds({ selectedSourceIds: activeSources }); renderFeed(); } catch (error) { console.error('Error fetching feeds:', error); newsGrid.innerHTML = '<p class="error-message">Failed to load news.</p>'; } }
function renderLoading() { newsGrid.innerHTML = ''; for (let i = 0; i < 6; i += 1) { const card = document.createElement('div'); card.className = 'news-card skeleton-card'; card.style.animationDelay = `${i * 0.08}s`; card.innerHTML = '<div class="skeleton-line skeleton-title"></div><div class="skeleton-line"></div><div class="skeleton-line short"></div><div class="skeleton-footer"></div>'; newsGrid.appendChild(card); } }
function renderFeed() {
  newsGrid.innerHTML = ''; const filteredArticles = currentFilter === 'all' ? articles : articles.filter((article) => article.sourceId === currentFilter);
  if (!filteredArticles.length) { newsGrid.innerHTML = '<p class="empty-state">No articles found.</p>'; return; }
  filteredArticles.forEach((article, index) => { const card = document.createElement('article'); card.className = 'news-card'; card.style.animationDelay = `${index * 0.05}s`; card.addEventListener('click', () => window.open(article.link, '_blank')); card.innerHTML = `<div class="card-meta"><span class="source-pill">${escapeHtml(article.sourceName)}</span><span>${timeAgo(article.pubDate)}</span></div><h3 class="card-title">${escapeHtml(article.title)}</h3><p class="card-description">${escapeHtml(article.description)}</p><a class="read-more" href="${escapeHtml(article.link)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation();">Read article <i data-lucide="external-link" aria-hidden="true"></i></a>`; newsGrid.appendChild(card); });
  createIcons({ icons: { ExternalLink }, root: newsGrid, attrs: { 'stroke-width': 2 } });
}
function registerGlobalListeners() { settingsBtn?.addEventListener('click', () => { clearPrefs(); showSetup(async (selectedPrefs) => { articles = []; applyPrefs(selectedPrefs); await loadFeed(); }); }); }
document.addEventListener('DOMContentLoaded', () => {
  createIcons({ icons: { Settings }, root: document, attrs: { 'stroke-width': 2 } });
  registerGlobalListeners();
  init();
});

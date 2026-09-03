import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight, ExternalLink, Newspaper, RefreshCw, Settings, X } from 'lucide-react';
import * as Sentry from '@sentry/browser';
import { fetchAllFeeds, SOURCES } from './feed';
import { loadPrefs, savePrefs } from './setup';
import type { Article, FeedProgress, Preferences } from './types';
import { timeAgo } from './utils';

if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({ dsn: import.meta.env.VITE_SENTRY_DSN, integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()], tracesSampleRate: 1.0, replaysSessionSampleRate: 0.1, replaysOnErrorSampleRate: 1.0 });
}

function LoadingState({ total, progress }: { total: number; progress: FeedProgress | null }) {
  const completed = Math.min(progress?.completed || 0, total);
  return <><div className="feed-loading" role="status" aria-live="polite"><div className="feed-loading-label"><span>Loading sources</span><span>{completed}/{total}</span></div><div className="feed-progress" role="progressbar" aria-label="News loading progress" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completed}><span style={{ width: `${total ? (completed / total) * 100 : 100}%` }} /></div></div>{Array.from({ length: 6 }, (_, index) => <div className="news-card skeleton-card" style={{ animationDelay: `${index * 0.08}s` }} key={index}><div className="skeleton-line skeleton-title" /><div className="skeleton-line" /><div className="skeleton-line short" /><div className="skeleton-footer" /></div>)}</>;
}

function EmptyState({ onChoose }: { onChoose: () => void }) {
  return <div className="empty-state-panel"><div className="empty-state-icon"><Newspaper aria-hidden="true" /></div><p className="eyebrow">Your feed is waiting</p><h3>Choose your news sources.</h3><p>Select at least one portal to build your personal intelligence brief.</p><button className="btn-primary empty-state-action" type="button" onClick={onChoose}>Choose sources <ArrowRight aria-hidden="true" /></button></div>;
}

function Sidebar({ activeSources, filter, onFilter }: { activeSources: string[]; filter: string; onFilter: (id: string) => void }) {
  if (!activeSources.length) return <span className="sidebar-empty">No sources selected</span>;
  return <><a href="#" className={`source-link${filter === 'all' ? ' active-nav-item' : ''}`} onClick={(event) => { event.preventDefault(); onFilter('all'); }}>All sources</a>{SOURCES.filter((source) => activeSources.includes(source.id)).map((source) => <a href="#" className={`source-link${filter === source.id ? ' active-nav-item' : ''}`} key={source.id} onClick={(event) => { event.preventDefault(); onFilter(source.id); }}>{source.name}</a>)}</>;
}

function NewsCard({ article }: { article: Article }) {
  return <article className="news-card" onClick={() => window.open(article.link, '_blank')}><div className="card-meta"><span className="source-pill">{article.sourceName}</span><span>{timeAgo(article.pubDate)}</span></div><h3 className="card-title">{article.title}</h3><p className="card-description">{article.description}</p><a className="read-more" href={article.link} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>Read article <ExternalLink aria-hidden="true" /></a></article>;
}

function SetupModal({ initialPrefs, onComplete, onClose }: { initialPrefs: Preferences | null; onComplete: (prefs: Preferences) => void; onClose: () => void }) {
  const [selected, setSelected] = useState(() => new Set(initialPrefs?.sources ?? []));
  const [closing, setClosing] = useState(false);
  const close = () => { setClosing(true); window.setTimeout(onClose, 450); };
  const selectAll = selected.size !== SOURCES.length;
  const toggle = (id: string) => setSelected((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  const finish = () => { const prefs = { sources: [...selected] }; savePrefs(prefs); setClosing(true); window.setTimeout(() => onComplete(prefs), 450); };
  return <div id="setup-overlay" className={`setup-visible${closing ? ' setup-exit' : ''}`} role="dialog" aria-modal="true" aria-label="AI News Aggregator setup"><div className="setup-bg-orb setup-bg-orb-one" /><div className="setup-bg-orb setup-bg-orb-two" /><div className="setup-modal" id="setup-modal"><div className="setup-header"><div className="setup-header-top"><div className="setup-logo-row"><img src="/ai-news-aggregator-logo.png" alt="AI News Aggregator logo" className="setup-logo-img" /><span className="setup-logo-text brand-name">AI News Aggregator</span></div><button className="setup-close" type="button" aria-label="Close source settings" title="Close" onClick={close}><X aria-hidden="true" /></button></div><p className="setup-subtitle">Curate your daily intelligence brief</p></div><div className="setup-progress" aria-hidden="true"><span /></div><div className="setup-step active-step"><h2 className="setup-step-title"><Newspaper aria-hidden="true" /> Choose your news portals</h2><p className="setup-step-desc">Select the sources you want in your personal feed.</p><div className="sources-grid">{SOURCES.map((source) => <button className={`source-card${selected.has(source.id) ? ' selected' : ''}`} type="button" aria-pressed={selected.has(source.id)} key={source.id} onClick={() => toggle(source.id)}><span className="source-check" aria-hidden="true">{selected.has(source.id) && <span>✓</span>}</span><span className="source-name">{source.name}</span></button>)}</div><div className="setup-actions"><button className="btn-ghost" type="button" onClick={() => setSelected(selectAll ? new Set(SOURCES.map((source) => source.id)) : new Set())}>{selectAll ? 'Select all' : 'Deselect all'}</button><button className="btn-primary" type="button" onClick={finish}>Start reading <ArrowRight aria-hidden="true" /></button></div></div></div></div>;
}

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeSources, setActiveSources] = useState<string[]>(SOURCES.map((source) => source.id));
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<FeedProgress | null>(null);
  const [error, setError] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupPrefs, setSetupPrefs] = useState<Preferences | null>(null);

  const applyPrefs = useCallback((prefs: Preferences) => { setActiveSources(prefs.sources); setFilter('all'); }, []);
  const loadFeed = useCallback(async (forceRefresh = false, sources = activeSources) => {
    if (!sources.length) { setArticles([]); setLoading(false); return; }
    setLoading(true); setError(false); setProgress(null);
    try { setArticles(await fetchAllFeeds({ forceRefresh, selectedSourceIds: sources, onProgress: setProgress })); } catch { setError(true); } finally { setLoading(false); }
  }, [activeSources]);

  useEffect(() => { const prefs = loadPrefs(); if (!prefs) { setActiveSources((current) => current.length ? [] : current); setSetupPrefs(null); setSetupOpen(true); } else { applyPrefs(prefs); void loadFeed(false, prefs.sources); } }, [applyPrefs, loadFeed]);

  const filteredArticles = useMemo(() => filter === 'all' ? articles : articles.filter((article) => article.sourceId === filter), [articles, filter]);
  const openSetup = () => { setSetupPrefs(loadPrefs()); setSetupOpen(true); };
  const handleComplete = (prefs: Preferences) => { setSetupOpen(false); applyPrefs(prefs); void loadFeed(false, prefs.sources); };
  return <div className="app-shell"><header className="app-header"><div className="brand-lockup"><img src="/ai-news-aggregator-logo.png" alt="AI News Aggregator logo" className="brand-logo" /><div><h1 className="brand-name">AI News Aggregator</h1><span>AI intelligence, curated daily</span></div></div><button className="icon-button" type="button" aria-label="Open settings" title="Configure sources" onClick={openSetup}><Settings aria-hidden="true" /></button></header><div className="app-layout"><aside className="sidebar"><div className="sidebar-label">Your sources</div><nav id="sidebar-nav" aria-label="News sources"><Sidebar activeSources={activeSources} filter={filter} onFilter={(next) => setFilter(next)} /></nav></aside><main className="content-area"><div className="content-heading"><div><p className="eyebrow">LATEST SIGNALS</p><h2>AI news worth your attention.</h2></div>{activeSources.length > 0 && <button className={`refresh-button${loading ? ' is-refreshing' : ''}`} type="button" aria-label="Refresh feed" title="Refresh feed" disabled={loading} onClick={() => void loadFeed(true)}><RefreshCw aria-hidden="true" /></button>}</div><div id="news-grid" className="news-grid">{loading ? <LoadingState total={activeSources.length} progress={progress} /> : error ? <p className="error-message">Failed to load news.</p> : !activeSources.length ? <EmptyState onChoose={openSetup} /> : !filteredArticles.length ? <p className="empty-state">No articles found.</p> : filteredArticles.map((article) => <NewsCard article={article} key={article.id} />)}</div></main></div>{setupOpen && <SetupModal initialPrefs={setupPrefs} onComplete={handleComplete} onClose={() => setSetupOpen(false)} />}</div>;
}

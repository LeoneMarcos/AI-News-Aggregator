import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Check, ExternalLink, Newspaper, Plus, Radio, RefreshCw, Search, Settings, X } from 'lucide-react';
import { fetchAllFeeds, SOURCES } from './feed';
import { loadPrefs, savePrefs } from './setup';
import type { Article, FeedProgress, Preferences } from './types';
import { timeAgo } from './utils';

const MODAL_EXIT_DURATION_MS = 200;

interface LoadingStateProps {
  total: number;
  progress: FeedProgress | null;
  showSkeletons: boolean;
}

function LoadingState({ total, progress, showSkeletons }: LoadingStateProps) {
  const completed = Math.min(progress?.completed || 0, total);
  return (
    <>
      <div className="feed-loading" role="status" aria-live="polite">
        <div className="feed-loading-label">
          <span>Loading sources</span>
          <span>
            {completed}/{total}
          </span>
        </div>
        <div
          className="feed-progress"
          role="progressbar"
          aria-label="News loading progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={completed}
        >
          <span style={{ width: `${total ? (completed / total) * 100 : 100}%` }} />
        </div>
      </div>
      {showSkeletons &&
        Array.from({ length: 6 }, (_, index) => (
          <div
            className="news-card skeleton-card"
            style={{ animationDelay: `${index * 0.08}s` }}
            key={index}
            aria-hidden="true"
          >
            <div className="skeleton-line skeleton-title" />
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
            <div className="skeleton-footer" />
          </div>
        ))}
    </>
  );
}

function EmptyState({ onChoose }: { onChoose: () => void }) {
  return (
    <div className="empty-state-panel">
      <div className="empty-state-icon">
        <Newspaper aria-hidden="true" />
      </div>
      <p className="eyebrow">Your feed is waiting</p>
      <h3>Choose your news sources.</h3>
      <p>Select at least one portal to build your personal intelligence brief.</p>
      <button className="btn-primary empty-state-action" type="button" onClick={onChoose}>
        Choose sources <ArrowRight aria-hidden="true" />
      </button>
    </div>
  );
}

interface SidebarProps {
  activeSources: string[];
  filter: string;
  onFilter: (id: string) => void;
}

function Sidebar({ activeSources, filter, onFilter }: SidebarProps) {
  if (!activeSources.length) {
    return <span className="sidebar-empty">No sources selected</span>;
  }

  const links = [
    { id: 'all', label: 'All sources' },
    ...SOURCES.filter((source) => activeSources.includes(source.id)).map((source) => ({
      id: source.id,
      label: source.name,
    })),
  ];

  return (
    <>
      {links.map((link) => {
        const isCurrent = filter === link.id;
        return (
          <button
            key={link.id}
            className={`source-link${isCurrent ? ' active-nav-item' : ''}`}
            type="button"
            aria-current={isCurrent ? 'page' : undefined}
            onClick={() => onFilter(link.id)}
          >
            <span>{link.label}</span>
            {isCurrent && <span className="active-dot" aria-hidden="true" />}
          </button>
        );
      })}
    </>
  );
}

function NewsCard({ article }: { article: Article }) {
  const titleId = `story-${article.id}`;
  return (
    <article className="news-card" aria-labelledby={titleId}>
      <div className="card-meta">
        <span className="source-pill">{article.sourceName}</span>
        <time dateTime={article.pubDate}>{timeAgo(article.pubDate)}</time>
      </div>
      <h3 id={titleId} className="card-title">
        {article.title}
      </h3>
      {article.description && <p className="card-description">{article.description}</p>}
      {article.link ? (
        <a
          className="read-more"
          href={article.link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Read "${article.title}" on ${article.sourceName} (opens in a new tab)`}
        >
          <span>Read article</span>
          <ExternalLink aria-hidden="true" />
        </a>
      ) : (
        <span className="read-more read-more-unavailable">Article link unavailable</span>
      )}
    </article>
  );
}

interface SetupModalProps {
  initialPrefs: Preferences | null;
  onComplete: (prefs: Preferences) => void;
  onClose: () => void;
}

function SetupModal({ initialPrefs, onComplete, onClose }: SetupModalProps) {
  const [selected, setSelected] = useState(() => new Set(initialPrefs?.sources ?? []));
  const [closing, setClosing] = useState(false);
  const closingRef = useRef(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    window.setTimeout(onClose, MODAL_EXIT_DURATION_MS);
  }, [onClose]);

  const finish = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const prefs = { sources: [...selected] };
    savePrefs(prefs);
    setClosing(true);
    window.setTimeout(() => onComplete(prefs), MODAL_EXIT_DURATION_MS);
  }, [onComplete, selected]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled])') ?? []
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [close]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const selectAll = selected.size !== SOURCES.length;
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  return (
    <div
      id="setup-overlay"
      className={`setup-visible${closing ? ' setup-exit' : ''}`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="setup-bg-orb setup-bg-orb-one" />
      <div className="setup-bg-orb setup-bg-orb-two" />
      <div
        ref={dialogRef}
        className="setup-modal"
        id="setup-modal"
        role="dialog"
        aria-modal="true"
        aria-label="AI News Aggregator setup"
        aria-describedby="setup-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="setup-header">
          <div className="setup-header-top">
            <div className="setup-logo-row">
              <img
                src="/ai-news-spark-logo.png"
                alt="AI News Aggregator logo"
                className="setup-logo-img"
              />
              <span className="setup-logo-text brand-name">AI News Aggregator</span>
            </div>
            <button
              ref={closeButtonRef}
              className="setup-close"
              type="button"
              aria-label="Close source settings"
              title="Close"
              onClick={close}
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <p id="setup-description" className="setup-subtitle">
            Curate your daily intelligence brief
          </p>
        </div>

        <div className="setup-section-label">
          <span>YOUR READING ROOM</span>
          <span>{selected.size} selected</span>
        </div>

        <div className="setup-step active-step">
          <h2 className="setup-step-title" id="setup-title">
            <Newspaper aria-hidden="true" /> A better brief starts here.
          </h2>
          <p className="setup-step-desc">Choose the publications you trust. Make this feed your own.</p>
          <div className="sources-grid">
            {SOURCES.map((source) => (
              <button
                key={source.id}
                className={`source-card${selected.has(source.id) ? ' selected' : ''}`}
                type="button"
                aria-pressed={selected.has(source.id)}
                onClick={() => toggle(source.id)}
              >
                <span className="source-check" aria-hidden="true">
                  {selected.has(source.id) && <Check aria-hidden="true" />}
                </span>
                <span className="source-name">{source.name}</span>
              </button>
            ))}
          </div>

          <div className="setup-actions">
            <button
              className="btn-ghost"
              type="button"
              onClick={() =>
                setSelected(
                  selectAll ? new Set(SOURCES.map((source) => source.id)) : new Set()
                )
              }
            >
              {selectAll ? 'Select all' : 'Deselect all'}
            </button>
            <button className="btn-primary" type="button" onClick={finish}>
              {initialPrefs ? 'Save sources' : 'Start reading'} <ArrowRight aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeSources, setActiveSources] = useState<string[]>(SOURCES.map((source) => source.id));
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<FeedProgress | null>(null);
  const [error, setError] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupPrefs, setSetupPrefs] = useState<Preferences | null>(null);

  const didInitialize = useRef(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const clearSearch = () => {
    setQuery('');
    searchInputRef.current?.focus();
  };

  const applyPrefs = useCallback((prefs: Preferences) => {
    const validIds = new Set(SOURCES.map((source) => source.id));
    setActiveSources(prefs.sources.filter((source) => validIds.has(source)));
    setFilter('all');
  }, []);

  const loadFeed = useCallback(
    async (forceRefresh = false, sources = activeSources) => {
      if (!sources.length) {
        setArticles([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(false);
      setProgress(null);
      setArticles([]);
      try {
        const fetched = await fetchAllFeeds({
          forceRefresh,
          selectedSourceIds: sources,
          onProgress: setProgress,
          onArticles: setArticles,
        });
        setArticles(fetched);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [activeSources]
  );

  useEffect(() => {
    if (didInitialize.current) return;
    didInitialize.current = true;
    const prefs = loadPrefs();
    if (!prefs) {
      setActiveSources([]);
      setSetupPrefs(null);
      setSetupOpen(true);
    } else {
      applyPrefs(prefs);
      void loadFeed(false, prefs.sources);
    }
  }, [applyPrefs, loadFeed]);

  const filteredArticles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesFilter = filter === 'all' || article.sourceId === filter;
      if (!matchesFilter) return false;
      if (!normalizedQuery) return true;
      const haystack = `${article.title} ${article.description} ${article.sourceName}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [articles, filter, query]);

  const openSetup = () => {
    setSetupPrefs(loadPrefs());
    setSetupOpen(true);
  };

  const handleComplete = (prefs: Preferences) => {
    setSetupOpen(false);
    applyPrefs(prefs);
    void loadFeed(false, prefs.sources);
  };

  const currentSourceHeading =
    filter === 'all'
      ? 'Latest stories'
      : SOURCES.find((source) => source.id === filter)?.name ?? filter;

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to articles
      </a>

      <header className="app-header">
        <div className="brand-lockup">
          <img
            src="/ai-news-spark-logo.png"
            alt="AI News Aggregator logo"
            className="brand-logo"
          />
          <div>
            <h1 className="brand-name">
              AI News <span className="brand-name-light">Aggregator</span>
            </h1>
            <span className="brand-tagline">A wider lens on artificial intelligence</span>
          </div>
        </div>
        <button
          className="settings-button"
          type="button"
          aria-label="Open settings"
          onClick={openSetup}
        >
          <Settings aria-hidden="true" />
          <span>Your sources</span>
        </button>
      </header>

      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-label">
            Reading room <span>{activeSources.length.toString().padStart(2, '0')}</span>
          </div>
          <nav id="sidebar-nav" aria-label="News sources">
            <Sidebar activeSources={activeSources} filter={filter} onFilter={setFilter} />
          </nav>
          <button className="manage-sources" type="button" onClick={openSetup}>
            <Plus aria-hidden="true" /> Manage sources
          </button>
          <div className="sidebar-note">
            <Radio aria-hidden="true" />
            <p>
              Many perspectives.
              <br />
              <strong>One place to keep up.</strong>
            </p>
          </div>
        </aside>

        <main className="content-area" id="main-content" tabIndex={-1}>
          <div className="content-heading">
            <div>
              <p className="eyebrow">
                <span className="edition-line" /> THE INTELLIGENCE BRIEF
              </p>
              <h2>
                A clearer view
                <br />
                of what’s <em>next.</em>
              </h2>
              <p className="heading-description">The latest in AI, from the sources you choose.</p>
            </div>
          </div>

          <div className="feed-toolbar">
            <div className="feed-title">
              <h3>{currentSourceHeading}</h3>
              <span
                className="article-count"
                aria-label={`${filteredArticles.length} stories`}
              >
                {filteredArticles.length}
                {loading ? '+' : ''}
              </span>
            </div>

            <div className="feed-tools">
              <div className="search-field">
                <Search aria-hidden="true" />
                <input
                  ref={searchInputRef}
                  type="search"
                  aria-label="Search stories"
                  placeholder="Search stories…"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') clearSearch();
                  }}
                />
                <button
                  type="button"
                  className={query ? undefined : 'search-clear-hidden'}
                  aria-label="Clear search"
                  tabIndex={query ? 0 : -1}
                  disabled={!query}
                  onClick={clearSearch}
                >
                  <X aria-hidden="true" />
                </button>
              </div>

              {activeSources.length > 0 && (
                <button
                  className={`refresh-button${loading ? ' is-refreshing' : ''}`}
                  type="button"
                  aria-label={loading ? 'Refreshing feed, please wait' : 'Refresh feed'}
                  title={loading ? 'Refreshing feed, please wait' : 'Refresh feed'}
                  disabled={loading}
                  onClick={() => void loadFeed(true)}
                >
                  <RefreshCw aria-hidden="true" />
                </button>
              )}
            </div>
          </div>

          <div id="news-grid" className="news-grid" aria-busy={loading}>
            {loading && (
              <LoadingState
                total={activeSources.length}
                progress={progress}
                showSkeletons={!articles.length}
              />
            )}

            {error ? (
              <div className="error-message" role="alert">
                <div className="empty-state-icon">
                  <Newspaper aria-hidden="true" />
                </div>
                <h3>The brief couldn’t load.</h3>
                <p>Try again to reconnect with your sources.</p>
                <button className="btn-primary" type="button" onClick={() => void loadFeed(true)}>
                  Try again <RefreshCw aria-hidden="true" />
                </button>
              </div>
            ) : !activeSources.length ? (
              <EmptyState onChoose={openSetup} />
            ) : !filteredArticles.length && !loading ? (
              <div className="empty-state" role="status">
                <div className="empty-state-icon">
                  {query.trim() ? <Search aria-hidden="true" /> : <Newspaper aria-hidden="true" />}
                </div>
                <h3>{query.trim() ? 'No matching stories' : 'No stories to show yet'}</h3>
                <p>
                  {query.trim()
                    ? 'Try a different keyword or clear your search to see this feed.'
                    : 'Check for new articles or adjust the sources in your brief.'}
                </p>
                <div className="empty-state-actions">
                  {query.trim() ? (
                    <button className="btn-primary" type="button" onClick={clearSearch}>
                      Clear search <X aria-hidden="true" />
                    </button>
                  ) : (
                    <button
                      className="btn-primary"
                      type="button"
                      onClick={() => void loadFeed(true)}
                    >
                      <RefreshCw aria-hidden="true" /> Refresh feed
                    </button>
                  )}
                  {filter !== 'all' ? (
                    <button
                      className="btn-ghost"
                      type="button"
                      onClick={() => {
                        setFilter('all');
                        setQuery('');
                      }}
                    >
                      View all sources
                    </button>
                  ) : (
                    !query.trim() && (
                      <button className="btn-ghost" type="button" onClick={openSetup}>
                        Choose sources
                      </button>
                    )
                  )}
                </div>
              </div>
            ) : (
              filteredArticles.map((article) => <NewsCard article={article} key={article.id} />)
            )}
          </div>

          <footer className="feed-footer">
            <span>AI News Aggregator</span>
            <span>Read the story at its source.</span>
          </footer>
        </main>
      </div>

      {setupOpen && (
        <SetupModal
          initialPrefs={setupPrefs}
          onComplete={handleComplete}
          onClose={() => setSetupOpen(false)}
        />
      )}
    </div>
  );
}

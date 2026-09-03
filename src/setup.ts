import type { Preferences } from './types';

const PREFS_KEY = 'ai_news_aggregator_user_prefs';
const LEGACY_PREFS_KEY = 'neural_user_prefs';

export function loadPrefs(): Preferences | null {
  try {
    let raw = localStorage.getItem(PREFS_KEY);
    const usingLegacyPrefs = !raw;
    if (usingLegacyPrefs) raw = localStorage.getItem(LEGACY_PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { sources?: unknown };
    const prefs: Preferences = { sources: Array.isArray(parsed.sources) ? parsed.sources.filter((source): source is string => typeof source === 'string') : [] };
    if (usingLegacyPrefs) {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      localStorage.removeItem(LEGACY_PREFS_KEY);
    }
    return prefs;
  } catch {
    return null;
  }
}

export function savePrefs(prefs: Preferences): void {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ sources: prefs.sources })); } catch { /* Ignore storage errors. */ }
}

export function clearPrefs(): void {
  localStorage.removeItem(PREFS_KEY);
  localStorage.removeItem(LEGACY_PREFS_KEY);
}

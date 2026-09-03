import { describe, it, expect, beforeEach } from 'vitest';
import { loadPrefs, clearPrefs } from '../src/setup';

describe('setup preferences', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('loads preferences from the AI News Aggregator key', () => {
    localStorage.setItem('ai_news_aggregator_user_prefs', JSON.stringify({ sources: ['techcrunch'] }));
    expect(loadPrefs()).toEqual({ sources: ['techcrunch'] });
  });

  it('migrates legacy Neural preferences to AI News Aggregator', () => {
    localStorage.setItem('neural_user_prefs', JSON.stringify({ sources: ['marktechpost'] }));

    expect(loadPrefs()).toEqual({ sources: ['marktechpost'] });
    expect(localStorage.getItem('ai_news_aggregator_user_prefs')).toBe(JSON.stringify({ sources: ['marktechpost'] }));
    expect(localStorage.getItem('neural_user_prefs')).toBeNull();
  });

  it('clears current and legacy preference keys', () => {
    localStorage.setItem('ai_news_aggregator_user_prefs', JSON.stringify({ sources: [] }));
    localStorage.setItem('neural_user_prefs', JSON.stringify({ sources: [] }));
    clearPrefs();
    expect(localStorage.getItem('ai_news_aggregator_user_prefs')).toBeNull();
    expect(localStorage.getItem('neural_user_prefs')).toBeNull();
  });
});

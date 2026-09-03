import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanup();
  });

  it('renders the React shell and empty feed state without preferences', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'AI News Aggregator' })).toBeTruthy();
    expect(screen.getByText('Choose your news sources.')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'AI News Aggregator setup' })).toBeTruthy();
  });

  it('loads saved preferences without reinitializing the feed effect', async () => {
    localStorage.setItem('ai_news_aggregator_user_prefs', JSON.stringify({ sources: ['techcrunch'] }));
    localStorage.setItem('ai_news_aggregator_feed_cache_techcrunch', JSON.stringify({ timestamp: Date.now(), articles: [] }));

    render(<App />);

    expect(await screen.findByText('No articles found.')).toBeTruthy();
    expect(screen.queryByRole('dialog', { name: 'AI News Aggregator setup' })).toBeNull();
  });

  it('finishes the setup modal exit within the short animation window', () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Close source settings' }));
    expect(screen.getByRole('dialog', { name: 'AI News Aggregator setup' })).toBeTruthy();

    act(() => vi.advanceTimersByTime(199));
    expect(screen.getByRole('dialog', { name: 'AI News Aggregator setup' })).toBeTruthy();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByRole('dialog', { name: 'AI News Aggregator setup' })).toBeNull();
  });

  it('uses the same short exit when starting the feed', () => {
    vi.useFakeTimers();
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Start reading' }));
    expect(screen.getByRole('dialog', { name: 'AI News Aggregator setup' })).toBeTruthy();

    act(() => vi.advanceTimersByTime(200));
    expect(screen.queryByRole('dialog', { name: 'AI News Aggregator setup' })).toBeNull();
  });
});

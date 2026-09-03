import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import App from '../src/App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => cleanup());

  it('renders the React shell and empty feed state without preferences', async () => {
    render(<App />);

    expect(await screen.findByRole('heading', { name: 'AI News Aggregator' })).toBeTruthy();
    expect(screen.getByText('Choose your news sources.')).toBeTruthy();
    expect(screen.getByRole('dialog', { name: 'AI News Aggregator setup' })).toBeTruthy();
  });
});

/** Brievox setup / onboarding. */
import { SOURCES } from './feed.js';
import { createIcons, Check, Newspaper, ArrowRight } from 'lucide';

const PREFS_KEY = 'brievox_user_prefs';
const LEGACY_PREFS_KEY = 'neural_user_prefs';

export function loadPrefs() {
  try {
    let raw = localStorage.getItem(PREFS_KEY);
    const usingLegacyPrefs = !raw;
    if (usingLegacyPrefs) raw = localStorage.getItem(LEGACY_PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const prefs = { sources: Array.isArray(parsed.sources) ? parsed.sources : [] };
    if (usingLegacyPrefs) {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      localStorage.removeItem(LEGACY_PREFS_KEY);
    }
    return prefs;
  } catch { return null; }
}

function savePrefs(prefs) {
  try { localStorage.setItem(PREFS_KEY, JSON.stringify({ sources: prefs.sources })); } catch { /* ignore */ }
}

export function clearPrefs() {
  localStorage.removeItem(PREFS_KEY);
  localStorage.removeItem(LEGACY_PREFS_KEY);
}

export function showSetup(onComplete) {
  const overlay = document.createElement('div');
  overlay.id = 'setup-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Brievox setup');
  overlay.innerHTML = `
    <div class="setup-bg-orb setup-bg-orb-one"></div><div class="setup-bg-orb setup-bg-orb-two"></div>
    <div class="setup-modal" id="setup-modal">
      <div class="setup-header"><div class="setup-logo-row"><img src="/brievox-logo.png" alt="Brievox logo" class="setup-logo-img" /><span class="setup-logo-text">Brievox</span></div><p class="setup-subtitle">Curate your daily intelligence brief</p></div>
      <div class="setup-progress" aria-hidden="true"><span></span></div>
      <div class="setup-step active-step">
        <h2 class="setup-step-title"><i data-lucide="newspaper" aria-hidden="true"></i> Choose your news portals</h2>
        <p class="setup-step-desc">Select the sources you want in your personal feed.</p>
        <div class="sources-grid" id="sources-grid"></div>
        <div class="setup-actions"><button id="select-all-btn" class="btn-ghost" type="button">Select all</button><button id="setup-finish" class="btn-primary" type="button" disabled>Start reading <i data-lucide="arrow-right" aria-hidden="true"></i></button></div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  createIcons({ icons: { Newspaper, ArrowRight }, root: overlay, attrs: { 'stroke-width': 2 } });
  requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('setup-visible')));

  const selectedSources = new Set();
  const sourcesGrid = overlay.querySelector('#sources-grid');
  SOURCES.forEach((source) => {
    const card = document.createElement('button');
    card.className = 'source-card'; card.type = 'button'; card.dataset.id = source.id; card.setAttribute('aria-pressed', 'false');
    card.innerHTML = `<span class="source-check" aria-hidden="true"><i data-lucide="check"></i></span><span class="source-name">${source.name}</span>`;
    card.addEventListener('click', () => {
      const selected = selectedSources.has(source.id);
      if (selected) selectedSources.delete(source.id); else selectedSources.add(source.id);
      card.classList.toggle('selected', !selected); card.setAttribute('aria-pressed', String(!selected)); updateActions();
    });
    sourcesGrid.appendChild(card);
  });
  createIcons({ icons: { Check }, root: sourcesGrid, attrs: { 'stroke-width': 2 } });

  function updateActions() {
    overlay.querySelector('#setup-finish').disabled = selectedSources.size === 0;
    overlay.querySelector('#select-all-btn').textContent = selectedSources.size === SOURCES.length ? 'Deselect all' : 'Select all';
  }
  overlay.querySelector('#select-all-btn').addEventListener('click', () => {
    const selectAll = selectedSources.size !== SOURCES.length;
    sourcesGrid.querySelectorAll('.source-card').forEach((card) => { const id = card.dataset.id; card.classList.toggle('selected', selectAll); card.setAttribute('aria-pressed', String(selectAll)); if (selectAll) selectedSources.add(id); else selectedSources.delete(id); });
    updateActions();
  });
  overlay.querySelector('#setup-finish').addEventListener('click', () => {
    const prefs = { sources: [...selectedSources] }; savePrefs(prefs); overlay.classList.remove('setup-visible'); overlay.classList.add('setup-exit');
    let completed = false;
    const complete = () => {
      if (completed) return;
      completed = true;
      overlay.remove();
      onComplete(prefs);
    };
    overlay.addEventListener('transitionend', complete, { once: true });
    window.setTimeout(complete, 450);
  });
}

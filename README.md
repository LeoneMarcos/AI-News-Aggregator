<p align="center">
  <img src="./public/ai-news-aggregator-logo.webp" alt="AI News Aggregator logo" width="160" />
</p>

<h1 align="center">AI News Aggregator</h1>

<p align="center">
  A focused daily feed for artificial intelligence news from the sources you choose.
</p>

<p align="center">
  <a href="https://ainews.leonemarcos.com">
    <img src="https://img.shields.io/badge/Demo-Live-brightgreen?style=flat-square" alt="Live Demo" />
  </a>
  <a href="https://github.com/LeoneMarcos/AI-News-Aggregator/actions/workflows/ci.yml">
    <img src="https://github.com/LeoneMarcos/AI-News-Aggregator/actions/workflows/ci.yml/badge.svg?branch=main" alt="CI" />
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-Apache%202.0-green?style=flat-square" alt="Apache 2.0 License" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6-646cff?style=flat-square&logo=vite&logoColor=white" alt="Vite 6" />
  <img src="https://img.shields.io/badge/Vitest-4-6e9f18?style=flat-square&logo=vitest&logoColor=white" alt="Vitest 4" />
  <img src="https://img.shields.io/badge/Deploy-Cloudflare-f38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare" />
</p>

<p align="center">
  <a href="#overview">Overview</a> ·
  <a href="#showcase">Showcase</a> ·
  <a href="#features">Features</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#quick-start">Quick Start</a>
</p>

---

## Overview

**AI News Aggregator** is a client-side AI news aggregator built with React, TypeScript, and Vite. It collects articles from selected RSS feeds and presents them in a single, readable feed.

The app keeps source selection locally, supports filtering by publication, and uses public CORS proxy strategies so it can run as a static web application without a dedicated backend.

### Highlights

- **Curated sources** — Choose which AI publications appear in the feed.
- **Readable feed** — Browse normalized article cards with source, time, summary, and link.
- **Local preferences** — Keep selected sources and feed cache in the browser.
- **Static deployment** — Runs as a Vite-built frontend with no application server required.

---

## Showcase

The short showcase video covers source selection, the loaded news feed, and filtering by source.

https://github.com/user-attachments/assets/4dfd7103-3ed0-4a76-9cd0-7a028ec64a1f

---

## Features

- **RSS aggregation** — Fetches and normalizes AI news from multiple publications.
- **Source selection** — Choose the publications used for the personal feed.
- **Source filtering** — Narrow the loaded feed to one publication.
- **Responsive layout** — Adapts the interface across desktop, tablet, and mobile sizes.
- **Accessible interface** — Uses semantic HTML, ARIA labels, and keyboard-friendly controls.
- **Loading states** — Displays skeleton cards while feeds are loading.

Supported sources include TechCrunch, MarkTechPost, MIT Technology Review, VentureBeat, and The Verge.

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React, TypeScript |
| UI | Lucide React, Google Fonts |
| Data | RSS feeds, client-side XML parsing, CORS proxy fallbacks |
| Build | Vite |
| Testing | Vitest, jsdom |
| CI | GitHub Actions |
| Hosting | Cloudflare Pages |

## Architecture

AI News Aggregator is a static client-side application. React renders the setup flow, sidebar, loading states, and article cards; the feed module fetches, parses, caches, and filters RSS content in the browser.

```text
Browser
  ├── Setup flow ──> localStorage preferences
  ├── Feed module ──> RSS sources / CORS proxies ──> normalized articles
  └── Main UI ──> source navigation, filters, article cards
```

## Quick Start

### Prerequisites

- Node.js and npm
- An HTTP server for local development because RSS requests are cross-origin

### 1. Clone the repository

```bash
git clone https://github.com/LeoneMarcos/AI-News-Aggregator.git
cd AI-News-Aggregator
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run locally

```bash
npm run dev
```

Open the localhost URL printed by Vite.

## Testing

```bash
npm test -- --run
npm run typecheck
npm run build
```

The Vitest suite covers feed parsing, proxy fallback behavior, cache handling, utility functions, preference migration, and the typed application modules.

## License

This project is licensed under the **Apache License 2.0**. See [`LICENSE`](LICENSE) for details.

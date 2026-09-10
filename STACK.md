# STACK.md

> Technical stack specification and implementation contract for AI News Aggregator.

**Status:** Active
**Version:** 1.0
**Last updated:** 2026-09-04
**Project type:** Client-side static web application

## 0. Contract

This document records the actual architecture, dependencies, data boundaries, security assumptions, and delivery workflow. Keep it synchronized with source, manifests, CI, crawler files, and hosting assumptions.

## 1. Context and requirements

The system must let a browser select RSS sources, fetch and parse feeds through public CORS proxy fallbacks, cache a short-lived normalized feed, filter by source, and link to original articles. It must provide progressive loading, bounded network attempts, clear failure states, strict TypeScript checks, unit/component tests, and static deployment. It does not require a database, authentication, server API, AI model, or private secret.

## 2. Stack summary

| Area | Technology | Purpose |
| --- | --- | --- |
| Language | TypeScript `^7.0.2` | Strict application and test source |
| Frontend | React `^19.2.8` / React DOM | UI and local state |
| Build | Vite `^6.2.2` | Static bundle and dev server |
| Styling | Project CSS in `src/style.css` | Token-driven editorial UI |
| Icons | lucide-react `^1.39.0` | Interface icons |
| Data | Browser fetch, RSS/Atom XML, public CORS proxies | Feed acquisition and normalization |
| Testing | Vitest `^4.1.0`, Testing Library, jsdom | Pure and component behavior |
| Hosting | Cloudflare Pages (documented deployment target) | Static production delivery |
| CI/CD | GitHub Actions | npm install, tests, typecheck, build |

## 3. Runtime and package management

Node.js 20 is the CI runtime. npm and the committed `package-lock.json` are the only package workflow. `node_modules` and generated `dist` are local artifacts. Do not hand-edit the lockfile or introduce duplicate test, styling, state, or HTTP ecosystems without a technical decision.

## 4. Frontend architecture

This is a one-route Vite SPA. `src/App.tsx` owns presentation state and composes feed, setup, and article components. `src/feed.ts` owns source catalog, proxy race/fallback, XML/JSON normalization, cache, progress, and progressive article callbacks. `src/setup.ts` owns preference storage and legacy-key migration. `src/utils.ts` provides pure-ish date and text helpers using browser parsing APIs. There is no router or global state library.

## 5. Data and trust boundaries

RSS and Atom responses, proxy JSON, article links, dates, and descriptions are untrusted external input. XML is parsed with `DOMParser`; descriptions are converted to text before rendering; external links use `target="_blank"` with `rel="noopener noreferrer"`. Each proxy attempt has a 5-second `AbortController` timeout, and all losing requests are aborted after the first success. Browser local storage is treated as untrusted and failures are non-fatal.

## 6. Security and privacy

No private credentials, authentication, authorization, user accounts, or sensitive application data are handled. Public RSS URLs and public proxies are reliability boundaries, not trusted backends. Static delivery emits `X-Content-Type-Options`, `Referrer-Policy`, and a restrictive permissions policy through `public/_headers`; no privileged operations are performed client-side.

## 7. Hosting and crawler delivery

`vite build` emits `dist`; Cloudflare Pages serves it at `https://ainews.leonemarcos.com/`. `public/robots.txt`, `public/sitemap.xml`, `public/llms.txt`, and `_headers` are root-served static files. `index.html` contains canonical, Open Graph, Twitter, JSON-LD, language, description, and theme metadata. Provider responses must be checked after a publish because a local build does not prove CDN behavior.

## 8. Testing and quality

Required gates are `npm test -- --run`, `npm run typecheck`, and `npm run build`. The suite covers RSS/Atom parsing, proxy fallback, cache expiry/corruption, selected sources, progress completion, storage failure, utilities, metadata, and the setup shell. Browser smoke should cover setup, filter controls, loading/failure messaging, external-link semantics, responsive layout, and crawler response content types when browser tooling is available.

## 9. CI/CD and performance

`.github/workflows/ci.yml` runs on pushes and pull requests to `main`, installs with `npm ci` on Node 20, runs tests, typecheck, and production build, and does not deploy or rewrite history. Keep the client bundle and first-run shell small, parallelize independent source requests, bound optional proxy work, and render valid partial results before slow sources finish. Do not add caching infrastructure or a backend without measured need.

## 10. Repository structure and policy

The repository uses `src/` for application modules, `tests/` for behavior tests, `public/` for root-served metadata/assets, `showcase-assets/` for documentation capture material, and `.github/workflows/` for CI. Keep feed/domain behavior out of presentation-only code. Do not add a database, auth provider, server framework, analytics, client-side secret, second CSS framework, or second RSS abstraction without architectural review.

## 11. Technical decisions

| Date | Decision | Alternatives | Reason | Impact |
| --- | --- | --- | --- | --- |
| 2026-09-04 | Keep client-side RSS with bounded public proxy fallbacks. | Dedicated backend/queue | The portfolio product is static and has no server requirement. | Lower infrastructure cost with explicit reliability limits. |
| 2026-09-04 | Throw on total source failure while preserving partial success. | Treat all failures as an empty feed | Readers need to distinguish “no recent articles” from an unavailable feed. | Error state and recovery messaging. |

## 12. Stack conformance audit

**Audit date:** 2026-09-04
**Overall status:** PASS WITH WARNINGS

| Area | Specification | Implementation | Severity | Action |
| --- | --- | --- | --- | --- |
| Runtime | npm lockfile, Node 20 CI, Vite SPA | Manifest, lockfile, CI, and source agree | Low | Keep runtime version visible in contributor docs |
| Data boundary | Bounded public fetches and text-only rendering | 5-second proxy aborts, loser cancellation, DOMParser, and safe text rendering are present | Low | Reassess proxy reliability if public traffic grows |
| Testing | Unit/component tests and build | 36 tests, typecheck, and build pass after changes | Low | Add browser CI only when regression risk justifies it |
| Delivery | Static metadata/crawler files at root paths | Files are in `public/` and copied by Vite | Low | Verify content type/status at the next production publish |

### Conclusion

The repository conforms to a minimal static React/Vite architecture. It has no unnecessary backend or duplicated technical solution; remaining warnings are provider verification and optional browser automation.

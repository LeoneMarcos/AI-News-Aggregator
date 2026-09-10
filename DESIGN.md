# DESIGN.md

> Design specification and implementation contract for AI News Aggregator.

**Status:** Active
**Version:** 2.0
**Last updated:** 2026-09-05
**Project type:** Client-side news reader / web app

## 0. Contract

This document is the source of truth for the visual design, UI behavior, UX conventions, and accessibility expectations. Reuse the existing tokens and patterns; document any new convention before relying on it.

## 1. Product context

AI News Aggregator lets a reader select AI publications, load a focused feed, filter it by source, and open the original article. The primary audience is a technical reader who wants a lightweight daily brief without account creation. The app runs on desktop, tablet, and mobile browsers and keeps source preferences and a short feed cache in local storage.

## 2. Direction and principles

The visual language is a quiet editorial reading room: warm ivory backgrounds, solid paper surfaces, charcoal text, terracotta accents, Newsreader serif headlines, and DM Sans interface text. Prioritize scanability, clear source identity, progressive loading, resilient failure states, keyboard access, and content hierarchy.

Avoid decorative clutter, excessive blur, motion that blocks reading, fake navigation links, cards that behave differently from their affordances, and status communicated only through color.

## 3. Foundations

### Layout and responsive behavior

Use a compact source sidebar and flexible content region above 760px. Below that, sources become a horizontally scrollable filter row. The feed uses three columns above 1150px, two columns from 481px to 1150px, and one column at 480px and below. Search and refresh stack below the feed title on small phones. Dialogs scroll within the viewport.

### Tokens

| Token | Value | Use |
| --- | --- | --- |
| page | `#F6F5F1` | Warm ivory background |
| surface | `#FFFEFA` | Paper cards and dialog |
| ink | `#252923` | Charcoal text |
| ink-soft | `#61655D` | Supporting text |
| muted | `#73766D` | Metadata |
| line | `#DDDFD5` | Dividers and borders |
| accent | `#AA462D` | Terracotta actions and selection |
| accent-hover | `#84331F` | Hovered primary actions |
| accent-wash | `#F2E7DD` | Selected navigation |

Use 6–8px control/card radii, 22–26px card padding, and restrained borders. Newsreader headlines establish an editorial hierarchy; DM Sans provides compact interface labels and readable summaries. Inter and Georgia are fallbacks. Lucide icons use consistent thin strokes. Source initials provide lightweight identity without fetching external logos. Focus outlines use the solid accent.

### Media

The `public/ai-news-aggregator-logo.webp` mark is the header, setup, favicon, and social preview image. Article media is not required; external RSS descriptions are rendered as text after HTML stripping.

## 4. Components and states

News cards show source, relative publication time, title, summary, and a single external “Read article” link. Cards are informational surfaces, not click-anywhere buttons. Source filters are buttons with `aria-current="page"`; source selection uses toggle buttons with `aria-pressed`. The refresh control has a label, disabled state, and progress feedback.

Required states are: first-run setup, loading with progressive articles and skeletons, loaded feed, filtered feed, empty selection, empty search/filter result, partial source failure, total source failure with recovery guidance, unavailable article link, and reduced-motion mode. The setup dialog supports close, Escape, backdrop dismissal, focus containment, and return focus.

## 5. Screen specifications

### Feed

The header identifies the product and opens settings. The sidebar filters the active sources. The editorial masthead establishes the brief. A toolbar shows the current source and matching article count, searches loaded titles/descriptions/source names, and refreshes current sources. Filtering and search also apply to progressively arriving articles. Cards retain one explicit original-article link; summaries are limited to four lines for scanning. Search can be cleared, and total failure includes a retry button. Primary action is opening an original article; secondary actions are choosing sources, filtering, and refreshing.

### Source setup dialog

The dialog explains the selection task, exposes all supported sources as toggles, offers select/deselect all, and saves the selected IDs before starting the feed. No source selected is an intentional empty state. Source IDs loaded from preferences are sanitized against the current source catalog.

## 6. Accessibility and interaction

Use semantic headings, articles, navigation, buttons, and external links. Provide visible focus-visible states, keyboard activation, readable text alternatives, `role="status"` for loading, `role="alert"` for total failure, and a labeled modal. Do not require hover to discover or operate an action. Respect WCAG 2.2 AA-oriented contrast and `prefers-reduced-motion`.

## 7. Implementation rules and forbidden patterns

Keep feed parsing and proxy behavior in `src/feed.ts`, pure text/date helpers in `src/utils.ts`, and preference persistence in `src/setup.ts`. Use the existing CSS token system and local React state. Do not add a backend, account system, analytics, a second CSS system, or a new proxy without a documented reliability/security decision. Never insert remote feed HTML into the DOM as trusted markup.

## 8. Design decisions

| Date | Decision | Reason | Impact |
| --- | --- | --- | --- |
| 2026-09-04 | Treat article cards as informational surfaces with one explicit external link. | A click-anywhere card duplicated navigation and was not keyboard-equivalent. | Card interaction and CSS affordance. |
| 2026-09-04 | Use real buttons for source filters. | `href="#"` links were not navigation and created unnecessary URL behavior. | Sidebar semantics and keyboard behavior. |
| 2026-09-04 | Surface total feed failure explicitly. | An all-proxy failure should not look like a valid empty feed. | Error state and retry guidance. |

## 9. Implementation status

The 2026-09-05 visual refactor implements the reading-room direction, responsive layouts, search, consistent source identity, source selection counts, and retry/empty states. The existing logo remains in use. No new dependencies were added.

Validation is pending with the user. Tests, browser checks, and a visual audit were not run for this refactor, as explicitly requested. Earlier audit results do not validate this revision.

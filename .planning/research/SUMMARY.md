# Project Research Summary

**Project:** Kollektivt -- Real-time transit departure board
**Domain:** Frontend-only real-time transit information app (Stockholm/SL)
**Researched:** 2026-03-06
**Confidence:** MEDIUM-HIGH

## Executive Summary

Kollektivt is a personal real-time departure board for Stockholm public transit (SL). The existing codebase is a working monolithic HTML file with hardcoded stops. The rebuild transforms it into a configurable app where users enter an address (or use geolocation), discover nearby stops, select which to monitor, and see live departures. This is a well-understood problem domain -- the key challenge is not complexity but rather API constraints: SL's open API lacks both geocoding and coordinate-based stop filtering, requiring a two-step approach with an external geocoding service (Nominatim) and client-side distance calculation against a cached stop list.

The recommended approach is zero-framework vanilla JS with Vite as the only build tool. The app has roughly 5 views/states, no routing, no auth, no backend. The entire runtime has zero npm dependencies -- fetch(), localStorage, and ES modules cover all needs. SL's Transport API is open (no API key), returns structured departure data, and has been verified working via live calls. The ~6500-stop list (~1MB) loads once and enables both text search and proximity matching client-side.

The primary risks are: (1) CORS policy changes on SL's API could break the app instantly -- mitigate with a prepared nginx proxy fallback on Synology, (2) localStorage schema evolution can crash the app for existing users -- mitigate with versioned schemas from day one, and (3) the geocoding step (address to coordinates) is an external dependency that must be handled with proper rate limiting and caching. None of these are blockers, but all must be addressed in the architecture phase rather than discovered later.

## Key Findings

### Recommended Stack

Zero runtime dependencies. Vite 6.x for dev server and build. Plain CSS with custom properties. All APIs are open REST endpoints consumed directly via fetch().

**Core technologies:**
- **Vite 6.x**: Dev server + bundler -- zero-config for vanilla JS, outputs static files for nginx deployment
- **SL Transport API**: Departures and stop data -- open, no API key, verified working
- **Nominatim (OpenStreetMap)**: Address geocoding -- free, no API key, good Swedish coverage, 1 req/s rate limit
- **Browser Geolocation API**: "Use my location" complement to address search

**Explicitly rejected:** React/Vue/Svelte (overkill), Tailwind/Sass (overkill), Axios (native fetch sufficient), Google Geocoding (costs money), any state management library.

### Expected Features

**Must have (table stakes):**
- Address search with geocoding to find nearby stops
- Nearby stop discovery (client-side haversine filtering)
- Stop selection with localStorage persistence
- Real-time departure list with delay indication
- Disruption/deviation messages
- Auto-refresh (30s polling)
- Mobile-responsive layout
- Loading and error states

**Should have (high value, low effort -- include early):**
- Direction filtering per stop (API provides direction_code)
- Line filtering per stop
- Geolocation ("use my location" button)
- Countdown + absolute time display

**Defer (v2+):**
- PWA / installable with service worker
- Multiple saved locations ("Home", "Work")
- Walk time indicator ("leave in 3 min")
- Compact/dashboard mode toggle

**Anti-features (never build):**
- Trip planning, map view, push notifications, user accounts, ticket purchasing, multi-city support

### Architecture Approach

Modular vanilla JS SPA with event-based reactivity. A central state manager (extending EventTarget) holds selected stops and departure data, emits events on changes. UI components subscribe to relevant events. Persistence layer syncs state to versioned localStorage. Departure fetcher uses Promise.allSettled for parallel per-stop API calls with independent error handling.

**Major components:**
1. **State Manager** -- central hub, event-based reactivity, holds all app state
2. **Sites Data Layer** -- loads/caches full SL stop list, provides search and geo-distance filtering
3. **Departure Fetcher** -- polls SL API per stop, parallel requests, independent error handling
4. **Search Module** -- address input with Nominatim geocoding + debounced stop name search
5. **UI Renderer** -- departure cards, deviation warnings, loading/error states per stop
6. **Persistence Layer** -- versioned localStorage with migration support

### Critical Pitfalls

1. **No geocoding in SL's API** -- Address search requires external geocoding (Nominatim) as a separate step before stop proximity filtering. Design the two-step flow from the start.
2. **CORS fragility** -- SL's API works from browsers today but has no SLA. Prepare an nginx proxy fallback on Synology that can be activated without code changes.
3. **Polling in background tabs** -- Use document.visibilitychange to pause/resume. Without this, the app wastes bandwidth and risks rate limiting.
4. **localStorage schema breakage** -- Add version field and migration functions from day one. Wrap all reads in try/catch with defaults.
5. **direction_code is unreliable** -- Values 1/2 are not consistent across stops. Let users pick directions in the UI rather than hardcoding.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Data Layer
**Rationale:** Everything depends on the state manager, persistence layer, and cached stop data. The geocoding strategy and CORS approach must be decided here -- these are architectural decisions that cascade through the entire app.
**Delivers:** Project scaffolding (Vite), state manager with event bus, versioned localStorage persistence, SL sites data loading/caching (~6500 stops), haversine distance utility, Nominatim geocoding integration.
**Addresses:** Core data infrastructure that all features depend on.
**Avoids:** Pitfall 1 (geocoding gap), Pitfall 4 (localStorage versioning), Pitfall 5 (site vs stop ID confusion).

### Phase 2: Search and Stop Selection
**Rationale:** The primary new functionality -- letting users find and choose stops. Depends on the data layer from Phase 1.
**Delivers:** Address search with geocoding, stop name search with debounce, nearby stops list (sorted by distance), stop selection/deselection UI, geolocation button, persistence of selections.
**Addresses:** Address search, nearby stops, stop selection, geolocation (table stakes + early differentiators).
**Avoids:** Pitfall 7 (geocoding rate limits -- implement debounce and caching), Pitfall 12 (too many results -- limit to 10-15 nearest).

### Phase 3: Departure Display
**Rationale:** The core value -- showing live departures for selected stops. Depends on stop selection from Phase 2.
**Delivers:** Dynamic departure cards per selected stop, real-time data with auto-refresh, delay indication, disruption messages, countdown + absolute time, smart polling with visibility check.
**Addresses:** Real-time departures, auto-refresh, delay indication, disruptions, countdown display.
**Avoids:** Pitfall 3 (polling without visibility check), Pitfall 6 (generic error messages -- implement differentiated errors with retry).

### Phase 4: Filtering and Preferences
**Rationale:** Refinement features that reduce noise. Low complexity, high value. Depends on departure display working.
**Delivers:** Direction filtering per stop, line filtering per stop, transport mode icons/badges for all modes, offline indication.
**Addresses:** Direction filtering, line filtering, transport mode icons (differentiators).
**Avoids:** Pitfall 9 (direction_code unreliability -- let users choose destination-based filtering in UI).

### Phase 5: Responsive Design and Polish
**Rationale:** The app replaces three separate HTML files (index, ipad, nest) with one responsive design. Do this after functionality is complete.
**Delivers:** Single responsive layout replacing index.html/ipad.html/nest.html, mobile-first design tested at 320px, tablet and Nest Hub optimizations, font loading optimization, CORS proxy fallback setup.
**Addresses:** Mobile-responsive layout, consolidated device support (anti-feature: separate device pages).
**Avoids:** Pitfall 8 (narrow screen breakage), Pitfall 10 (font blocking), Pitfall 2 (CORS -- proxy fallback deployed).

### Phase 6: PWA and Extended Features
**Rationale:** Nice-to-have features that enhance the experience once the core is solid.
**Delivers:** Service worker for offline shell, installable PWA, multiple saved locations, walk time indicator.
**Addresses:** Deferred features from FEATURES.md.

### Phase Ordering Rationale

- **Data before UI:** State manager and data layer must exist before any UI can be built. This is the clear dependency chain identified in architecture research.
- **Search before departures:** Users must be able to find and select stops before they can view departures. The current hardcoded approach is being replaced.
- **Functionality before design:** Responsive polish comes after features work. This aligns with the project's "for placement only" design philosophy.
- **Core before extras:** PWA and multi-location are genuinely additive and have no dependencies from other phases.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1:** Nominatim API integration specifics (rate limiting, response format, Swedish address quality). The geocoding flow is the one truly new architectural element.
- **Phase 2:** Search UX patterns -- how to combine address geocoding results with stop name search in one input field.

Phases with standard patterns (skip research-phase):
- **Phase 3:** Departure fetching is already implemented in the existing app. Refactoring to modular code is straightforward.
- **Phase 4:** Simple client-side filtering on existing API data. Well-understood patterns.
- **Phase 5:** Standard responsive CSS. No novel challenges.
- **Phase 6:** PWA/service worker is well-documented with many guides available.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Vanilla JS + Vite is the obvious choice. No runtime dependencies needed. APIs verified via live calls. |
| Features | MEDIUM-HIGH | Table stakes clear from domain analysis. Differentiators based on comparable transit apps (training data, not live verification). |
| Architecture | HIGH | Modular vanilla JS SPA is well-understood. Event-based state management is a proven pattern. API shapes verified. |
| Pitfalls | MEDIUM-HIGH | CORS risk is real but severity is uncertain. localStorage and polling pitfalls are well-known patterns. Geocoding specifics need validation. |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **Nominatim response quality for Swedish addresses:** Need to validate during Phase 1 that Nominatim returns accurate coordinates for Stockholm street addresses. Fallback: rely more heavily on geolocation + stop name search.
- **SL Deviations API structure:** The deviations endpoint exists but response format was not fully verified. Validate during Phase 3 implementation.
- **CORS long-term stability:** No way to predict if/when SL changes CORS policy. The proxy fallback must be ready but may never be needed.
- **Stop grouping logic:** Stops on opposite sides of the same street appear as separate entries. Need to decide during Phase 2 whether to group them (by proximity or by name similarity).

## Sources

### Primary (HIGH confidence)
- SL Transport API -- live API calls to `transport.integration.sl.se/v1/sites` and `/sites/{id}/departures` (2026-03-06)
- Existing codebase analysis -- `index.html`, `ipad.html`, `nest.html` in project root
- Trafiklab.se -- API catalog confirming SL Transport, SL Deviations as open APIs

### Secondary (MEDIUM confidence)
- Nominatim/OpenStreetMap usage policy and rate limits (well-known service, not live-tested with Swedish addresses)
- Comparable transit apps (SL-appen, Citymapper, Transit) -- feature landscape based on training data
- Vite 6.x capabilities -- standard tool, high confidence but version details from training data

### Tertiary (LOW confidence)
- SL Deviations API response structure -- endpoint confirmed to exist but not fully exercised
- CORS behavior predictions -- based on current observed behavior, may change

---
*Research completed: 2026-03-06*
*Ready for roadmap: yes*

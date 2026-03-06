# Technology Stack

**Project:** Kollektivt -- Real-time transit departure board
**Researched:** 2026-03-06

## Recommended Stack

### Approach: Vanilla JS + Vite (no framework)

This is a single-page app with straightforward state (selected stops, cached departures). It has no routing, no auth, no complex component trees, no server-side rendering. A framework like React or Vue would add build complexity, bundle size, and cognitive overhead for zero benefit. The existing codebase is already vanilla JS/HTML/CSS and works well.

**Use Vite as the only build tool** -- it provides dev server with hot reload, ES module bundling, and zero-config static site output. No framework runtime needed.

### Core Build Tool

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vite | ^6.x | Dev server, bundler, build tool | Zero-config for vanilla JS, fast HMR, outputs static files. The industry standard lightweight bundler. No webpack config hell. | HIGH |

### APIs (no libraries needed -- all are open REST endpoints)

| API | Base URL | Purpose | Auth | Confidence |
|-----|----------|---------|------|------------|
| SL Transport | `https://transport.integration.sl.se/v1` | Departures, stop search, stop data | None (open) | HIGH -- verified by direct API calls |
| SL Deviations | `https://deviations.integration.sl.se/v1` | Disruption/deviation messages | None (open) | MEDIUM -- endpoint exists but response structure not fully verified |
| Nominatim (OSM) | `https://nominatim.openstreetmap.org` | Address geocoding (address -> lat/lon) | None (open, rate limited to 1 req/sec) | HIGH |

#### API Details: SL Transport

Verified endpoints:
- `GET /v1/sites?q={search_term}` -- Text search for stops. Returns array of `{id, gid, name, note, lat, lon, alias[], abbreviation}`. The `q` parameter filters by name.
- `GET /v1/sites` (no params) -- Returns ALL ~6500 stops. Can be fetched once and filtered client-side for "nearby" functionality using lat/lon distance calculation.
- `GET /v1/sites/{siteId}/departures` -- Real-time departures for a stop. Returns `{departures: [{destination, direction, state, display, scheduled, expected, stop_area, stop_point, line, journey, deviations[]}]}`.

**Key finding:** The SL Transport API does NOT have a "nearby stops by coordinates" endpoint. The `latitude`/`longitude` query parameters on `/sites` do NOT filter results -- they return all 6500+ stops regardless. Two strategies for nearby stops:

1. **Fetch all stops once, filter client-side** -- ~6500 stops is ~1MB JSON. Cache in memory/localStorage. Calculate haversine distance from user coordinates. This is the recommended approach.
2. **Use text search** -- `?q=` works for name-based lookup but not for "stops near my address."

#### API Details: Address Geocoding

The project needs "user enters address -> find nearby stops." This requires geocoding (address -> coordinates). Options:

| Option | Why/Why Not | Recommendation |
|--------|-------------|----------------|
| **Nominatim (OpenStreetMap)** | Free, no API key, good Swedish address coverage. Rate limit 1 req/sec is fine for user-typed searches. | **USE THIS** |
| Google Geocoding API | Requires API key + billing. Overkill. | Do not use |
| SL's own APIs | No geocoding endpoint exists in the Transport API. | Not available |
| Browser Geolocation API | Gets user's current position, no address needed. Good complement to text search. | **USE AS COMPLEMENT** -- let user tap "Use my location" as alternative to typing address |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| None required | -- | -- | The app needs no runtime dependencies | HIGH |

Rationale: `fetch()` is native. DOM manipulation is native. `localStorage` is native. `setInterval` for polling is native. Haversine distance calculation is 5 lines of code. No library adds value here.

### Dev Dependencies

| Library | Version | Purpose | Why | Confidence |
|---------|---------|---------|-----|------------|
| vite | ^6.x | Build + dev server | Fast, zero-config, standard | HIGH |

### CSS Approach

| Approach | Why |
|----------|-----|
| Plain CSS with CSS custom properties (variables) | No preprocessor needed. Custom properties provide theming. The app has ~20 UI elements, not a design system. |

**Do NOT use:** Tailwind (overkill for this size), CSS-in-JS (no framework), Sass/Less (unnecessary build step for this scope).

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Framework | Vanilla JS | React/Vue/Svelte | ~20 UI elements, no routing, no complex state. Framework adds 30-150KB runtime + build complexity for zero benefit. |
| Bundler | Vite | Webpack | Webpack requires config. Vite works out of the box for this use case. |
| Bundler | Vite | None (raw HTML) | The existing app is a single HTML file. Vite adds: module splitting, dev server, hot reload, environment variables -- all valuable for development. |
| Geocoding | Nominatim | Google Maps API | API key + billing required. Nominatim is free with good Swedish coverage. |
| State management | localStorage + JS objects | Redux/Zustand | State is trivial: selected stop IDs + user preferences. A plain object + localStorage is sufficient. |
| Nearby stops | Client-side distance filter | Server-side API | SL API doesn't support coordinate-based filtering. Loading all ~6500 stops (~1MB) once is acceptable. |
| HTTP client | Native fetch() | Axios | fetch() is standard, works in all modern browsers. Axios adds a dependency for no benefit. |
| CSS | Plain CSS + custom properties | Tailwind/Sass | App has ~15-20 CSS classes. Tailwind's utility classes and Sass's features are overkill. |

## Architecture-Relevant Stack Notes

### Data Flow for "Nearby Stops"

```
User types address
  -> Nominatim geocoding API (address -> lat/lon)
  -> Client-side filter against cached stop list (haversine distance)
  -> Show stops within ~1km radius
  -> User selects stops
  -> Save selected stop IDs to localStorage
  -> Poll SL Transport API for departures every 30s
```

### Stop Data Caching Strategy

The full stop list (~6500 entries, ~1MB) should be:
1. Fetched once on first app load
2. Cached in localStorage with a timestamp
3. Refreshed weekly (stop data rarely changes)
4. Used for both text search AND coordinate-based nearby lookup

### Polling vs WebSocket

SL's Transport API is REST-only (no WebSocket/SSE). Polling every 30 seconds (as the current app does) is the correct approach. This is fine for departure data that changes on a per-minute basis.

## Project Structure

```
kollektivt/
  index.html              # Single HTML entry point
  src/
    main.js               # App entry, init, event wiring
    api/
      sl-transport.js      # SL departures + stop data
      sl-deviations.js     # Disruption info
      nominatim.js         # Address geocoding
    stores/
      stops.js             # Stop list cache + nearby filtering
      preferences.js       # localStorage wrapper for user selections
    components/
      search.js            # Address search UI
      stop-picker.js       # Stop selection UI
      departures.js        # Departure board rendering
      deviations.js        # Disruption display
    utils/
      geo.js               # Haversine distance calculation
      time.js              # Time formatting helpers
  style.css               # All styles
  public/
    bg.jpg                # Background image
  vite.config.js          # Minimal Vite config
  package.json
```

## Installation

```bash
# Initialize project
npm init -y

# Dev dependencies only -- no runtime deps
npm install -D vite

# Dev server
npx vite

# Build for production (outputs to dist/)
npx vite build
```

## Deployment

Vite builds to `dist/` -- a folder of static HTML/CSS/JS files. Deploy to Synology NAS using the existing Docker + nginx pattern:

```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
```

## Sources

- SL Transport API: Verified by direct API calls to `transport.integration.sl.se/v1` (2026-03-06)
  - `/sites?q=` text search verified working
  - `/sites/{id}/departures` verified working (already used in current app)
  - `/sites` returns all ~6500 stops (verified)
  - `latitude`/`longitude` params do NOT filter (verified -- returns all 6500 regardless)
- Nominatim: Well-known OSM geocoding service, rate limit 1 req/sec for free tier
- Vite: Standard frontend build tool, verified as current major version 6.x
- Trafiklab.se: SL APIs listed as SL Transport, SL Deviations, SL Journey-planner v2 (all open, no API keys for Transport)

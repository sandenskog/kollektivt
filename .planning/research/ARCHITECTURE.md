# Architecture Patterns

**Domain:** Frontend-only real-time transit departure app
**Researched:** 2026-03-06

## Recommended Architecture

A single-page application (SPA) built as a modular vanilla JS app (or lightweight framework), with clear separation between API communication, state management, UI rendering, and persistence. No backend -- the browser talks directly to SL's open APIs.

### High-Level Overview

```
[User Input] --> [Search Module] --> [SL Sites Data] --> [Stop Selection]
                                                              |
                                                              v
[localStorage] <--> [State Manager] --> [Departure Fetcher] --> [SL Departures API]
                                              |
                                              v
                                     [UI Renderer] --> [DOM]
                                              ^
                                              |
                                     [Auto-Refresh Timer]
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Search Module** | Address/stop input with typeahead, filters site list | SL Sites Data (client-side), State Manager |
| **Sites Data Layer** | Loads and caches the full SL sites list (~6500 stops), provides search/filter/geo-distance functions | SL Sites API (once), Search Module |
| **State Manager** | Holds selected stops, user preferences; syncs to localStorage | All components (central hub) |
| **Departure Fetcher** | Polls SL departures API for each selected stop on interval | SL Departures API, State Manager |
| **UI Renderer** | Renders departure cards, deviation warnings, loading/error states | DOM, State Manager |
| **Persistence Layer** | Reads/writes selected stops and preferences to localStorage | State Manager |
| **Auto-Refresh Timer** | Triggers periodic re-fetch of departures (every 30s) | Departure Fetcher |

### Data Flow

**Initial Load:**
1. Persistence Layer reads saved stops from localStorage
2. State Manager initializes with saved stops (or empty if first visit)
3. If stops exist: Departure Fetcher immediately fetches departures for all saved stops
4. UI Renderer displays departures grouped by stop
5. Auto-Refresh Timer starts 30-second interval

**Stop Search & Selection Flow:**
1. User types in search input
2. Search Module filters the cached sites list (client-side text matching + optional geo-distance)
3. Results shown as dropdown/list
4. User selects a stop --> State Manager updates selected stops
5. Persistence Layer saves to localStorage
6. Departure Fetcher immediately fetches departures for new stop
7. UI Renderer updates

**Departure Update Flow (every 30s):**
1. Auto-Refresh Timer triggers
2. Departure Fetcher makes parallel `fetch()` calls to `transport.integration.sl.se/v1/sites/{id}/departures` for each selected stop
3. State Manager receives new departure data
4. UI Renderer re-renders departure cards
5. Timestamp display updates

## Key Architectural Decisions

### 1. Client-Side Stop Search (not API-based typeahead)

**Decision:** Load the full SL sites list (~6500 entries, ~1MB JSON) once and search client-side.

**Rationale:**
- SL's transport API exposes `/v1/sites` which returns all stops with id, name, lat/lon
- 6500 entries is small enough to hold in memory and search instantly
- Eliminates need for a separate typeahead API (SL's platsuppslag/typeahead APIs require API keys)
- No network latency on each keystroke
- Can combine text search with geo-distance sorting (using browser Geolocation API)

**Implementation:** Fetch sites list on app load, cache in memory (and optionally in localStorage/sessionStorage for faster subsequent loads). Use simple string matching (`.includes()` or fuzzy match) for search.

**Confidence:** HIGH -- verified that `/v1/sites` returns 6497 stops with name, id, lat, lon, no API key required.

### 2. One API Call Per Stop (not batched)

**Decision:** Make separate `fetch()` calls per selected stop.

**Rationale:**
- SL's API endpoint is per-site: `/v1/sites/{siteId}/departures`
- No batch endpoint exists
- `Promise.all()` handles parallel requests efficiently
- Typical user watches 2-5 stops, so 2-5 parallel requests every 30s is negligible

### 3. No Framework for MVP, Module-Based Vanilla JS

**Decision:** Use vanilla JS with ES modules (import/export), no framework.

**Rationale:**
- The existing app is a single HTML file with inline JS -- already works
- The new app has limited interactivity (search input, stop selection, departure display)
- No complex component trees, no routing, no forms
- ES modules provide sufficient code organization
- Zero build step keeps deployment simple (static files on Synology NAS)
- Can always add a lightweight framework later if complexity grows

**Alternative considered:** Preact/Lit -- would add minimal overhead but also minimal benefit for this scope. The app has ~5 views/states, not 50.

### 4. Flat State Model

**Decision:** Single state object with selected stops and their departure data.

```javascript
// State shape
{
  selectedStops: [
    { id: 9733, name: "Vega station", lat: 59.28, lon: 18.12 },
    { id: 8262, name: "Kvarntorpsvägen", lat: 59.27, lon: 18.11 }
  ],
  departures: {
    9733: { data: [...], lastFetched: "2026-03-06T10:30:00", error: null },
    8262: { data: [...], lastFetched: "2026-03-06T10:30:00", error: null }
  },
  ui: {
    searchQuery: "",
    searchResults: [],
    isSearching: false
  }
}
```

**Rationale:** Simple pub/sub or event-based state updates. No need for Redux/Zustand complexity. A simple `EventTarget` or custom event bus handles reactivity.

## File Structure

```
kollektivt/
  index.html              # Single HTML entry point
  bg.jpg                  # Background image
  css/
    styles.css            # All styles (extracted from inline)
  js/
    app.js                # Entry point, initializes modules
    state.js              # State manager with event bus
    api/
      sites.js            # Sites data loading and search
      departures.js       # Departure fetching and parsing
    ui/
      search.js           # Search input and results dropdown
      departures.js       # Departure card rendering
      status.js           # Loading, error, timestamp display
    utils/
      time.js             # Time formatting, delay calculation
      geo.js              # Geo-distance calculation (Haversine)
      storage.js          # localStorage read/write
```

## Patterns to Follow

### Pattern 1: Event-Based Reactivity
**What:** State changes emit events; UI components subscribe to relevant events.
**When:** Any state mutation (stop added/removed, departures updated, search query changed).
**Example:**
```javascript
// state.js
class AppState extends EventTarget {
  #state = { selectedStops: [], departures: {} };

  addStop(stop) {
    this.#state.selectedStops.push(stop);
    this.dispatchEvent(new CustomEvent('stops-changed', { detail: this.#state.selectedStops }));
    this.#persist();
  }

  updateDepartures(siteId, data) {
    this.#state.departures[siteId] = { data, lastFetched: new Date(), error: null };
    this.dispatchEvent(new CustomEvent('departures-updated', { detail: { siteId, data } }));
  }
}
```

### Pattern 2: Graceful Degradation Per Stop
**What:** Each stop's departures fetch independently; one failure doesn't block others.
**When:** Network errors, API timeouts, individual stop issues.
**Example:**
```javascript
// Fetch all stops in parallel, handle failures individually
const results = await Promise.allSettled(
  selectedStops.map(stop => fetchDepartures(stop.id))
);
results.forEach((result, i) => {
  if (result.status === 'fulfilled') {
    state.updateDepartures(selectedStops[i].id, result.value);
  } else {
    state.setDepartureError(selectedStops[i].id, result.reason);
  }
});
```

### Pattern 3: Debounced Search
**What:** Debounce search input to avoid filtering on every keystroke.
**When:** User types in stop search field.
**Example:**
```javascript
let debounceTimer;
searchInput.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const results = sitesData.search(e.target.value);
    state.setSearchResults(results);
  }, 150); // 150ms is enough for client-side search
});
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Monolithic HTML File
**What:** Keeping all CSS, JS, and HTML in a single file (current state).
**Why bad:** Impossible to maintain, test, or extend. Adding search + stop selection to the current 600-line file would push it past 1500+ lines.
**Instead:** Extract into modules as described in file structure above.

### Anti-Pattern 2: Hardcoded Stop IDs
**What:** Baking specific site IDs and direction codes into the source code (current state: `VEGA_SITE_ID = 9733`).
**Why bad:** Defeats the purpose of a configurable app. Every new stop requires a code change.
**Instead:** Store selected stops in state/localStorage with their metadata. Direction filtering should be user-configurable or auto-detected.

### Anti-Pattern 3: Polling Without Visibility Check
**What:** Continuing to fetch departures every 30s even when the browser tab is hidden.
**Why bad:** Wastes bandwidth, battery, and API resources.
**Instead:** Use `document.visibilitychange` event to pause/resume polling. Resume with immediate fetch when tab becomes visible.

### Anti-Pattern 4: Full Re-render on Every Update
**What:** Replacing all DOM content with `innerHTML` on every 30-second refresh.
**Why bad:** Causes flicker, loses scroll position, poor performance.
**Instead:** Diff-update only changed departure rows, or use a simple keyed rendering approach.

## SL API Integration Details

### Endpoints Used

| Endpoint | Method | Auth | Purpose | Rate |
|----------|--------|------|---------|------|
| `/v1/sites` | GET | None | Full stop list (6497 entries) | Once on load |
| `/v1/sites/{id}/departures` | GET | None | Real-time departures for a stop | Every 30s per stop |

### API Response: Departures

Key fields per departure object:
- `destination` -- final stop name
- `direction_code` -- route direction (1 or 2)
- `display` -- human-readable time ("Nu", "5 min", "14:30")
- `scheduled` -- ISO timestamp of planned departure
- `expected` -- ISO timestamp of predicted departure (null if no real-time data)
- `state` -- "EXPECTED" or "NORMALPROGRESS"
- `line.designation` -- line number ("810", "40")
- `line.transport_mode` -- "BUS", "TRAIN", "METRO", "TRAM", "SHIP"
- `stop_area.name` -- stop area name
- `stop_point.designation` -- platform/bay letter
- `deviations[]` -- array of disruption messages with importance level

### API Response: Sites

Key fields per site:
- `id` -- numeric stop ID (used in departures endpoint)
- `name` -- stop name
- `lat`, `lon` -- coordinates
- `note` -- optional area/context note
- `alias` -- alternative names (for search matching)

**Confidence:** HIGH -- verified by live API calls during research.

## Scalability Considerations

| Concern | 1-3 stops (typical) | 10+ stops | 50+ stops (edge case) |
|---------|---------------------|-----------|----------------------|
| API calls per refresh | 1-3 parallel fetches | 10 parallel fetches, still fine | Throttle/batch with staggered timing |
| Sites list in memory | ~1MB, trivial | Same (loaded once) | Same |
| DOM nodes | ~20-60 departure rows | ~100-200 rows | Consider virtual scrolling |
| localStorage | <10KB | <50KB | Still fine (5MB limit) |

For this app's use case (personal/household use, 2-5 stops), scalability is a non-concern.

## Suggested Build Order

Based on component dependencies:

```
Phase 1: Foundation
  ├── Extract CSS/JS from monolith into modules
  ├── State manager (core of everything)
  └── Persistence layer (localStorage read/write)

Phase 2: Data Layer
  ├── Sites data layer (load + cache + search)
  ├── Departure fetcher (refactored from current inline code)
  └── Auto-refresh timer with visibility check

Phase 3: UI - Search & Selection
  ├── Search input with debounced filtering
  ├── Results dropdown
  └── Stop selection/removal

Phase 4: UI - Departures Display
  ├── Dynamic departure cards (per selected stop)
  ├── Deviation warnings
  └── Loading/error states per stop

Phase 5: Polish
  ├── Geolocation for "nearby stops" sorting
  ├── Direction filtering per stop
  └── Responsive design refinements
```

**Dependency chain:** State Manager --> Persistence --> Data Layer --> UI. Search and Departures UI are independent of each other but both depend on State and Data layers.

## Sources

- SL Transport API: `https://transport.integration.sl.se/v1/sites` (live, verified 2026-03-06) -- no auth required, returns 6497 stops
- SL Departures API: `https://transport.integration.sl.se/v1/sites/{id}/departures` (live, verified 2026-03-06) -- no auth required
- Trafiklab API documentation: `https://www.trafiklab.se/api/` (overview of available SL APIs)
- Existing codebase: `index.html` in project root (current monolithic implementation)

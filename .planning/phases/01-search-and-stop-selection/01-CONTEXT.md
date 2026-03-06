# Phase 1: Search and Stop Selection - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can find nearby stops by address or geolocation, select which to monitor, and have their choices remembered across sessions. This phase delivers the data layer, search, and selection — not departure display (Phase 2).

</domain>

<decisions>
## Implementation Decisions

### Search interaction
- Autocomplete as-you-type with debounce (~300ms) against Nominatim
- Results appear in a dropdown below the input field
- "Use my location" button next to the search field — triggers browser geolocation API
- Geolocation result feeds into the same nearby-stops flow as address search
- Search field stays visible at the top of the app at all times

### Stop results
- After address/geolocation resolves, show nearby stops from SL's stop lookup API
- Each stop shows: name, distance (e.g. "350m"), and transport mode icons (bus/train/metro/tram)
- Sort by distance, closest first
- Show up to 10 stops within ~1km radius
- If no stops found within radius, show a friendly message

### Selection and persistence
- Tap/click a stop to select it (toggle) — visual highlight on selected stops
- Selected stops appear in a separate "My stops" section above the search results
- Deselecting from "My stops" removes it
- All selections saved to localStorage immediately on change
- localStorage schema includes a version field for future migrations

### App flow
- First visit (no saved stops): show search field prominently with a brief instruction ("Search for an address or use your location to find nearby stops")
- After selecting stops: "My stops" section at top, search field below (collapsed or secondary)
- Returning user with saved stops: show "My stops" immediately, search available but not prominent
- "My stops" section is the anchor — in Phase 2 this is where departures will attach

### Claude's Discretion
- Project scaffolding choices (framework, build tools, folder structure)
- Nominatim vs SL's own place lookup — whichever works best for Swedish addresses
- Exact component structure and state management approach
- Loading states and micro-interactions during search
- How to handle Nominatim rate limiting

</decisions>

<specifics>
## Specific Ideas

No specific requirements — user deferred all areas to best practice. Open to standard approaches.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bg.jpg`: Background image, can be reused in new app
- Visual style: Nunito font, glassmorphism cards (`rgba(255,255,255,0.92)`, `backdrop-filter: blur(16px)`), rounded corners — established aesthetic to maintain
- SL Transport API base URL: `https://transport.integration.sl.se/v1`
- `fetchDepartures()` pattern: simple fetch against SL API — reusable pattern

### Established Patterns
- Inline CSS/JS in single HTML file — will likely be replaced with proper project structure
- Swedish locale formatting (`sv-SE`)
- 30-second refresh interval (relevant for Phase 2)

### Integration Points
- SL Transport API for stop data (`/sites/{id}/departures` exists, need to find stop-search endpoint)
- Nominatim for geocoding (new integration)
- localStorage for persistence (new, replaces hardcoded site IDs)
- "My stops" section will be the mount point for Phase 2 departure display

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-search-and-stop-selection*
*Context gathered: 2026-03-06*

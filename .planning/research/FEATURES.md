# Feature Landscape

**Domain:** Real-time transit departure board (Stockholm/SL)
**Researched:** 2026-03-06
**Overall confidence:** MEDIUM-HIGH (based on existing app analysis, SL API verification, and domain knowledge of transit apps like SL-appen, Res i Sthlm, Citymapper, Transit)

## Table Stakes

Features users expect from a real-time departure app. Missing any of these and the app feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Address/place search** | Core flow: user types address to find stops | Medium | SL API has no server-side search -- must load all ~6500 sites and filter client-side, or use a geocoding API (Nominatim/Google) + proximity matching |
| **Nearby stops from address** | Users think in addresses, not stop IDs | Medium | Sites API provides lat/lon for all stops; calculate Haversine distance from geocoded address. Show within ~500-1000m radius |
| **Select/deselect stops to monitor** | Users only care about their stops, not all nearby | Low | Checkbox/toggle UI. Persist selection in localStorage |
| **Real-time departure list** | The core value proposition | Low | Already implemented in current app. SL departures API returns scheduled, expected, display, line info |
| **Delay indication** | Users need to know if departure is on time | Low | Already implemented. Compare `scheduled` vs `expected` timestamps |
| **Auto-refresh** | Departure boards must stay current without manual reload | Low | Already implemented (30s interval). Consider reducing to 15-20s |
| **Disruption/deviation messages** | Users must know about cancelled services, reroutes | Low | Already implemented. API returns `deviations` array per departure |
| **Mobile-responsive layout** | Majority of usage is on phones | Low | Already implemented with responsive CSS |
| **Persist user preferences** | Users should not reconfigure every visit | Low | localStorage for selected stops, address. Already in project requirements |
| **Loading and error states** | Users need feedback when data is loading or API fails | Low | Already partially implemented. Add retry logic and clearer error messages |
| **Transport mode icons/badges** | Visual distinction between bus, train, metro, tram, ferry | Low | Already implemented for bus/train. Extend to all SL transport modes (METRO, TRAM, SHIP, FERRY) |

## Differentiators

Features that set this app apart. Not expected, but create a notably better experience.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **"Walk time" indicator** | Show "Leave now" / "Leave in 3 min" based on walking distance to stop | Medium | Requires knowing distance from user's address to each stop. Calculate walking time (~5 km/h). Very useful for "should I hurry?" decisions |
| **Direction filtering** | Only show departures in the direction the user cares about (e.g., "toward city center") | Low | API provides `direction_code` (1 or 2) and `direction` text. Let users toggle per stop |
| **Line filtering** | Only show specific lines from a stop (e.g., bus 810 but not 809) | Low | Easy filter on `line.designation`. Useful at stops with many lines |
| **Grouped by stop** | Show departures organized by stop, not one big list | Low | Natural UX for multi-stop monitoring. Current app already does this |
| **Countdown display** | "3 min" relative time alongside absolute "14:23" | Low | API provides `display` field with relative time. Show both for quick scanning |
| **Installable PWA** | Add to home screen, works offline (cached shell), feels native | Medium | Service worker for shell caching. Manifest.json for install prompt. Offline shows last known data |
| **Multiple saved locations** | "Home", "Work", "Gym" -- switch between preset configurations | Medium | Store multiple address + stop selections in localStorage. Quick-switch UI |
| **Geolocation support** | "Use my current location" button as alternative to typing address | Low | Browser Geolocation API. Skip address entry, go straight to nearby stops |
| **Compact/dashboard mode** | Dense view optimized for always-on displays (tablets, Nest Hub) | Medium | Current app has nest.html and ipad.html. The new responsive design should handle this, but a toggle for "compact mode" could reduce padding/font sizes |

## Anti-Features

Features to explicitly NOT build. These add complexity without proportional value for this app's scope.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Trip planner / routing** | Massive scope increase. SL's own app and Google Maps already do this well. This app's value is "quick glance at departures" | Link out to SL's journey planner or Google Maps for "plan trip" |
| **User accounts / login** | No cross-device sync need justifies the backend complexity. localStorage is sufficient | Use localStorage. If users want sync, they can set up the same address on each device |
| **Map view** | Maps add heavy dependencies (Leaflet/Google Maps), complexity, and distract from the core list-based UX | Show stop names with distance. A map adds little value for "when does my bus leave?" |
| **Push notifications** | Requires a backend/service worker with push subscription, ongoing server costs | Users open the app when they need it. A PWA with quick load is sufficient |
| **Ticket purchasing** | Completely different domain. SL's app handles this | Not applicable |
| **Historical data / statistics** | "How late is line 810 usually?" is interesting but out of scope and requires data storage | Show current status only |
| **Multi-city support** | Stockholm/SL only. Other cities have different APIs | Keep scoped to SL's API. The architecture could allow it later but don't design for it now |
| **Accessibility voice announcements** | Screen reader support (aria labels) is table stakes, but building a custom voice announcement system is over-engineering | Use proper semantic HTML and ARIA attributes for screen reader compatibility |
| **Separate device-specific pages** | Current app has index.html, ipad.html, nest.html -- three codebases to maintain | One responsive design that adapts. PROJECT.md already specifies this |

## Feature Dependencies

```
Address Search ──→ Nearby Stops ──→ Stop Selection ──→ Departure List
                                         │
                                         ├──→ Direction Filtering
                                         ├──→ Line Filtering
                                         └──→ Persist Preferences (localStorage)

Geolocation ──→ Nearby Stops (alternative to Address Search)

Departure List ──→ Auto-refresh
               ──→ Delay Indication
               ──→ Disruption Messages
               ──→ Countdown Display

Multiple Saved Locations ──→ requires Stop Selection + Persist Preferences

PWA (Service Worker) ──→ independent, can be added at any phase

Walk Time Indicator ──→ requires Nearby Stops (distance data already available)
```

## MVP Recommendation

### Must have for launch (table stakes):
1. **Address search with autocomplete** -- the entry point to the entire app
2. **Nearby stops discovery** -- bridges address to departures
3. **Stop selection with persistence** -- user chooses what to monitor
4. **Real-time departure list with delays and disruptions** -- the core value
5. **Auto-refresh** -- departures stay current
6. **Mobile-responsive design** -- where most users will be

### Include early (high value, low effort):
1. **Direction filtering** -- halves the noise, one toggle per stop
2. **Line filtering** -- essential at busy stops
3. **Geolocation** -- one button, skips address entry
4. **Countdown + absolute time** -- already available from API

### Defer to later phases:
- **PWA / installable** -- valuable but not blocking for launch. Add after core works.
- **Multiple saved locations** -- "nice to have" once single location works well
- **Walk time indicator** -- differentiator, but requires distance calculation UX
- **Compact/dashboard mode** -- once responsive design is solid, optimize for specific form factors via CSS toggle

## API Capability Notes

The SL Transport API (`transport.integration.sl.se/v1`) provides:

- **`/sites`** -- All ~6500 stops with id, name, lat, lon. No server-side text search; returns full list. Must be cached client-side for search/proximity.
- **`/sites/{id}/departures`** -- Real-time departures with scheduled, expected, display, line info, deviations. No API key required.
- **Transport modes available:** BUS, TRAIN (pendeltag), METRO, TRAM, SHIP, FERRY
- **No geocoding endpoint** -- Need external geocoding (Nominatim is free, no key) to convert addresses to lat/lon for proximity search.
- **No nearby-stops endpoint** -- Must calculate proximity client-side from the full sites list.

### Address-to-stops flow:
1. User types address
2. Geocode address to lat/lon (Nominatim or similar)
3. Filter cached sites list by Haversine distance
4. Show nearest stops within radius
5. User selects stops
6. Fetch departures for selected site IDs

## Sources

- SL Transport API (verified via live API calls to `transport.integration.sl.se/v1/sites` and `/departures`)
- Existing app codebase analysis (index.html, ipad.html, nest.html)
- Trafiklab API documentation overview (trafiklab.se)
- Domain knowledge: SL-appen, Res i Sthlm, Citymapper, Google Maps transit features (MEDIUM confidence -- from training data, not live verification)

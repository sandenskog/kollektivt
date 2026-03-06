# Phase 1: Search and Stop Selection - Research

**Researched:** 2026-03-06
**Domain:** Geocoding, SL Transport API, client-side search, localStorage persistence
**Confidence:** HIGH

## Summary

Phase 1 delivers address-based and geolocation-based stop discovery with selection and persistence. The core technical challenge is integrating two external APIs (Nominatim for geocoding, SL Transport API for stop data) in a pure frontend app with no backend.

Key finding: Nominatim explicitly prohibits autocomplete-style usage (rapid keystroke queries). The solution is debounced search (300ms+) that fires on user pause, not on every keystroke. SL's `/v1/sites` endpoint returns all 6,497 stops with coordinates (~1.3MB) and requires no API key. The recommended architecture loads all sites once on app startup, caches them in memory, and filters nearby stops client-side using Haversine distance -- eliminating the need for repeated API calls during stop search.

**Primary recommendation:** Use Vite + React + TypeScript. Load SL sites once at startup, geocode with Nominatim on debounced search, compute nearby stops client-side with Haversine formula.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Autocomplete as-you-type with debounce (~300ms) against Nominatim
- Results appear in a dropdown below the input field
- "Use my location" button next to the search field -- triggers browser geolocation API
- Geolocation result feeds into the same nearby-stops flow as address search
- Search field stays visible at the top of the app at all times
- After address/geolocation resolves, show nearby stops from SL's stop lookup API
- Each stop shows: name, distance (e.g. "350m"), and transport mode icons (bus/train/metro/tram)
- Sort by distance, closest first
- Show up to 10 stops within ~1km radius
- If no stops found within radius, show a friendly message
- Tap/click a stop to select it (toggle) -- visual highlight on selected stops
- Selected stops appear in a separate "My stops" section above the search results
- Deselecting from "My stops" removes it
- All selections saved to localStorage immediately on change
- localStorage schema includes a version field for future migrations
- First visit: show search field prominently with instruction text
- After selecting stops: "My stops" section at top, search below
- Returning user with saved stops: show "My stops" immediately

### Claude's Discretion
- Project scaffolding choices (framework, build tools, folder structure)
- Nominatim vs SL's own place lookup -- whichever works best for Swedish addresses
- Exact component structure and state management approach
- Loading states and micro-interactions during search
- How to handle Nominatim rate limiting

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SRCH-01 | User can type an address and get autocomplete suggestions | Nominatim `/search` with debounce. Works well for Swedish addresses (verified). CORS open. |
| SRCH-02 | User can see nearby stops based on entered address (~1km) | SL `/v1/sites` (6,497 stops with lat/lon). Haversine distance calculation client-side. |
| SRCH-03 | User can use browser geolocation as alternative to typing | `navigator.geolocation.getCurrentPosition()` feeds coordinates into same nearby-stops flow. |
| SRCH-04 | User can select/deselect stops to monitor | React state with toggle logic. Visual highlight on selected items. |
| SRCH-05 | Selected stops persist across sessions (localStorage) | Versioned localStorage schema. Immediate save on state change. |
| INFR-01 | Pure frontend -- no backend server required | Both APIs have CORS `*`. Vite builds to static files. No server needed. |
| INFR-03 | localStorage schema includes version for future migrations | Versioned schema pattern with migration function. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.x | UI framework | De facto standard for component-based SPAs |
| TypeScript | 5.x | Type safety | Catches API shape issues at compile time |
| Vite | 6.x | Build tool | Fast dev server, zero-config React+TS template |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | Phase 1 needs no additional libraries |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React | Vanilla JS/HTML | Existing codebase is vanilla, but React simplifies state management for selections, search, and persistence. Worth the setup cost. |
| React | Preact | Smaller bundle, but React 19 is standard and difference negligible for this app size. |
| Zustand/Redux | React useState + useReducer | For Phase 1 scope, built-in React state is sufficient. Reconsider if Phase 2 creates complex state. |

**Installation:**
```bash
npm create vite@latest kollektivt -- --template react-ts
cd kollektivt
npm install
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/        # React components
│   ├── SearchBar.tsx       # Address input + autocomplete dropdown + location button
│   ├── StopList.tsx        # Nearby stops results list
│   ├── StopItem.tsx        # Single stop row (name, distance, transport icons, select toggle)
│   ├── MyStops.tsx         # Selected stops section
│   └── TransportIcon.tsx   # Bus/train/metro/tram icon component
├── hooks/             # Custom React hooks
│   ├── useNominatim.ts     # Debounced Nominatim search
│   ├── useGeolocation.ts   # Browser geolocation wrapper
│   ├── useNearbyStops.ts   # Client-side stop distance filtering
│   └── usePersistedStops.ts # localStorage read/write with versioning
├── services/          # API and data layer
│   ├── nominatim.ts        # Nominatim API client
│   ├── sl-sites.ts         # SL sites loader + cache
│   └── distance.ts         # Haversine formula
├── types/             # TypeScript interfaces
│   └── index.ts            # Site, Stop, PersistedData types
├── App.tsx            # Main app component
└── main.tsx           # Entry point
```

### Pattern 1: Load-Once Sites Cache
**What:** Fetch all 6,497 SL sites on app startup, store in memory, reuse for all searches.
**When to use:** Always -- this is the core data strategy.
**Example:**
```typescript
// services/sl-sites.ts
interface SLSite {
  id: number;
  name: string;
  lat: number;
  lon: number;
  stop_areas?: number[];
}

let sitesCache: SLSite[] | null = null;

export async function loadSites(): Promise<SLSite[]> {
  if (sitesCache) return sitesCache;
  const res = await fetch('https://transport.integration.sl.se/v1/sites?expand=true');
  if (!res.ok) throw new Error(`SL API error: ${res.status}`);
  sitesCache = await res.json();
  return sitesCache!;
}
```

### Pattern 2: Debounced Nominatim Search
**What:** Search fires after user stops typing for 300ms. Not true autocomplete (Nominatim forbids it), but debounced search that feels similar.
**When to use:** On address input change.
**Example:**
```typescript
// hooks/useNominatim.ts
import { useState, useEffect, useRef } from 'react';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function useNominatim(query: string, debounceMs = 300) {
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController>();

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);

      try {
        const params = new URLSearchParams({
          q: query,
          format: 'jsonv2',
          countrycodes: 'se',
          limit: '5',
          'accept-language': 'sv',
        });
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          {
            signal: controller.signal,
            headers: { 'User-Agent': 'Kollektivt/1.0 (kollektivt.sandenskog.se)' },
          }
        );
        const data = await res.json();
        setResults(data);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  return { results, loading };
}
```

### Pattern 3: Haversine Distance Calculation
**What:** Calculate distance between two lat/lon points.
**When to use:** To find and sort nearby stops.
**Example:**
```typescript
// services/distance.ts
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearbyStops(
  lat: number, lon: number,
  sites: SLSite[],
  maxDistance = 1000,
  maxResults = 10
): (SLSite & { distance: number })[] {
  return sites
    .map(site => ({
      ...site,
      distance: haversineDistance(lat, lon, site.lat, site.lon),
    }))
    .filter(s => s.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults);
}
```

### Pattern 4: Versioned localStorage
**What:** Schema with version field for future migrations.
**When to use:** All localStorage reads/writes.
**Example:**
```typescript
// hooks/usePersistedStops.ts
const STORAGE_KEY = 'kollektivt_data';
const SCHEMA_VERSION = 1;

interface PersistedData {
  version: number;
  selectedStops: SelectedStop[];
}

interface SelectedStop {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

function migrate(data: any): PersistedData {
  // Future: add migration logic per version
  if (!data || !data.version) {
    return { version: SCHEMA_VERSION, selectedStops: [] };
  }
  return data as PersistedData;
}

export function loadPersistedData(): PersistedData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: SCHEMA_VERSION, selectedStops: [] };
    return migrate(JSON.parse(raw));
  } catch {
    return { version: SCHEMA_VERSION, selectedStops: [] };
  }
}

export function savePersistedData(data: PersistedData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
```

### Anti-Patterns to Avoid
- **Calling SL API per search:** Don't fetch `/v1/sites` on every address search. Load once, filter in memory.
- **True autocomplete against Nominatim:** Nominatim's usage policy explicitly forbids autocomplete-style usage. Use debounced search (300ms+) instead.
- **Storing full site data in localStorage:** Only persist the user's selected stop IDs and metadata, not the full sites list.
- **Not aborting in-flight requests:** Always abort previous Nominatim requests when a new search fires.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Distance calculation | Custom spherical math | Haversine formula (small function) | Haversine is 8 lines, proven, accurate enough for <10km distances |
| Debounce | Manual setTimeout management | Custom hook with cleanup | React's useEffect cleanup pattern handles this cleanly |
| Geocoding | Google Maps API | Nominatim (OSM) | Free, no API key, CORS open, works well for Swedish addresses |
| Stop data | Scraping or paid API | SL Transport `/v1/sites` | Free, no API key, CORS `*`, 6,497 stops with coordinates |

**Key insight:** Both external APIs (Nominatim and SL Transport) are free, require no API keys, and have permissive CORS policies. No backend proxy is needed.

## Common Pitfalls

### Pitfall 1: Nominatim Rate Limiting
**What goes wrong:** Sending too many requests to Nominatim (>1/second) gets your IP blocked.
**Why it happens:** Treating Nominatim like Google Places with instant autocomplete.
**How to avoid:** Debounce at 300ms minimum, abort in-flight requests, require minimum 3 characters before searching.
**Warning signs:** 429 responses or connection timeouts from Nominatim.

### Pitfall 2: Missing User-Agent Header for Nominatim
**What goes wrong:** Nominatim requires a valid User-Agent or HTTP Referer header.
**Why it happens:** Default fetch() sends generic User-Agent.
**How to avoid:** Always include `User-Agent: 'Kollektivt/1.0 (kollektivt.sandenskog.se)'` in Nominatim requests.
**Warning signs:** 403 or rate limiting responses.

### Pitfall 3: SL Sites Data Size
**What goes wrong:** ~1.3MB JSON response on first load feels slow on mobile.
**Why it happens:** 6,497 sites with metadata is a lot of JSON.
**How to avoid:** Show a loading indicator during initial load. Consider caching in sessionStorage for same-session revisits. The expanded version (with stop_areas for transport mode detection) is ~1.6MB.
**Warning signs:** Blank screen for 1-2 seconds on first visit on slow connections.

### Pitfall 4: Geolocation Permission UX
**What goes wrong:** User denies geolocation, app shows nothing.
**Why it happens:** No fallback for denied permissions.
**How to avoid:** Always show the address search as primary. "Use my location" is a convenience shortcut. Handle denied/unavailable geolocation gracefully with a clear message.
**Warning signs:** `GeolocationPositionError` with code 1 (PERMISSION_DENIED).

### Pitfall 5: Transport Mode Icons Without Departure Data
**What goes wrong:** Can't show transport mode icons for stops without calling the departures API.
**Why it happens:** The `/v1/sites` endpoint doesn't include transport modes. Transport modes are on stop_areas (via stop-points), not sites.
**How to avoid:** Two options: (a) Load the expanded sites (with `stop_areas` IDs), cross-reference with stop_area types pre-built at build time; or (b) infer from context -- most stops are bus stops, only show specific icons when known. Recommended: build a static JSON mapping of `stop_area_id -> type` at build time from `/v1/stop-points`, bundle it (~140KB), and look up transport modes client-side.
**Warning signs:** All stops showing generic icons.

## Code Examples

### Browser Geolocation Hook
```typescript
// hooks/useGeolocation.ts
import { useState, useCallback } from 'react';

interface GeoState {
  lat: number | null;
  lon: number | null;
  loading: boolean;
  error: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    lat: null, lon: null, loading: false, error: null,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState(s => ({ ...s, error: 'Geolocation is not supported' }));
      return;
    }

    setState(s => ({ ...s, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          loading: false,
          error: null,
        });
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Location access was denied',
          2: 'Position unavailable',
          3: 'Request timed out',
        };
        setState(s => ({
          ...s,
          loading: false,
          error: messages[err.code] || 'Unknown error',
        }));
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  return { ...state, requestLocation };
}
```

### Transport Mode Type Mapping
```typescript
// Map SL stop_area types to transport modes
const STOP_AREA_TYPE_TO_MODE: Record<string, string> = {
  BUSTERM: 'bus',
  METROSTN: 'metro',
  TRAMSTN: 'tram',
  RAILWSTN: 'train',
  SHIPBER: 'ship',
  FERRYBER: 'ferry',
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SL Stop Lookup API (required API key) | SL Transport `/v1/sites` (no key) | 2023+ | No API key needed, simpler integration |
| SL Nearby Stops API | Client-side Haversine from `/v1/sites` | June 2025 (deprecated) | Nearby Stops API has no replacement. Must compute client-side. |
| Create React App | Vite | 2023+ | CRA is deprecated, Vite is the standard |
| Google Maps Geocoding | Nominatim (OSM) | Ongoing | Free, no API key, good Swedish address data |

**Deprecated/outdated:**
- SL Nearby Stops API: No replacement after June 2025 shutdown. Client-side distance calculation is the path forward.
- SL Stop Lookup API: Being replaced by Journey Planner v2. The Transport API `/v1/sites` endpoint is the modern alternative for getting stop data.

## Open Questions

1. **Transport mode icons for stops**
   - What we know: Stop area types (BUSTERM, METROSTN, etc.) map to transport modes. The mapping requires cross-referencing sites' `stop_areas` with stop-point data.
   - What's unclear: Whether to bundle a static mapping file or compute it at runtime by loading stop-points data (8MB, too large for client).
   - Recommendation: Build a static JSON mapping at build time (e.g., via a build script). ~140KB bundled. Alternatively, start without transport icons and add them when departure data is available in Phase 2.

2. **Nominatim Swedish address quality**
   - What we know: Tested "vegagatan stockholm" -- returned correct results with lat/lon. countrycodes=se filters well.
   - What's unclear: Edge cases with apartment addresses, suburb-only queries, or misspellings.
   - Recommendation: Use `countrycodes=se` and `accept-language=sv`. Minimum 3 characters before searching. This is flagged in STATE.md as needing Phase 1 validation.

## Sources

### Primary (HIGH confidence)
- SL Transport API `/v1/sites` -- verified live: 6,497 sites with lat/lon, CORS `*`, no auth
- SL Transport API `/v1/sites?expand=true` -- verified live: includes stop_area IDs (~1.6MB)
- SL Transport API `/v1/stop-points` -- verified live: 14,159 stop-points with stop_area types (BUSTERM, METROSTN, etc.)
- Nominatim Search API -- verified live: works for Swedish addresses with `countrycodes=se`
- [Nominatim API docs](https://nominatim.org/release-docs/latest/api/Search/) -- parameters, format, limits
- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/) -- max 1 req/sec, no autocomplete, requires User-Agent

### Secondary (MEDIUM confidence)
- [SL Transport API docs on Trafiklab](https://www.trafiklab.se/api/our-apis/sl/transport/) -- endpoint listing, no-key-required policy
- [Trafiklab Stop Lookup](https://www.trafiklab.se/api/our-apis/trafiklab-realtime-apis/stop-lookup/) -- requires API key, alternative to Transport API

### Tertiary (LOW confidence)
- SL API CORS policy stability -- currently `*` but could change (flagged in STATE.md)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - React+Vite+TS is well-established, verified with current docs
- Architecture: HIGH - API responses verified live, data sizes measured, patterns proven
- Pitfalls: HIGH - Rate limiting and data size issues verified through direct API testing

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable APIs, 30-day window)

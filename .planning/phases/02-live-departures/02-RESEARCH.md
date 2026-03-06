# Phase 2: Live Departures - Research

**Researched:** 2026-03-06
**Domain:** SL Transport API real-time departures, React polling patterns, client-side filtering
**Confidence:** HIGH

## Summary

Phase 2 adds real-time departure display for the user's selected stops. The SL Transport API provides a well-structured JSON endpoint at `transport.integration.sl.se/v1/sites/{siteId}/departures` that returns all needed data: scheduled/expected times, delay info, cancellation state, disruption messages, line details with transport mode, and direction codes. No API key is required.

The API supports server-side filtering via query parameters (`transport`, `direction`, `line`, `forecast`), but for this phase client-side filtering is more practical since we need all data for display and let users toggle filters. The main technical challenges are: (1) polling multiple stops efficiently with a 30-second interval, (2) local countdown ticking between API fetches, and (3) persisting filter preferences by extending the existing localStorage schema.

**Primary recommendation:** Build a `useDepartures` hook that polls the API per stop, a departure service module following the `sl-sites.ts` pattern, and extend `PersistedData` with filter preferences. Client-side filtering with direction_code and line.id from the API response.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Grouped by stop -- each selected stop gets its own section with header
- Within each stop, departures sorted by time (nearest first)
- Show next 5 departures per stop
- Each departure row shows: countdown ("3 min") + absolute time ("14:23") + transport mode icon + line number + destination
- Delay: scheduled time shown with strikethrough, expected time beside it, plus a "+X min" indicator
- Cancelled departures shown with strikethrough and "Cancelled" label (not hidden)
- Departures that have already passed are hidden (removed at next refresh cycle)
- Disruption messages shown as warning banner at top of each stop section (not inline per departure)
- Auto-refresh every 30 seconds, silent (no visible timer or indicator)
- Manual refresh button available (discrete refresh icon)
- Countdown times tick down locally every minute between API fetches
- On API error: keep showing last successfully fetched data, show discrete "Could not update" message, continue retrying
- All directions and lines shown by default (filter is opt-in to narrow down)
- Filter preferences persist in localStorage (extend existing PersistedData schema)

### Claude's Discretion
- Exact filtering UI pattern (chips, dropdown, toggles)
- Transport mode icon implementation (emoji, SVG icons, or text badges)
- Loading state while fetching initial departures
- Exact layout spacing and visual hierarchy (design is "for placement only" until Phase 3)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEPT-01 | User sees real-time departures from selected stops, grouped by stop | API endpoint verified: `/v1/sites/{siteId}/departures` returns departures with all needed fields |
| DEPT-02 | Delays shown clearly (scheduled vs expected time, status badge) | API provides `scheduled`, `expected` (ISO timestamps), and `state` (EXPECTED/ATSTOP/CANCELLED) |
| DEPT-03 | Disruption/deviation messages displayed per departure | API provides `deviations` array per departure AND `stop_deviations` at top level |
| DEPT-04 | Departures auto-refresh every 30 seconds | Standard React `useEffect` + `setInterval` polling pattern |
| DEPT-05 | Transport mode indicated visually (bus, train, metro, tram) | API field `line.transport_mode`: BUS, METRO, TRAIN, TRAM |
| DEPT-06 | Both countdown ("3 min") and absolute time ("14:23") shown | API provides `display` field (e.g. "Nu", "3 min", "14:23") + `scheduled`/`expected` timestamps for computation |
| FILT-01 | User can filter departures by direction per stop | API field `direction_code` (1 or 2) + `direction` (text label) enables client-side filtering |
| FILT-02 | User can filter departures by specific lines per stop | API field `line.id` + `line.designation` enables client-side filtering |
| FILT-03 | Filter preferences persist in localStorage | Extend existing `PersistedData` schema with filter map keyed by stop ID |

</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.0 | UI framework | Already in project |
| TypeScript | ~5.9.3 | Type safety | Already in project |
| Vite | ^7.3.1 | Build/dev | Already in project |
| Vitest | ^4.0.18 | Testing | Already in project |

### Supporting
No additional libraries needed. This phase uses only the browser `fetch` API (already used in sl-sites.ts), `setInterval` for polling, and `Date` for time calculations.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual polling with setInterval | React Query / TanStack Query | Overkill for 1-5 stops; adds dependency for simple polling |
| Plain CSS | CSS Modules | Project already uses plain App.css; keep consistent |
| SVG icon library | Text emoji for transport modes | Emoji is simpler for "placement only" design phase; can upgrade later |

## Architecture Patterns

### Recommended Project Structure
```
src/
  services/
    sl-departures.ts        # API fetch function for departures
  hooks/
    useDepartures.ts         # Polling hook, manages state per stop
    usePersistedStops.ts     # Extended with filter preferences
  components/
    DepartureList.tsx         # Container for all stop sections
    StopDepartures.tsx        # Single stop section (header + banner + rows)
    DepartureRow.tsx          # Single departure row
    DepartureFilters.tsx      # Filter UI per stop (direction + line chips)
  types/
    index.ts                  # Extended with departure types
```

### Pattern 1: Departure Service (sl-departures.ts)
**What:** A service module that fetches departures for a given site ID, matching the existing sl-sites.ts pattern.
**When to use:** Called by the useDepartures hook on interval.
**Example:**
```typescript
// Source: Verified against live API (transport.integration.sl.se)
export interface Departure {
  destination: string;
  direction_code: number;
  direction: string;
  state: 'EXPECTED' | 'ATSTOP' | 'CANCELLED';
  display: string;
  scheduled: string; // ISO 8601
  expected: string;  // ISO 8601
  journey: { id: number; state: string; prediction_state: string };
  stop_area: { id: number; name: string; type: string };
  stop_point: { id: number; name: string; designation: string };
  line: {
    id: number;
    designation: string;
    transport_mode: 'BUS' | 'METRO' | 'TRAIN' | 'TRAM';
    group_of_lines: string;
  };
  deviations: Array<{
    importance_level: number;
    consequence: string;
    message: string;
  }>;
}

export interface StopDeviation {
  id: number;
  importance_level: number;
  message: string;
  scope: {
    stop_areas: Array<{ id: number; name: string }>;
    lines: Array<{ id: number; designation: string; transport_mode: string }>;
  };
}

export interface DepartureResponse {
  departures: Departure[];
  stop_deviations: StopDeviation[];
}

export async function fetchDepartures(siteId: number): Promise<DepartureResponse> {
  const res = await fetch(
    `https://transport.integration.sl.se/v1/sites/${siteId}/departures?forecast=60`
  );
  if (!res.ok) throw new Error(`SL API error: ${res.status}`);
  return res.json();
}
```

### Pattern 2: Polling Hook (useDepartures)
**What:** Custom hook that fetches departures for all selected stops, polls every 30s, handles errors gracefully.
**When to use:** Called from App.tsx, drives the entire departure display.
**Example:**
```typescript
// Key design points:
// 1. One fetch per selected stop (parallel with Promise.allSettled)
// 2. Keep last successful data on error (stale-while-revalidate)
// 3. Local countdown ticking via separate 1-minute interval
// 4. Manual refresh resets the polling timer

function useDepartures(stops: SelectedStop[]) {
  const [departuresByStop, setDeparturesByStop] = useState<Map<number, DepartureResponse>>(new Map());
  const [errors, setErrors] = useState<Map<number, boolean>>(new Map());
  const [loading, setLoading] = useState(true);

  // Fetch all stops in parallel
  const fetchAll = useCallback(async () => {
    const results = await Promise.allSettled(
      stops.map(s => fetchDepartures(s.id))
    );
    // Merge results, keeping old data for failed fetches
    // ...
  }, [stops]);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30_000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  return { departuresByStop, errors, loading, refresh: fetchAll };
}
```

### Pattern 3: Filter Persistence Schema Extension
**What:** Extend PersistedData with filter preferences keyed by stop ID.
**When to use:** When user changes direction or line filters.
**Example:**
```typescript
// Bump SCHEMA_VERSION to 2
export interface StopFilters {
  directions?: number[];  // direction_codes to show (empty = all)
  lines?: number[];       // line IDs to show (empty = all)
}

export interface PersistedData {
  version: number;
  selectedStops: SelectedStop[];
  filters?: Record<number, StopFilters>;  // keyed by stop ID
}
```

### Pattern 4: Local Countdown Ticking
**What:** Between API fetches, decrement displayed countdown times every 60 seconds so "3 min" becomes "2 min" without waiting for API.
**When to use:** Runs as a separate interval alongside the 30s polling.
**Example:**
```typescript
// Compute countdown from expected/scheduled time vs current time
function getCountdown(departure: Departure): string {
  const now = new Date();
  const expected = new Date(departure.expected);
  const diffMs = expected.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin <= 0) return 'Now';
  if (diffMin < 60) return `${diffMin} min`;
  return expected.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}
// Re-render every 60s by updating a tick counter
```

### Anti-Patterns to Avoid
- **Fetching departures inside each StopDepartures component:** Creates uncoordinated fetches, harder to manage loading/error states. Fetch centrally in a hook.
- **Storing computed countdown in state:** Countdowns should be computed from timestamps at render time (driven by a tick counter), not stored as strings.
- **Using the API `display` field directly for countdown:** It only updates on API fetch. Compute locally from `expected` timestamp for live ticking.
- **Filtering server-side with API params:** We need all departures to populate filter options (available directions/lines). Filter client-side.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time formatting | Custom date parser | `Date` constructor + `toLocaleTimeString('sv-SE')` | ISO 8601 strings from API parse directly with `new Date()` |
| Delay calculation | Manual string math | `(new Date(expected) - new Date(scheduled)) / 60000` | Simple arithmetic on Date objects |
| Polling lifecycle | Custom event system | `useEffect` + `setInterval` + cleanup | Standard React pattern, well-understood |

## Common Pitfalls

### Pitfall 1: Stale Closures in Polling
**What goes wrong:** The `fetchAll` callback captures stale `stops` array, so adding/removing stops doesn't affect polling.
**Why it happens:** `useEffect` + `setInterval` closes over initial values.
**How to avoid:** Use `useCallback` with `stops` dependency; clear and restart interval when stops change.
**Warning signs:** Departures don't appear for newly added stops until page refresh.

### Pitfall 2: API Timestamps Without Timezone
**What goes wrong:** SL API returns timestamps like `"2026-03-06T14:23:12"` without timezone suffix. Parsing with `new Date()` may interpret as UTC in some browsers.
**Why it happens:** ISO 8601 without `Z` or offset is ambiguous per spec.
**How to avoid:** Append `+01:00` (CET) or use string parsing to extract hours/minutes directly. Test in multiple browsers.
**Warning signs:** Countdown shows wrong minutes, off by 1 or 2 hours.

### Pitfall 3: Race Conditions on Rapid Stop Changes
**What goes wrong:** User adds/removes stops quickly; old fetch results overwrite newer ones.
**Why it happens:** Parallel async calls resolve in unpredictable order.
**How to avoid:** Use an AbortController per fetch cycle; abort previous when new cycle starts. Or use a request counter and discard stale results.
**Warning signs:** Departures flicker or show data for removed stops.

### Pitfall 4: Memory Leak from Uncleared Intervals
**What goes wrong:** Component unmount doesn't clear polling interval.
**Why it happens:** Missing cleanup in useEffect return.
**How to avoid:** Always return `() => clearInterval(id)` from the polling useEffect.
**Warning signs:** Console warnings about state updates on unmounted components.

### Pitfall 5: Filter Preferences for Removed Stops
**What goes wrong:** Stale filter entries accumulate in localStorage for stops the user no longer monitors.
**Why it happens:** Filters persist independently of selectedStops array.
**How to avoid:** Clean up filter entries when a stop is removed from selectedStops. Or lazily ignore filters for stops not in the current selection.
**Warning signs:** localStorage grows unboundedly.

## Code Examples

### API Response Structure (verified live 2026-03-06)
```typescript
// Source: Live API call to transport.integration.sl.se/v1/sites/1002/departures
// Top-level response:
{
  departures: Departure[],     // Array of departure objects
  stop_deviations: StopDeviation[]  // Stop-level disruption messages
}

// Each departure:
{
  destination: "Skarpnack",
  direction_code: 2,          // 1 or 2, identifies direction
  direction: "Skarpnack",     // Human-readable direction label
  state: "CANCELLED",         // "EXPECTED" | "ATSTOP" | "CANCELLED"
  display: "14:20",           // SL's own display string
  scheduled: "2026-03-06T14:20:12",  // Note: no timezone suffix
  expected: "2026-03-06T14:20:12",
  line: {
    id: 17,
    designation: "17",
    transport_mode: "METRO",   // "BUS" | "METRO" | "TRAIN" | "TRAM"
    group_of_lines: "Tunnelbanans grona linje"
  },
  deviations: [
    { importance_level: 7, consequence: "CANCELLED", message: "Installd" }
  ],
  stop_area: { id: 1051, name: "T-Centralen", type: "METROSTN" },
  stop_point: { id: 1052, name: "T-Centralen", designation: "4" }
}

// stop_deviations entries have message + scope with affected stop_areas and lines
```

### Transport Mode Icons (Recommendation: Text Badges)
```typescript
// Simple, no dependencies, suitable for "placement only" design phase
const TRANSPORT_ICONS: Record<string, string> = {
  METRO: 'T',     // T-bana
  BUS: 'B',       // Buss
  TRAIN: 'J',     // Jarnvag / pendeltag
  TRAM: 'S',      // Sparvag
};
// Render as a small colored badge: <span className="mode-badge mode-metro">T</span>
// Can be upgraded to SVG icons in Phase 3 (design polish)
```

### Filter UI (Recommendation: Toggle Chips)
```typescript
// Chips pattern: compact, touch-friendly, clear active state
// Direction filter: show 2 chips (one per direction_code) with direction text
// Line filter: show chips for each unique line.designation at this stop
// Active chip = included in filter, inactive = excluded
// Default: all chips active (show everything)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SL Departures v4 API (required API key) | SL Transport API v1 (no key needed) | March 2024 | Simpler integration, no key management |
| SL Stop Lookup API site IDs | Transport API site IDs (different format) | March 2024 | Our app already uses Transport API IDs from Phase 1 -- no conversion needed |

**Deprecated/outdated:**
- SL Departures v4: Replaced by Transport API. Do not use.
- SL Stops and lines v2: Replaced by Transport API `/sites` endpoint. Already using the new one.

## Open Questions

1. **Timezone handling for API timestamps**
   - What we know: API returns timestamps without timezone suffix (e.g., `"2026-03-06T14:23:12"`)
   - What's unclear: Whether all browsers consistently interpret this as local time (CET/CEST)
   - Recommendation: Parse hours/minutes as strings from the timestamp rather than relying on `new Date()` interpretation. Or append Swedish timezone offset before parsing. Test in Chrome and Safari.

2. **Rate limiting behavior**
   - What we know: API docs say "do not make excessive requests." No specific rate limit documented.
   - What's unclear: Exact threshold; whether 1-5 stops every 30s triggers any limiting
   - Recommendation: 30s interval for 1-5 stops (max 10 req/min) is very conservative. Add exponential backoff on repeated errors as a safety measure.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | Inline in vite.config.ts (uses Vite config) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEPT-01 | Departures fetched and grouped by stop | unit | `npx vitest run src/services/sl-departures.test.ts` | No - Wave 0 |
| DEPT-02 | Delay computation (scheduled vs expected) | unit | `npx vitest run src/services/sl-departures.test.ts` | No - Wave 0 |
| DEPT-03 | Disruption messages extracted from API response | unit | `npx vitest run src/services/sl-departures.test.ts` | No - Wave 0 |
| DEPT-04 | Auto-refresh every 30s | unit | `npx vitest run src/hooks/useDepartures.test.ts` | No - Wave 0 |
| DEPT-05 | Transport mode badge rendering | unit | `npx vitest run src/components/DepartureRow.test.ts` | No - Wave 0 |
| DEPT-06 | Countdown + absolute time display | unit | `npx vitest run src/services/sl-departures.test.ts` | No - Wave 0 |
| FILT-01 | Direction filter works | unit | `npx vitest run src/hooks/useDepartures.test.ts` | No - Wave 0 |
| FILT-02 | Line filter works | unit | `npx vitest run src/hooks/useDepartures.test.ts` | No - Wave 0 |
| FILT-03 | Filter preferences persist in localStorage | unit | `npx vitest run src/hooks/usePersistedStops.test.ts` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/services/sl-departures.test.ts` -- departure service unit tests with mocked fetch
- [ ] `src/hooks/useDepartures.test.ts` -- polling hook tests (if hook testing is in scope)
- [ ] Test setup for `fetch` mocking (global fetch mock or vi.fn pattern)

## Sources

### Primary (HIGH confidence)
- Live API testing: `transport.integration.sl.se/v1/sites/1002/departures` - verified response structure, query params, field names, data types (2026-03-06)
- [Trafiklab SL Transport docs](https://www.trafiklab.se/api/our-apis/sl/transport/) - endpoint documentation, no API key requirement

### Secondary (MEDIUM confidence)
- [Trafiklab API migration announcement](https://www.trafiklab.se/news/2024/2024-03-04-sl-api-update/) - confirmed v4 deprecation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, existing project stack
- Architecture: HIGH - verified API structure against live endpoint, standard React patterns
- Pitfalls: HIGH - timezone issue confirmed by inspecting live API responses; polling patterns are well-documented React territory

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (API is stable, no key required)

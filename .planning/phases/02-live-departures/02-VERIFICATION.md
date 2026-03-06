---
phase: 02-live-departures
verified: 2026-03-06T15:20:00Z
status: passed
score: 12/12 must-haves verified
gaps: []
human_verification:
  - test: "Verify live departure display renders correctly in browser"
    expected: "Departures grouped by stop, countdown ticking, delay indicators, filter chips working"
    why_human: "Visual rendering and real-time behavior cannot be verified programmatically"
---

# Phase 02: Live Departures Verification Report

**Phase Goal:** Live departure display with auto-refresh and filtering for selected stops
**Verified:** 2026-03-06T15:20:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

**Plan 02-01 (Data Layer):**

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | fetchDepartures returns departures with line, direction, scheduled/expected times, state, and deviations | VERIFIED | `src/services/sl-departures.ts` L3-13: fetches correct URL, returns typed `DepartureResponse`. Types in `src/types/index.ts` L39-84 define all fields. 11 tests pass. |
| 2 | useDepartures polls every 30 seconds and keeps last successful data on error | VERIFIED | `src/hooks/useDepartures.ts` L6: `POLL_INTERVAL = 30_000`, L61-65: setInterval with cleanup. L35: on rejection, previous data kept (stale-while-revalidate). |
| 3 | Countdown is computed locally from expected timestamp, not from API display field | VERIFIED | `src/services/sl-departures.ts` L30-40: `getCountdown` uses `parseHHMM(departure.expected)` and compares with `new Date()` -- never references `departure.display`. |
| 4 | PersistedData schema extended to v2 with filters field | VERIFIED | `src/hooks/usePersistedStops.ts` L5: `SCHEMA_VERSION = 2`, L17: migration adds `filters: {}`. `src/types/index.ts` L90: `filters?: Record<number, StopFilters>`. |

**Plan 02-02 (UI Components):**

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 5 | User sees departures grouped by stop with stop name as header | VERIFIED | `DepartureList.tsx` iterates stops, renders `StopDepartures` per stop. `StopDepartures.tsx` L60: `<h3>{stop.name}</h3>` as header. |
| 6 | Each departure row shows countdown + absolute time + transport mode icon + line number + destination | VERIFIED | `DepartureRow.tsx` L39-61: renders mode-badge, line-designation, destination, countdown, absolute-time in flex row. |
| 7 | Delayed departures show scheduled time with strikethrough and expected time with +X min indicator | VERIFIED | `DepartureRow.tsx` L50-54: when `delayMinutes > 0`, renders `<s className="scheduled-time">`, `<span className="delay-indicator">+{delayMinutes} min</span>`. |
| 8 | Cancelled departures show strikethrough and Cancelled label | VERIFIED | `DepartureRow.tsx` L38: `cancelled` CSS class on row, L42: `<s>{departure.destination}</s>`, L46: `<span className="cancelled-label">Cancelled</span>`. |
| 9 | Disruption messages appear as warning banner at top of each stop section | VERIFIED | `StopDepartures.tsx` L14-30: `collectDeviationMessages` gathers stop-level and departure-level deviations. L72-82: renders `<div className="disruption-banner">`. |
| 10 | Departures auto-refresh every 30s silently; manual refresh button available | VERIFIED | Polling in `useDepartures.ts` L61-65. Manual refresh: `DepartureList.tsx` L31: refresh button calls `refresh` prop. App.tsx L52: passes `refresh` from hook. |
| 11 | User can filter by direction and line per stop using toggle chips | VERIFIED | `DepartureFilters.tsx` L27-62: toggleDirection/toggleLine logic. `StopDepartures.tsx` L32-43: `applyFilters` filters by direction_code and line.id. |
| 12 | Filter preferences persist across page reloads | VERIFIED | `usePersistedStops.ts` L68-77: `setFilters` calls `saveToStorage` which writes to localStorage. L79-83: `getFilters` reads from persisted data. App.tsx L19: uses `filters` and `setFilters`. |

**Score:** 12/12 truths verified

### Required Artifacts

**Plan 02-01 Artifacts:**

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/types/index.ts` | Departure, StopDeviation, DepartureResponse, StopFilters types | VERIFIED | All 4 interfaces defined (L39-91). PersistedData extended with filters field. |
| `src/services/sl-departures.ts` | fetchDepartures, getCountdown, getAbsoluteTime, getDelayMinutes | VERIFIED | All 4 functions exported. 61 lines of substantive code. |
| `src/services/sl-departures.test.ts` | Unit tests for departure service | VERIFIED | 11 tests across 4 describe blocks. Covers fetch, countdown, absolute time, delay. |
| `src/hooks/useDepartures.ts` | Polling hook with departuresByStop, errors, loading, refresh, tick | VERIFIED | 76 lines. Returns all 5 values. Promise.allSettled, stale-while-revalidate, tick counter. |
| `src/hooks/usePersistedStops.ts` | Extended with filters support and schema migration to v2 | VERIFIED | SCHEMA_VERSION=2, v1->v2 migration, setFilters/getFilters callbacks, filter cleanup on stop removal. |

**Plan 02-02 Artifacts:**

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/components/DepartureList.tsx` | Container iterating stops, rendering StopDepartures | VERIFIED | 48 lines. Maps stops, renders StopDepartures with correct props. Refresh button. |
| `src/components/StopDepartures.tsx` | Stop section with header, disruption banner, filters, departure rows | VERIFIED | 105 lines. All states handled (loading, error, stale data, disruptions). Filters + sort + slice(0,5). |
| `src/components/DepartureRow.tsx` | Departure row with countdown, mode badge, delay/cancel indicators | VERIFIED | 63 lines. Mode badges (T/B/J/S), delay strikethrough, cancel label, past departure hiding. |
| `src/components/DepartureFilters.tsx` | Direction and line filter toggle chips | VERIFIED | 102 lines. Toggle logic with all-active default. Only renders if 2+ options. |
| `src/App.tsx` | Wired with useDepartures and DepartureList | VERIFIED | Imports both, destructures hook, passes all props to DepartureList. Loading indicator. |
| `src/App.css` | Placement styling for departure components | VERIFIED | All expected CSS classes present: departure-list, stop-departures, departure-row, mode-badge (4 colors), delay-indicator, disruption-banner, filter-chip, refresh-btn, update-error, cancelled. |

### Key Link Verification

**Plan 02-01 Key Links:**

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `useDepartures.ts` | `sl-departures.ts` | import fetchDepartures | WIRED | L3: `import { fetchDepartures } from '../services/sl-departures'` + L27: called in fetchAll |
| `useDepartures.ts` | `types/index.ts` | import DepartureResponse | WIRED | L2: `import type { SelectedStop, DepartureResponse } from '../types'` + L9: used in state type |
| `usePersistedStops.ts` | `types/index.ts` | import StopFilters, PersistedData | WIRED | L2: `import type { SelectedStop, PersistedData, StopFilters } from '../types'` |

**Plan 02-02 Key Links:**

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `App.tsx` | `useDepartures.ts` | useDepartures(selectedStops) | WIRED | L5: import, L25: `useDepartures(selectedStops)` destructured |
| `App.tsx` | `DepartureList.tsx` | renders DepartureList with departuresByStop | WIRED | L9: import, L47-55: renders with all props |
| `StopDepartures.tsx` | `sl-departures.ts` | imports getCountdown | WIRED (indirect) | StopDepartures renders DepartureRow, which imports getCountdown/getAbsoluteTime/getDelayMinutes (DepartureRow.tsx L2) |
| `DepartureFilters.tsx` | `usePersistedStops.ts` | setFilters callback prop | WIRED | DepartureFilters receives `onFiltersChange` prop. App.tsx L52: `onFiltersChange={(stopId, f) => setFilters(stopId, f)}` chains through DepartureList -> StopDepartures -> DepartureFilters. |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-----------|-------------|--------|----------|
| DEPT-01 | 02-01, 02-02 | User sees real-time departures from selected stops, grouped by stop | SATISFIED | fetchDepartures + useDepartures polling + DepartureList/StopDepartures rendering |
| DEPT-02 | 02-01, 02-02 | Delays shown clearly (scheduled vs expected time, status badge) | SATISFIED | getDelayMinutes + DepartureRow delay indicator with strikethrough |
| DEPT-03 | 02-01, 02-02 | Disruption/deviation messages displayed per departure | SATISFIED | StopDeviation type + collectDeviationMessages + disruption-banner rendering |
| DEPT-04 | 02-01, 02-02 | Departures auto-refresh every 30 seconds | SATISFIED | POLL_INTERVAL=30_000, setInterval in useDepartures |
| DEPT-05 | 02-01, 02-02 | Transport mode indicated visually | SATISFIED | mode-badge with T/B/J/S labels, CSS colors per mode |
| DEPT-06 | 02-01, 02-02 | Both countdown and absolute time shown | SATISFIED | getCountdown + getAbsoluteTime, both rendered in DepartureRow |
| FILT-01 | 02-02 | User can filter departures by direction per stop | SATISFIED | DepartureFilters toggleDirection + applyFilters direction_code check |
| FILT-02 | 02-02 | User can filter departures by specific lines per stop | SATISFIED | DepartureFilters toggleLine + applyFilters line.id check |
| FILT-03 | 02-02 | Filter preferences persist in localStorage | SATISFIED | usePersistedStops setFilters -> saveToStorage -> localStorage |

No orphaned requirements found. All 9 requirement IDs from REQUIREMENTS.md Phase 2 are covered by plan frontmatter.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| -- | -- | No anti-patterns found | -- | -- |

No TODO/FIXME/placeholder comments. No empty implementations. All `return null` instances are legitimate conditional renders (empty stops list, no deviation messages, past departures, single-option filters).

### Human Verification Required

### 1. Live Departure Display Flow

**Test:** Run `npm run dev`, search for an address, select stops, observe departure display
**Expected:** Departures appear grouped by stop with countdown, mode badges, line numbers, destinations
**Why human:** Visual rendering and real-time data from SL API cannot be verified programmatically

### 2. Auto-Refresh Behavior

**Test:** Watch departure display for 30+ seconds
**Expected:** Countdown values update silently without page flicker or loading indicators
**Why human:** Real-time polling behavior requires observation over time

### 3. Delay and Cancellation Display

**Test:** Find a delayed or cancelled departure (depends on real-time SL data)
**Expected:** Delayed: strikethrough scheduled time + red "+X min". Cancelled: strikethrough destination + "Cancelled" label
**Why human:** Depends on real-time conditions, visual formatting verification

### 4. Filter Chip Interaction

**Test:** At a stop with multiple directions/lines, tap filter chips
**Expected:** Chips toggle, departures filter immediately, reload preserves filter state
**Why human:** Interactive UI behavior and localStorage persistence verification

### Gaps Summary

No gaps found. All 12 observable truths verified across both plans. All 11 artifacts exist, are substantive (no stubs), and are fully wired. All 9 requirement IDs (DEPT-01 through DEPT-06, FILT-01 through FILT-03) are satisfied with implementation evidence. All 16 tests pass. TypeScript compiles without errors.

The phase goal "Live departure display with auto-refresh and filtering for selected stops" is achieved at the code level. Human verification recommended for visual and real-time behavior confirmation, but this was already done as part of Plan 02-02 Task 3 (human-verify checkpoint marked as approved in the SUMMARY).

---

_Verified: 2026-03-06T15:20:00Z_
_Verifier: Claude (gsd-verifier)_

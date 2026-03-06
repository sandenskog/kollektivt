---
phase: 02-live-departures
plan: 01
subsystem: api
tags: [sl-transport, react-hooks, polling, typescript, vitest]

requires:
  - phase: 01-search-and-selection
    provides: SLSite types, SelectedStop, PersistedData schema, usePersistedStops hook
provides:
  - Departure, StopDeviation, DepartureResponse, StopFilters types
  - fetchDepartures service with getCountdown, getAbsoluteTime, getDelayMinutes helpers
  - useDepartures polling hook with stale-while-revalidate error handling
  - usePersistedStops extended with filter persistence and v1->v2 schema migration
affects: [02-live-departures]

tech-stack:
  added: []
  patterns: [string-based timestamp parsing, Promise.allSettled parallel fetching, tick-counter re-render pattern]

key-files:
  created:
    - src/services/sl-departures.ts
    - src/services/sl-departures.test.ts
    - src/hooks/useDepartures.ts
  modified:
    - src/types/index.ts
    - src/hooks/usePersistedStops.ts

key-decisions:
  - "String-based HH:MM parsing for API timestamps to avoid timezone ambiguity across browsers"
  - "Tick counter pattern (60s interval) for countdown re-renders instead of storing computed countdowns"

patterns-established:
  - "Timestamp parsing: parseHHMM extracts hours/minutes as strings from timezone-less ISO timestamps"
  - "Polling: useEffect + setInterval with useCallback dependency for automatic restart on input change"
  - "Schema migration: version bump with additive migration in migrate() function"

requirements-completed: [DEPT-01, DEPT-02, DEPT-03, DEPT-04, DEPT-05, DEPT-06]

duration: 2min
completed: 2026-03-06
---

# Phase 02 Plan 01: Departure Data Layer Summary

**Departure types, fetch service with string-based countdown, 30s polling hook, and filter persistence with schema v2 migration**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-06T13:45:34Z
- **Completed:** 2026-03-06T13:47:50Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Full departure type definitions matching verified SL Transport API response shape
- Fetch service with timezone-safe countdown, absolute time, and delay computation
- 11 unit tests covering all service functions
- Polling hook with Promise.allSettled, stale-while-revalidate, and tick-based countdown refresh
- Schema migration v1->v2 with per-stop filter persistence

## Task Commits

Each task was committed atomically:

1. **Task 1: Define departure types and build service with tests** - `7371293` (feat)
2. **Task 2: Build polling hook and extend persistence** - `e118879` (feat)

## Files Created/Modified
- `src/types/index.ts` - Added Departure, StopDeviation, DepartureResponse, StopFilters types; extended PersistedData with filters
- `src/services/sl-departures.ts` - fetchDepartures, getCountdown, getAbsoluteTime, getDelayMinutes
- `src/services/sl-departures.test.ts` - 11 unit tests for departure service
- `src/hooks/useDepartures.ts` - Polling hook with parallel fetch, error tracking, tick counter
- `src/hooks/usePersistedStops.ts` - Schema v2 migration, filter get/set/cleanup

## Decisions Made
- String-based HH:MM parsing for API timestamps to avoid browser timezone ambiguity (parseHHMM helper)
- Tick counter pattern for countdown re-renders: separate 60s setInterval increments a counter, forcing React re-render so getCountdown recomputes at render time

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All data contracts and logic ready for UI components (Plan 02)
- Types, service, and hooks can be imported directly by DepartureList, StopDepartures, DepartureRow components
- Filter persistence ready for DepartureFilters component

---
*Phase: 02-live-departures*
*Completed: 2026-03-06*

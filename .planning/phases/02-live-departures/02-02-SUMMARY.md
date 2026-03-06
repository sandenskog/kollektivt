---
phase: 02-live-departures
plan: 02
subsystem: ui
tags: [react, components, departure-display, filtering, css, localStorage]

requires:
  - phase: 02-live-departures
    provides: Departure types, fetchDepartures service, useDepartures hook, usePersistedStops filter persistence
provides:
  - DepartureList, StopDepartures, DepartureRow, DepartureFilters components
  - App.tsx wired with live departure display and filtering
  - Placement CSS for all departure UI elements
affects: [03-design-and-deploy]

tech-stack:
  added: []
  patterns: [bottom-up component composition, toggle-chip filter UX, tick-driven countdown refresh]

key-files:
  created:
    - src/components/DepartureRow.tsx
    - src/components/DepartureFilters.tsx
    - src/components/StopDepartures.tsx
    - src/components/DepartureList.tsx
  modified:
    - src/App.tsx
    - src/App.css

key-decisions:
  - "Bottom-up component build order: Row -> Filters -> StopDepartures -> List"
  - "Single-letter transport mode badges (T/B/J/S) matching SL convention"
  - "Filter chips default all-active; toggling one off excludes it rather than selecting only it"

patterns-established:
  - "Component composition: DepartureList -> StopDepartures -> DepartureRow/DepartureFilters"
  - "Filter toggle: undefined/empty = show all, array with values = show only those"
  - "Departure display: max 5 per stop, sorted by expected time, past departures hidden"

requirements-completed: [DEPT-01, DEPT-02, DEPT-03, DEPT-04, DEPT-05, DEPT-06, FILT-01, FILT-02, FILT-03]

duration: 21min
completed: 2026-03-06
---

# Phase 02 Plan 02: Departure UI Components Summary

**Four departure components with countdown display, delay/cancel indicators, disruption banners, direction/line filter chips, and 30s auto-refresh wired into App**

## Performance

- **Duration:** 21 min
- **Started:** 2026-03-06T13:50:18Z
- **Completed:** 2026-03-06T14:11:18Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Complete departure display with countdown, absolute time, transport mode badges, and line/destination info
- Delay indicators (strikethrough scheduled time + red "+X min") and cancellation labels
- Disruption banners collecting both stop-level and departure-level deviation messages
- Direction and line filter chips with localStorage persistence via usePersistedStops
- App.tsx wired with useDepartures hook rendering departures below My Stops

## Task Commits

Each task was committed atomically:

1. **Task 1: Build departure UI components** - `ba18fa8` (feat)
2. **Task 2: Wire into App.tsx and add placement CSS** - `e46ab05` (feat)
3. **Task 3: Verify complete departure display** - human-verify checkpoint (approved)

Additional commit during verification:
- **Search address shortening** - `1ac71f8` (fix)

## Files Created/Modified
- `src/components/DepartureRow.tsx` - Single departure row with countdown, mode badge, delay/cancel display
- `src/components/DepartureFilters.tsx` - Direction and line toggle chip filters
- `src/components/StopDepartures.tsx` - Stop section with header, disruption banner, filters, departure rows
- `src/components/DepartureList.tsx` - Container rendering StopDepartures per selected stop with refresh button
- `src/App.tsx` - Wired useDepartures hook and DepartureList component
- `src/App.css` - Placement CSS for all departure components including SL transport mode colors

## Decisions Made
- Bottom-up component build order (Row first, List last) for clean dependency flow
- Single-letter transport mode badges matching SL convention: T (tunnelbana), B (buss), J (pendeltag), S (sparvagn)
- Filter chips default to all-active; toggling excludes rather than selects, resetting to undefined when all re-selected
- Max 5 departures per stop sorted by expected time to keep display compact
- Past departures hidden except ATSTOP state which shows "Now"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 2 complete: search, stop selection, and live departures all functional
- Ready for Phase 3: design polish and deployment
- All components use placement CSS ready for final styling

---
*Phase: 02-live-departures*
*Completed: 2026-03-06*

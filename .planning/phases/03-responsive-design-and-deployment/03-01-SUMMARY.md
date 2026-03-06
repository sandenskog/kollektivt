---
phase: 03-responsive-design-and-deployment
plan: 01
subsystem: ui
tags: [responsive, css, dashboard-mode, error-boundary, localStorage, react]

# Dependency graph
requires:
  - phase: 02-live-departures
    provides: DepartureList, StopDepartures, DepartureRow components
provides:
  - Responsive CSS layout (320px/768px/1024px breakpoints)
  - useDashboardMode hook with localStorage persistence
  - ErrorBoundary component with recovery UI
  - Per-stop error retry buttons
  - 44px touch targets for mobile
affects: [deployment, future-ui-polish]

# Tech tracking
tech-stack:
  added: [jsdom, "@testing-library/react", "@testing-library/jest-dom"]
  patterns: [mobile-first-css, dashboard-mode-class-toggle, error-boundary-pattern]

key-files:
  created:
    - src/hooks/useDashboardMode.ts
    - src/hooks/useDashboardMode.test.ts
    - src/components/ErrorBoundary.tsx
    - src/components/ErrorBoundary.test.tsx
    - vitest.config.ts
  modified:
    - src/index.css
    - src/App.css
    - src/App.tsx
    - src/components/StopDepartures.tsx
    - src/components/DepartureList.tsx
    - vite.config.ts

key-decisions:
  - "Separate vitest.config.ts for test environment (jsdom) to avoid TS errors in vite.config.ts"
  - "localStorage mock in tests due to jsdom limited localStorage in vitest 4"
  - "Mobile-first CSS approach: default styles for 320px+, breakpoints at 768px and 1024px"

patterns-established:
  - "Dashboard mode: CSS class toggle on root .app div hides/shows sections"
  - "Error boundary: class component wrapping all app content for crash recovery"
  - "Touch targets: minimum 44px on interactive elements for mobile"

requirements-completed: [DSGN-01, DSGN-02, DSGN-03]

# Metrics
duration: 5min
completed: 2026-03-06
---

# Phase 3 Plan 1: Responsive Design and Error Handling Summary

**Responsive mobile-first layout with dashboard compact mode, ErrorBoundary crash recovery, and per-stop retry buttons**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-06T14:38:37Z
- **Completed:** 2026-03-06T14:43:22Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Responsive CSS with mobile/tablet/desktop breakpoints and 44px touch targets
- Dashboard mode toggle that hides search UI and compacts departure display, persisted via localStorage
- ErrorBoundary component wrapping all app content for crash recovery
- Per-stop error retry buttons in StopDepartures component
- Light-mode-only index.css (removed Vite dark mode template)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useDashboardMode hook, ErrorBoundary component, and fix index.css** - `262bd71` (feat)
2. **Task 2: Add responsive CSS, dashboard mode styles, error retry buttons, and wire App.tsx** - `fe1f2a8` (feat)

## Files Created/Modified
- `src/hooks/useDashboardMode.ts` - Dashboard mode hook with localStorage persistence
- `src/hooks/useDashboardMode.test.ts` - 3 tests for hook behavior
- `src/components/ErrorBoundary.tsx` - React error boundary with try-again button
- `src/components/ErrorBoundary.test.tsx` - 3 tests for error boundary
- `vitest.config.ts` - Separate vitest config with jsdom environment
- `src/index.css` - Light-mode-only reset, removed dark mode
- `src/App.css` - Responsive breakpoints, dashboard mode, touch targets, retry button styles
- `src/App.tsx` - Dashboard toggle, ErrorBoundary wrapper, app header
- `src/components/StopDepartures.tsx` - Added refresh prop and retry button
- `src/components/DepartureList.tsx` - Passes refresh prop through to StopDepartures
- `vite.config.ts` - Removed test config (moved to vitest.config.ts)

## Decisions Made
- Separated vitest.config.ts from vite.config.ts to avoid TypeScript errors with test property
- Used custom localStorage mock in tests since jsdom in vitest 4 has limited localStorage API
- Mobile-first CSS: default 100% width, then constrained at 768px (600px) and 1024px (800px)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed jsdom and testing-library dependencies**
- **Found during:** Task 1 (TDD setup)
- **Issue:** Project had no DOM test environment or component test utilities
- **Fix:** Installed jsdom, @testing-library/react, @testing-library/jest-dom
- **Files modified:** package.json, package-lock.json
- **Verification:** All component and hook tests pass
- **Committed in:** 262bd71 (Task 1 commit)

**2. [Rule 3 - Blocking] Created separate vitest.config.ts**
- **Found during:** Task 2 (build verification)
- **Issue:** Adding `test` property to vite.config.ts caused TypeScript error
- **Fix:** Created vitest.config.ts with jsdom environment config
- **Files modified:** vite.config.ts, vitest.config.ts (new)
- **Verification:** Build and tests both pass
- **Committed in:** fe1f2a8 (Task 2 commit)

**3. [Rule 1 - Bug] Fixed ErrorBoundary test for React 19 concurrent rendering**
- **Found during:** Task 2 (test verification)
- **Issue:** React 19 re-throws caught errors as unhandled during concurrent rendering
- **Fix:** Added window error event handler to suppress expected errors in test
- **Files modified:** src/components/ErrorBoundary.test.tsx
- **Verification:** All tests pass with no unhandled errors
- **Committed in:** fe1f2a8 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All auto-fixes necessary for test infrastructure and correctness. No scope creep.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Responsive layout complete, ready for deployment plan
- Dashboard mode functional for wall-mounted tablet use case
- All 22 tests passing, build succeeds

---
*Phase: 03-responsive-design-and-deployment*
*Completed: 2026-03-06*

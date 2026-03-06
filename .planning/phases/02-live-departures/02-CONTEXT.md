# Phase 2: Live Departures - Context

**Gathered:** 2026-03-06
**Status:** Ready for planning

<domain>
## Phase Boundary

Real-time departure display from user's selected stops, with delay indicators, disruption messages, auto-refresh, and filtering by direction and line. This phase adds the core departure viewing experience on top of Phase 1's stop selection.

</domain>

<decisions>
## Implementation Decisions

### Departure grouping and layout
- Grouped by stop — each selected stop gets its own section with header
- Within each stop, departures sorted by time (nearest first)
- Show next 5 departures per stop
- Each departure row shows: countdown ("3 min") + absolute time ("14:23") + transport mode icon + line number + destination

### Delay presentation
- Inline on the departure row: scheduled time shown with strikethrough, expected time beside it, plus a "+X min" indicator
- Cancelled departures shown with strikethrough and "Cancelled" label (not hidden)
- Departures that have already passed are hidden (removed at next refresh cycle)

### Disruption messages
- Shown as a warning banner at the top of each stop section
- Banner contains disruption/deviation text for lines serving that stop
- Not inline per departure — kept at stop level for cleanliness

### Refresh behavior
- Auto-refresh every 30 seconds, silent (no visible timer or indicator)
- Manual refresh button available (discrete refresh icon)
- Countdown times tick down locally every minute between API fetches (so "3 min" becomes "2 min" without waiting for API)
- On API error: keep showing last successfully fetched data, show a discrete "Could not update" message, continue retrying in background

### Filtering (direction & lines)
- Claude's Discretion: UI pattern for direction and line filtering per stop (chips, dropdown, or expandable section)
- All directions and lines shown by default (filter is opt-in to narrow down)
- Filter preferences persist in localStorage (extend existing PersistedData schema)

### Claude's Discretion
- Exact filtering UI pattern (chips, dropdown, toggles)
- Transport mode icon implementation (emoji, SVG icons, or text badges)
- Loading state while fetching initial departures
- Exact layout spacing and visual hierarchy (design is "for placement only" until Phase 3)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `usePersistedStops` hook: Manages localStorage with versioned schema — extend PersistedData to include filter preferences
- `SelectedStop` type: Has id, name, lat, lon — use stop.id to fetch departures from SL Transport API
- `MyStops` component: Currently shows selected stops as removable chips — departure sections render below/alongside these
- `sl-sites.ts` service: Already fetches from SL Transport API — pattern reusable for departure endpoint

### Established Patterns
- Prop-drilling for state (no React context) — keep for departure data flow
- Plain CSS in App.css — continue for Phase 2 styling
- Vitest for testing — use for departure service/hook tests
- Module-level caching in services — applicable for departure data if needed

### Integration Points
- `App.tsx` orchestrates flow — add departure display below stop selection
- `selectedStops` array from `usePersistedStops` drives which stops to fetch departures for
- SL Transport API base: `transport.integration.sl.se/v1` — departures endpoint uses site ID

</code_context>

<specifics>
## Specific Ideas

No specific references — open to standard approaches. The existing preview mockup style (countdown + icon + line + destination + clock time) was confirmed as the desired information density.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-live-departures*
*Context gathered: 2026-03-06*

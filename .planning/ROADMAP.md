# Roadmap: Kollektivt

## Overview

Kollektivt omvandlas från en hardkodad avgångssida till en konfigurerbar realtidsapp i tre faser: (1) bygg datalager och sökfunktion sa att anvandare kan hitta och valja hallplatser, (2) visa realtidsavgangar med filtrering, (3) responsiv design och deployment. Varje fas levererar en komplett, verifierbar kapabilitet.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Search and Stop Selection** - Project scaffolding, data layer, address search, and stop selection with persistence
- [ ] **Phase 2: Live Departures** - Real-time departure display with auto-refresh, delays, disruptions, and filtering
- [ ] **Phase 3: Responsive Design and Deployment** - Responsive layout, dashboard mode, error states, and production deployment

## Phase Details

### Phase 1: Search and Stop Selection
**Goal**: Users can find nearby stops by address or geolocation, select which to monitor, and have their choices remembered
**Depends on**: Nothing (first phase)
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04, SRCH-05, INFR-01, INFR-03
**Success Criteria** (what must be TRUE):
  1. User can type an address and see autocomplete suggestions from Nominatim
  2. User can see a list of nearby stops sorted by distance after entering an address
  3. User can tap "Use my location" and get nearby stops without typing
  4. User can select and deselect stops, and selections survive a page reload
  5. App runs entirely in the browser with no backend server
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md — Scaffold Vite+React+TS project, define types, build data layer (services + hooks)
- [ ] 01-02-PLAN.md — Build UI components (SearchBar, StopList, StopItem, MyStops), wire App.tsx, verify flow

### Phase 2: Live Departures
**Goal**: Users see real-time departures from their selected stops with delay info, disruptions, and can filter by direction and line
**Depends on**: Phase 1
**Requirements**: DEPT-01, DEPT-02, DEPT-03, DEPT-04, DEPT-05, DEPT-06, FILT-01, FILT-02, FILT-03
**Success Criteria** (what must be TRUE):
  1. User sees departures grouped by stop, with transport mode icons, countdown and absolute time
  2. Delayed departures show both scheduled and expected time with a visible status indicator
  3. Active disruptions and deviation messages appear alongside affected departures
  4. Departures update automatically without user interaction (every 30s)
  5. User can filter departures by direction and by specific lines, and filter choices persist across sessions
**Plans**: 2 plans

Plans:
- [ ] 02-01-PLAN.md — Define departure types, build API service with tests, polling hook, extend localStorage schema
- [ ] 02-02-PLAN.md — Build departure UI components (DepartureList, StopDepartures, DepartureRow, DepartureFilters), wire App.tsx, verify flow

### Phase 3: Responsive Design and Deployment
**Goal**: The app works well on all screen sizes from mobile to desktop, includes a dashboard mode, and is live on kollektivt.sandenskog.se
**Depends on**: Phase 2
**Requirements**: DSGN-01, DSGN-02, DSGN-03, INFR-02
**Success Criteria** (what must be TRUE):
  1. App is usable on a 320px mobile screen, a tablet, and a desktop browser without horizontal scrolling or broken layout
  2. Dashboard/compact mode toggle works for always-on displays (e.g. wall-mounted tablet)
  3. Loading states, API errors, and network failures show clear messages with retry buttons
  4. App is live and accessible at kollektivt.sandenskog.se
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Search and Stop Selection | 2/2 | Complete | 2026-03-06 |
| 2. Live Departures | 0/2 | Not started | - |
| 3. Responsive Design and Deployment | 0/2 | Not started | - |

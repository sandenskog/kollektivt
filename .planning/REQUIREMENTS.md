# Requirements: Kollektivt

**Defined:** 2026-03-06
**Core Value:** Användaren ska snabbt kunna se nästa avgång från sina valda hållplatser — utan konfigurationskrångel, utan inloggning, utan fördröjning.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Search

- [x] **SRCH-01**: User can type an address and get autocomplete suggestions
- [x] **SRCH-02**: User can see nearby stops based on entered address (within ~1km radius)
- [x] **SRCH-03**: User can use browser geolocation as alternative to typing address
- [x] **SRCH-04**: User can select/deselect stops to monitor
- [x] **SRCH-05**: User's selected stops and address persist across sessions (localStorage)

### Departures

- [x] **DEPT-01**: User sees real-time departures from selected stops, grouped by stop
- [x] **DEPT-02**: Delays shown clearly (scheduled vs expected time, status badge)
- [x] **DEPT-03**: Disruption/deviation messages displayed per departure
- [x] **DEPT-04**: Departures auto-refresh every 30 seconds
- [x] **DEPT-05**: Transport mode indicated visually (bus, train, metro, tram icons/badges)
- [x] **DEPT-06**: Both countdown ("3 min") and absolute time ("14:23") shown

### Filtering

- [x] **FILT-01**: User can filter departures by direction per stop
- [x] **FILT-02**: User can filter departures by specific lines per stop
- [x] **FILT-03**: Filter preferences persist in localStorage

### Design

- [ ] **DSGN-01**: Responsive layout works on mobile, tablet, and desktop
- [ ] **DSGN-02**: Compact/dashboard mode toggle for always-on displays
- [ ] **DSGN-03**: Clear loading and error states with retry capability

### Infrastructure

- [x] **INFR-01**: Pure frontend — no backend server required
- [ ] **INFR-02**: Hosted on kollektivt.sandenskog.se via Synology Docker
- [x] **INFR-03**: localStorage schema includes version for future migrations

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Features

- **ENHC-01**: Multiple saved locations ("Home", "Work", "Gym") with quick-switch UI
- **ENHC-02**: Walk time indicator ("Leave in 3 min" based on distance to stop)
- **ENHC-03**: PWA support (installable, offline shell, service worker)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Trip planner / routing | SL:s app and Google Maps already do this well |
| User accounts / login | localStorage sufficient, no cross-device sync needed |
| Map view | Heavy dependencies, distracts from core list-based UX |
| Push notifications | Requires backend, ongoing server costs |
| Ticket purchasing | Different domain, SL handles this |
| Multi-city support | Scoped to SL's API only |
| Separate device-specific pages | One responsive design replaces ipad.html/nest.html |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SRCH-01 | Phase 1 | Complete |
| SRCH-02 | Phase 1 | Complete |
| SRCH-03 | Phase 1 | Complete |
| SRCH-04 | Phase 1 | Complete |
| SRCH-05 | Phase 1 | Complete |
| DEPT-01 | Phase 2 | Complete |
| DEPT-02 | Phase 2 | Complete |
| DEPT-03 | Phase 2 | Complete |
| DEPT-04 | Phase 2 | Complete |
| DEPT-05 | Phase 2 | Complete |
| DEPT-06 | Phase 2 | Complete |
| FILT-01 | Phase 2 | Complete |
| FILT-02 | Phase 2 | Complete |
| FILT-03 | Phase 2 | Complete |
| DSGN-01 | Phase 3 | Pending |
| DSGN-02 | Phase 3 | Pending |
| DSGN-03 | Phase 3 | Pending |
| INFR-01 | Phase 1 | Complete |
| INFR-02 | Phase 3 | Pending |
| INFR-03 | Phase 1 | Complete |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-03-06*
*Last updated: 2026-03-06 after roadmap creation*

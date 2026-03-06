---
phase: 2
slug: live-departures
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | Inline in vite.config.ts |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 0 | DEPT-01 | unit | `npx vitest run src/services/sl-departures.test.ts` | No - W0 | pending |
| 02-01-02 | 01 | 0 | DEPT-02 | unit | `npx vitest run src/services/sl-departures.test.ts` | No - W0 | pending |
| 02-01-03 | 01 | 0 | DEPT-03 | unit | `npx vitest run src/services/sl-departures.test.ts` | No - W0 | pending |
| 02-01-04 | 01 | 0 | DEPT-04 | unit | `npx vitest run src/hooks/useDepartures.test.ts` | No - W0 | pending |
| 02-01-05 | 01 | 0 | DEPT-05 | unit | `npx vitest run src/components/DepartureRow.test.ts` | No - W0 | pending |
| 02-01-06 | 01 | 0 | DEPT-06 | unit | `npx vitest run src/services/sl-departures.test.ts` | No - W0 | pending |
| 02-02-01 | 02 | 0 | FILT-01 | unit | `npx vitest run src/hooks/useDepartures.test.ts` | No - W0 | pending |
| 02-02-02 | 02 | 0 | FILT-02 | unit | `npx vitest run src/hooks/useDepartures.test.ts` | No - W0 | pending |
| 02-02-03 | 02 | 0 | FILT-03 | unit | `npx vitest run src/hooks/usePersistedStops.test.ts` | No - W0 | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [ ] `src/services/sl-departures.test.ts` — departure service unit tests with mocked fetch (DEPT-01, DEPT-02, DEPT-03, DEPT-06)
- [ ] `src/hooks/useDepartures.test.ts` — polling hook tests (DEPT-04, FILT-01, FILT-02)
- [ ] `src/hooks/usePersistedStops.test.ts` — filter persistence tests (FILT-03)
- [ ] `src/components/DepartureRow.test.ts` — transport mode badge rendering (DEPT-05)
- [ ] Test setup for `fetch` mocking (global fetch mock or vi.fn pattern)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual countdown ticking | DEPT-06 | Real-time UI behavior | Open app, observe countdown decrement every 60s |
| Disruption banner visibility | DEPT-03 | Visual layout verification | Wait for disrupted departure, verify banner position |
| Filter chips UX | FILT-01, FILT-02 | Interactive UI flow | Toggle direction/line chips, verify departures update |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

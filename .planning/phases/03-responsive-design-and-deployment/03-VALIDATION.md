---
phase: 3
slug: responsive-design-and-deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-06
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.0.18 |
| **Config file** | Inline in vite.config.ts |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 3-01-01 | 01 | 1 | DSGN-01 | manual-only | Visual inspection at 320px, 768px, 1024px | N/A | ⬜ pending |
| 3-01-02 | 01 | 1 | DSGN-01 | manual-only | Touch target size check | N/A | ⬜ pending |
| 3-02-01 | 02 | 1 | DSGN-02 | unit | `npx vitest run src/hooks/useDashboardMode.test.ts` | ❌ W0 | ⬜ pending |
| 3-02-02 | 02 | 1 | DSGN-03 | unit | `npx vitest run src/components/ErrorBoundary.test.tsx` | ❌ W0 | ⬜ pending |
| 3-03-01 | 03 | 2 | INFR-02 | smoke | `docker build -t kollektivt .` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/hooks/useDashboardMode.test.ts` — stubs for DSGN-02
- [ ] `src/components/ErrorBoundary.test.tsx` — stubs for DSGN-03

*Existing infrastructure covers DSGN-01 (manual visual) and INFR-02 (manual smoke test).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Responsive layout at 320px, 768px, 1024px | DSGN-01 | Visual layout verification | Open Chrome DevTools, toggle device toolbar, check each breakpoint for overflow/scroll |
| Touch targets ≥ 44x44px on mobile | DSGN-01 | Physical interaction | Inspect computed sizes in DevTools at 320px |
| Docker build + serve | INFR-02 | Infrastructure test | `docker build -t kollektivt . && docker run --rm -p 3300:80 kollektivt` then open localhost:3300 |
| App live at kollektivt.sandenskog.se | INFR-02 | DNS + reverse proxy | After deployment, access URL in browser |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending

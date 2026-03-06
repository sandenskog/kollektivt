# Phase 3: Responsive Design and Deployment - Research

**Researched:** 2026-03-06
**Domain:** CSS responsive design, React state management (dashboard mode), Docker deployment (Synology)
**Confidence:** HIGH

## Summary

Phase 3 covers four requirements: responsive layout (DSGN-01), dashboard/compact mode (DSGN-02), error/loading states (DSGN-03), and deployment (INFR-02). The existing codebase is a Vite + React 19 SPA with plain CSS (no CSS framework). The current layout uses a fixed `max-width: 600px` container which works for mobile but needs adaptation for tablet/desktop and a compact dashboard mode.

The deployment target is a Synology DS224+ NAS running Docker. The app is a static SPA (no backend), so nginx serves the built files. The CLAUDE.md global instructions provide exact deployment patterns including reverse proxy setup, SSL certificates, and Docker paths.

**Primary recommendation:** Use CSS media queries and CSS custom properties for responsive + dashboard mode. No CSS framework needed — the existing CSS is simple enough to extend. Deploy with multi-stage Docker build (node -> nginx) and docker-compose.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DSGN-01 | Responsive layout works on mobile, tablet, and desktop | CSS media queries at 768px and 1024px breakpoints; flexible grid for departure cards on wide screens |
| DSGN-02 | Compact/dashboard mode toggle for always-on displays | localStorage-persisted toggle; CSS class on root element; reduced padding, smaller fonts, hide search UI |
| DSGN-03 | Clear loading and error states with retry capability | Error boundary for crashes; per-stop retry buttons; network-offline detection; skeleton/spinner patterns |
| INFR-02 | Hosted on kollektivt.sandenskog.se via Synology Docker | Multi-stage Dockerfile (build + nginx); docker-compose.yml; reverse proxy + SSL via Synology CLI |
</phase_requirements>

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.0 | UI framework | Already in project |
| Vite | ^7.3.1 | Build tool | Already in project |
| TypeScript | ~5.9.3 | Type safety | Already in project |

### Supporting (new for this phase)
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| nginx (Docker) | alpine | Serve static SPA | Production container |
| docker-compose | 3.x | Container orchestration | Deployment to Synology |

### No New Dependencies Needed

The responsive design and dashboard mode can be implemented entirely with CSS media queries and a React state toggle. No CSS framework (Tailwind, etc.) is warranted — the existing CSS is ~340 lines and well-structured.

## Architecture Patterns

### Recommended Changes to Project Structure
```
src/
├── components/          # Existing — add ErrorBoundary
│   ├── ErrorBoundary.tsx    # NEW: catch React render crashes
│   └── ... (existing)
├── hooks/               # Existing — add useDashboardMode
│   ├── useDashboardMode.ts  # NEW: toggle + localStorage persist
│   └── ... (existing)
├── App.css              # MODIFY: add media queries, dashboard mode styles
├── index.css            # MODIFY: fix dark mode (force light), reset
└── ... (existing)

# Root level — deployment files
Dockerfile               # NEW
docker-compose.yml        # NEW
nginx.conf                # NEW: SPA routing config
.dockerignore             # NEW
```

### Pattern 1: Responsive Breakpoints
**What:** CSS media queries at standard breakpoints
**When to use:** All layout adjustments

```css
/* Mobile-first (default): 320px - 767px */
.app {
  max-width: 100%;
  padding: 12px;
}

/* Tablet: 768px+ */
@media (min-width: 768px) {
  .app {
    max-width: 600px;
    margin: 0 auto;
    padding: 16px;
  }
}

/* Desktop: 1024px+ */
@media (min-width: 1024px) {
  .app {
    max-width: 800px;
  }
}
```

### Pattern 2: Dashboard/Compact Mode via CSS Class
**What:** A `.dashboard-mode` class on the root element that CSS uses to switch styles
**When to use:** Wall-mounted tablets, always-on displays

```typescript
// useDashboardMode.ts
export function useDashboardMode() {
  const [dashboard, setDashboard] = useState(() => {
    return localStorage.getItem('kollektivt:dashboard') === 'true';
  });

  const toggle = useCallback(() => {
    setDashboard((prev) => {
      const next = !prev;
      localStorage.setItem('kollektivt:dashboard', String(next));
      return next;
    });
  }, []);

  return { dashboard, toggle };
}
```

```css
/* Dashboard mode overrides */
.app.dashboard-mode .search-bar,
.app.dashboard-mode .stop-list,
.app.dashboard-mode .my-stops,
.app.dashboard-mode .instruction-text {
  display: none;
}

.app.dashboard-mode .app-title {
  font-size: 1rem;
  margin-bottom: 8px;
}

.app.dashboard-mode .departure-row {
  padding: 0.15rem 0;
  font-size: 0.85rem;
}
```

### Pattern 3: Error States with Retry
**What:** Per-stop error display with retry button; global error boundary
**When to use:** API failures, network issues

```typescript
// In StopDepartures — enhance existing error display
{error && !response && (
  <div className="stop-error">
    <p>Could not load departures</p>
    <button onClick={refresh}>Retry</button>
  </div>
)}
```

### Pattern 4: Multi-stage Docker Build
**What:** Build in Node container, serve from nginx
**When to use:** Production deployment

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Anti-Patterns to Avoid
- **Adding a CSS framework for 3 breakpoints:** Tailwind/Bootstrap would add complexity for minimal gain in this small project
- **JavaScript-based responsive detection:** Use CSS media queries, not `window.innerWidth` listeners
- **Single global error state:** Errors are per-stop; keep the existing `Map<number, boolean>` pattern
- **Client-side routing for dashboard mode:** Use a toggle/state, not a separate route

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SPA routing in nginx | Custom server | nginx `try_files` | Standard pattern, one line |
| SSL certificates | Manual cert management | Synology `syno-letsencrypt` CLI | Auto-renewal built in |
| Reverse proxy | Manual nginx config | Synology `ReverseProxy.json` CLI | Integrates with DSM |

## Common Pitfalls

### Pitfall 1: Viewport Meta Tag Missing
**What goes wrong:** Mobile browsers zoom out to fit desktop layout
**Why it happens:** Missing or wrong viewport meta tag
**How to avoid:** Already present in index.html: `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`
**Status:** Already handled

### Pitfall 2: Dark Mode Override from Vite Template
**What goes wrong:** `index.css` has `color-scheme: light dark` and dark background (`#242424`)
**Why it happens:** Vite's default template includes dark mode support
**How to avoid:** Override to force light mode per project design guidelines ("minimalistisk, ljus design")
**Warning signs:** Dark background visible on page load

### Pitfall 3: Touch Target Sizes on Mobile
**What goes wrong:** Filter chips and buttons too small to tap accurately
**Why it happens:** Desktop-optimized sizing (current filter chips: `0.2rem 0.5rem` padding)
**How to avoid:** Minimum 44x44px touch targets on mobile; increase padding in mobile breakpoint

### Pitfall 4: Docker Build Without .dockerignore
**What goes wrong:** `node_modules` and `.git` copied into Docker context, slow builds
**Why it happens:** Missing `.dockerignore`
**How to avoid:** Create `.dockerignore` with `node_modules`, `.git`, `dist`, `**/@eaDir` (Synology metadata per CLAUDE.md)

### Pitfall 5: nginx SPA Routing
**What goes wrong:** Direct URL access or refresh returns 404
**Why it happens:** nginx serves files literally; no `index.html` fallback
**How to avoid:** `try_files $uri $uri/ /index.html;` in nginx config

### Pitfall 6: Synology Docker Path
**What goes wrong:** `docker` command not found on Synology
**Why it happens:** Docker binary not in default PATH
**How to avoid:** Use full path `/volume1/@appstore/ContainerManager/usr/bin/docker` or export PATH

## Code Examples

### nginx.conf for Vite SPA
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### docker-compose.yml
```yaml
version: "3"
services:
  kollektivt:
    build: .
    ports:
      - "3300:80"
    restart: unless-stopped
```

### .dockerignore
```
node_modules
dist
.git
.planning
**/@eaDir
*.md
```

### Deployment Commands (Synology)
```bash
# Build and transfer
cd /Users/richardsandenskog/Claude/kollektivt
tar czf - --exclude=node_modules --exclude=.git --exclude=dist . | \
  ssh sandenskog@192.168.86.33 "mkdir -p /volume1/docker/kollektivt && tar xzf - -C /volume1/docker/kollektivt"

# Build and start on NAS
ssh -tt sandenskog@192.168.86.33 "cd /volume1/docker/kollektivt && \
  export PATH=\$PATH:/volume1/@appstore/ContainerManager/usr/bin && \
  sudo docker compose up -d --build"

# Reverse proxy + SSL (one-time setup)
# See CLAUDE.md for ReverseProxy.json and syno-letsencrypt commands
```

### Error Boundary Component
```typescript
import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### Network Status Detection
```typescript
// Simple online/offline detection
function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return online;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate mobile/desktop pages | Responsive CSS | Long established | One codebase, all sizes |
| Float-based layouts | Flexbox/Grid | CSS3 era | Simpler, more predictable |
| jQuery mobile detection | CSS media queries | Years ago | No JS needed for layout |
| Manual Docker builds | Multi-stage Dockerfile | Docker 17+ | Smaller images, reproducible |

## Open Questions

1. **Port number for kollektivt**
   - What we know: Other apps use 3100, 3200, 5055. Need an unused port.
   - Recommendation: Use 3300 (next available in sequence after 3200)

2. **Dashboard mode: how much to hide?**
   - What we know: Should be compact for wall-mounted displays
   - Recommendation: Hide search bar and stop selection; show only departures with smaller typography. Keep refresh button and error states visible.

3. **index.css dark mode cleanup**
   - What we know: Vite template default has dark mode. Project guidelines say "ljus design".
   - Recommendation: Remove dark mode entirely from index.css, force white background.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.0.18 |
| Config file | Inline in vite.config.ts (no separate vitest.config) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements - Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DSGN-01 | Responsive layout renders without overflow | manual-only | Visual inspection at 320px, 768px, 1024px | N/A |
| DSGN-02 | Dashboard mode toggle persists and applies class | unit | `npx vitest run src/hooks/useDashboardMode.test.ts` | No - Wave 0 |
| DSGN-03 | Error states show retry button; ErrorBoundary catches crashes | unit | `npx vitest run src/components/ErrorBoundary.test.ts` | No - Wave 0 |
| INFR-02 | Docker build succeeds and serves app | smoke | `docker build -t kollektivt . && docker run --rm -p 3300:80 kollektivt` | No - manual |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green + manual visual check at 3 viewport widths + Docker build succeeds

### Wave 0 Gaps
- [ ] `src/hooks/useDashboardMode.test.ts` — covers DSGN-02
- [ ] `src/components/ErrorBoundary.test.tsx` — covers DSGN-03

## Sources

### Primary (HIGH confidence)
- Project codebase — direct inspection of App.tsx, App.css, index.css, package.json, hooks, components
- CLAUDE.md global instructions — Synology deployment patterns, design guidelines
- REQUIREMENTS.md — exact requirement definitions

### Secondary (MEDIUM confidence)
- CSS media queries, flexbox — well-established web standards, no version concerns
- Multi-stage Docker builds — standard Docker pattern, stable for years
- nginx SPA configuration — standard `try_files` pattern

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new dependencies, all CSS + existing React patterns
- Architecture: HIGH - straightforward responsive CSS + Docker static serve
- Pitfalls: HIGH - well-known issues (viewport, touch targets, nginx SPA routing, Synology paths)
- Deployment: HIGH - CLAUDE.md provides exact Synology deployment instructions

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable domain, no fast-moving dependencies)

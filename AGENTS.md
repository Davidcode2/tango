# AGENTS.md - Tango

## Overview
Tango is a modern alternative UI for the myTNG customer portal (TNG Technology Consulting).
It scrapes the Liferay-based portal server-side and re-renders the data in a clean, responsive interface.

## Tech Stack
- **Astro SSR** (Node adapter, standalone mode) — server-side rendering
- **Cheerio** — HTML parsing for Liferay portal pages
- **nginx** — reverse proxy for upstream myTNG, handles cookie forwarding
- **TypeScript** — type safety

## Architecture
```
Browser → Tango (Astro SSR) → nginx proxy → myTNG (Liferay Portal)
                ↓
         Cheerio parses HTML
                ↓
         Clean JSON → Astro components → User
```

## Pages
| Path | myTNG Source | Description |
|------|-------------|-------------|
| `/` | `/group/mytng/start` | Dashboard |
| `/dienste` | `/group/mytng/dienste` | Voice & data services |
| `/zugaenge` | `/group/mytng/zugaenge` | Login management |
| `/statistiken` | `/group/mytng/statistiken` | Call statistics |
| `/vertrag` | `/group/mytng/mein-vertrag/rechnungsarchiv` | Invoices |
| `/simkarten` | `/group/mytng/mein-vertrag/meine-simkarten` | SIM cards |

## Development
```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # outputs to ./dist/
```

## Deployment
- GitHub Actions builds Docker image → pushes to GHCR
- ArgoCD syncs manifests from app-of-apps repo
- Container runs Node (Astro SSR) on port 3000

## Key Files
- `src/lib/mytng.ts` — myTNG client (fetch + parse HTML with Cheerio)
- `src/lib/auth.ts` — session/cookie management
- `src/pages/*` — Astro SSR page routes
- `src/layouts/*` — shared layouts
- `nginx.conf` — production reverse proxy config
- `Dockerfile` — multi-stage build

## Notes
- myTNG is Liferay Portal 5.1.2 (2008) — server-rendered HTML, no JSON API
- Auth is cookie-based (JSESSIONID + Liferay cookies)
- No CORS headers on upstream — proxy required
- Scrapers are fragile by nature but the portal hasn't changed in ~18 years

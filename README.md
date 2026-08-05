# Tango

Modern alternative UI for the myTNG customer portal.

## Overview

Tango is a server-side rendered web app that scrapes myTNG (TNG Technology Consulting's
customer portal) and presents the data in a clean, responsive, modern interface.

Built with Astro SSR + Cheerio for HTML parsing.

## Development

```bash
npm install
npm run dev
```

Server starts on `http://localhost:3000`.

## Architecture

- **Astro SSR** (Node adapter, standalone mode)
- **Cheerio** for parsing Liferay portal HTML
- **nginx** reverse proxy for production (handles upstream cookie forwarding)
- Single container deployment

## Pages

| Path | myTNG Source | Description |
|------|-------------|-------------|
| `/` | `/group/mytng/start` | Dashboard / overview |
| `/dienste` | `/group/mytng/dienste` | Voice & data services |
| `/zugaenge` | `/group/mytng/zugaenge` | Login management |
| `/statistiken` | `/group/mytng/statistiken` | Call statistics |
| `/vertrag` | `/group/mytng/mein-vertrag/rechnungsarchiv` | Invoices & contract |
| `/simkarten` | `/group/mytng/mein-vertrag/meine-simkarten` | SIM card management |

## License

MIT

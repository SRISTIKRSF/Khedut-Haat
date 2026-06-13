# સૃષ્ટિ પ્રાકૃતિક ખેડૂત હાટ — Khedut Haat

Customer-facing apps for the weekly Sristi Praakrutik Khedut Haat farmers' market.

## Live URLs

| Audience | URL |
|---|---|
| 🛒 Customers | https://prakrutik-kheti-e9194.web.app/ |
| 🌾 Farmers (submit weekly produce) | https://prakrutik-kheti-e9194.web.app/submit |
| 🔧 Office admin (PIN-protected, not in this repo) | https://prakrutik-kheti-e9194.web.app/admin |

GitHub Pages mirror (this repo): https://krsf-work.github.io/Khedut-Haat/

## What's in this repo

- `sristi_haat_catalog_v1.html` — public catalog the customer sees
- `sristi_haat_submit_v1.html` — farmer submission form (mobile login)
- `hero.jpg` — hero image at top of catalog

The admin page, photo slicer, and one-time data seeder live only on Firebase Hosting (not pushed here for security reasons).

## Tech

- Single-file HTML apps (no build step)
- Firebase Realtime Database for data (`prakrutik-kheti-c0a89`)
- Firebase Hosting on `prakrutik-kheti-e9194`
- Gujarati UI throughout

# સૃષ્ટિ પ્રાકૃતિક ખેડૂત હાટ — Khedut Haat

Weekly farmers' market app suite for Sristi Praakrutik Khedut Haat. Three single-file HTML apps: customer catalogue, farmer submission form, and admin panel.

**Current version: V8.1** (2026-07-17) — see [CHANGELOG.md](CHANGELOG.md) for full history.

---

## Live URLs

| Audience | Custom domain (primary) | Firebase default domain | GitHub Pages (mirror) |
|---|---|---|---|
| 🛒 Customers | https://sristikheduthaat.in/ | https://prakrutik-kheti-c0a89.web.app/ | https://sristikrsf.github.io/Khedut-Haat/ |
| 🌾 Farmers | https://sristikheduthaat.in/submit | https://prakrutik-kheti-c0a89.web.app/submit | — Firebase only |
| 🔧 Admin | https://sristikheduthaat.in/admin | https://prakrutik-kheti-c0a89.web.app/admin | — Firebase only |

All three domains serve the **same live content** — the custom domain and the `.web.app` domain are two names pointing at the identical Firebase Hosting backend, not separate deploys. The `.web.app` link predates the custom domain and is still bookmarked by some — **always share the `sristikheduthaat.in` link**, not `.web.app` (V7.7 fixed the app's own auto-generated WhatsApp messages to always use the branded domain regardless of which link opened the page).

> **`prakrutik-kheti-e9194.web.app` is not this app** — `e9194` is a *separate* Firebase project entirely (Farm Verification — different app, different data, different billing). Don't confuse the two when working across both.

GitHub repository: https://github.com/SRISTIKRSF/Khedut-Haat (push as `krsf-work`)

---

## Architecture

- **No build step** — each app is a single self-contained HTML file
- **Firebase Realtime Database** — project `prakrutik-kheti-c0a89`, region `asia-southeast1`, namespace `prakrutik_kheti/`
- **Firebase Hosting** — project `c0a89`, public dir = `Khedut Haat/`, config in `Sristi/firebase.json` (one level up — that's *why* it has to sit above the app folder, not inside it: `"public": "Khedut Haat"` is a relative path from there)
- **1 Cloud Function** — `resetFarmerAuthAccount` (asia-southeast1) — server-side farmer password reset, source in `Sristi/functions/`
- **GitHub Pages mirror** — the `Khedut-Haat` GitHub repo's root **is** the `Khedut Haat/` app folder (a separate git repo from the `Sristi/` deploy-config repo). GitHub Pages is configured to build from that repo's main branch, so **every normal `git push origin main` automatically updates the Pages mirror too** — there is no separate manual "Pages deploy" step to remember. (The two hosts *can* drift if you ever `firebase deploy` without also pushing to git, or vice versa — but the normal workflow below does both together.)
- **Cloudinary** — product/logo/banner photos (unsigned upload preset; cloud name + preset stored at `settings/cloudinary` in RTDB, publicly readable — see [OPERATIONS.md](../OPERATIONS.md) in `Sristi/` for the actual values and why they're safe to be public)
- **SheetJS** — loaded on-demand (CDN) for Excel import/export
- **Sortable.js** — loaded on-demand (CDN) for category reorder drag-and-drop

---

## Files

### Live apps (in `Khedut Haat/`)

| File | Route | Audience |
|---|---|---|
| `index.html` | `/` | Customer catalogue |
| `khedut_haat_farmer_v54.html` | `/submit` | Farmer submission |
| `khedut_haat_admin_v54.html` | `/admin` | Office admin |
| `sristi_haat_catalog_v1.html` | `/demo` | Old demo catalogue (legacy, kept for the route only) |

All three active apps carry the **same decimal version** (currently `V8.1`) in their `<title>` tag, bumped together on every release even when only one app has a functional change — this keeps "what version is live" a single number to check, not three. The **filename suffix** (`_v54`) is a separate, much-less-frequently-bumped thing (last touched 2026-06-25) — don't confuse the two. `firebase.json` also keeps legacy rewrites (`/khedut_haat_farmer_v23.html` → current file, etc.) so any old bookmarked/shared direct-file links still resolve.

### Utility / one-time tools (tracked in git, `firebase.json`-ignored or simply unlinked — not part of the live app)

| File | Purpose |
|---|---|
| `sristi_haat_migrate_farmers.html` | One-time farmer migration |
| `sristi_haat_migrate_db.html` | One-time DB migration |
| `sristi_haat_repair_data.html` | Data repair tool |
| `sristi_haat_map_products.html` | Product mapping tool |
| `sristi_haat_roster_from_whatsapp.html` | Roster import from WhatsApp |
| `sristi_haat_farmer_print.html` | Farmer print sheet |
| `sristi_haat_seed_haats_geo.html` | Seed haat geo-locations |
| `farmer-handbook-gu.html` / `.docx` / `.pdf` | Farmer onboarding handbook (Gujarati) |
| `sristi_haat_admin_v1.html` | Very old admin build — login-gated by the real `admins/` node, harmless to leave, not linked from anywhere live |

### Config (one level up, in `Sristi/`)

| File | Purpose |
|---|---|
| `firebase.json` | Hosting config, rewrites, cache headers, Cloud Function pointer |
| `.firebaserc` | Firebase project alias (`c0a89`) |
| `database.rules.json` | RTDB security rules (recommended/reference copy — **deployed rules are the source of truth**, always verify via `firebase deploy --only database:rules --dry-run` or the Console before assuming this file matches production) |
| `functions/index.js` | `resetFarmerAuthAccount` Cloud Function source |
| `OPERATIONS.md` | Deploy runbook, data model, config reference, safety guidelines (this file's sibling — not in the public GitHub repo) |

---

## Firebase Data Structure

All app data lives under `prakrutik_kheti/` in the `c0a89` RTDB.

```
prakrutik_kheti/
├── haats/{code}              # Haat (market venue) definitions
│   ├── name / nameGu         # Display name
│   ├── open                  # boolean — controls customer catalogue visibility
│   ├── city / cityGu         # City (drives the customer app's city filter)
│   ├── days[] / time         # Schedule (auto-generates the "રવિવાર સવાર 7–10" text)
│   ├── gmaps                 # Google Maps link
│   └── seqOrder              # Display order (admin drag-reorder)
│
├── weekly/{weekKey}/         # Weekly submission round (key = a plain incrementing number)
│   ├── current                # Pointer: weekly/current = the LIVE week's key — SACRED, see below
│   ├── meta/{weekNum, dateLabel, createdAt, deadline}
│   ├── submissions/{fid}/    # One per farmer per week
│   │   ├── farmerName / farmerPhone / farmerHaat / farmerHaatCodes[]
│   │   ├── status            # "pending" | "approved" | "rejected"
│   │   └── items[]/
│   │       ├── name / productId / cat / unit
│   │       ├── price / priceByHaat{}      # priceByHaat overrides, else falls back to price
│   │       ├── qty / qtyByHaat{}          # brought (qty = legacy aggregate, qtyByHaat = per-venue)
│   │       ├── qtyRemaining / qtyRemainingByHaat{}   # unsold, farmer-filled post-haat
│   │       └── pendingReview             # true = added after approval, awaiting admin
│   └── _archive/{key}/submissions/       # "Start Fresh" snapshots (undo-only, never merge with live)
│
├── products/{id}              # Admin master catalogue (source of truth for names/photos/category)
├── marketFarmers/{id}         # Farmer database — name, phone (stable dedup key), village, district, active
├── farmerAuth/{phone}/pwd     # Farmer app custom passwords — write-only via rules, NOT readable by
│                               #   anyone (including admin/API) once set; verified live 2026-07-14
├── admins/{username}/         # Admin accounts — {name, forceChange} public-readable, {pwd} is not
│                               #   (see OPERATIONS.md for the actual login mechanism)
├── catalogSnapshot            # Precomputed customer-catalogue payload (Storage + RTDB dual-write,
│                               #   cuts customer page-load RTDB cost — see V59/V61 in CHANGELOG)
├── catalogViews/               # Anonymous view-count analytics (admin 📊 કસ્ટમર વ્યુ)
└── settings/
    ├── categories / categoryOrder / categoryLabels
    ├── siteConfig             # Customer hero branding + both apps' login backgrounds
    └── cloudinary              # {cloudName, uploadPreset} — publicly readable, see OPERATIONS.md
```

> **`weekly/current` is sacred** — it always points at the LIVE customer-facing week. Never modify it during testing. For any exploratory/test work, write to an isolated key (e.g. `weekly/zzz_test/`) and delete it after — never touch a real week's data to "just check something."

---

## Key Features by App

### Customer Catalogue (`index.html`)
- Products from **haats with `open: true`** only; a closed haat's farmers vanish from the catalogue entirely
- Per-venue pricing (`priceByHaat`, falls back to common `price`); search by name/category/aliases
- One featured venue card (first by admin's drag-order) + "બધા સ્થળ જુઓ" full list — **not** a phone-history dead-end: opening it (or the product detail sheet) pushes a real history entry, so the phone's back button closes the panel instead of exiting the app (V8.1)
- WhatsApp "શેર કરો" always shares the branded `sristikheduthaat.in` link, regardless of which domain the visitor is on (V7.7)
- Branding configurable via admin 🎨 Design tab

### Farmer App (`/submit`)
- Login: phone + password (default = last 4 digits of phone; farmer-changeable, then unreadable by anyone including admin — see `farmerAuth/` above)
- Select from the admin's master catalogue; opt into per-haat pricing per product
- **બાકી (unsold, post-haat) cannot exceed લાવ્યા (brought)**, and can't be entered before લાવ્યા is filled — live-clamped input + a submit-time backstop (V8.0). This exists because `price > 0` is literally what marks an item as "being submitted this week" — an impossible બાકી used to silently corrupt admin Reports' sold/revenue math.
- Post-submit WhatsApp-saveable summary includes બાકી when present (V8.0)
- After admin approval, prices lock (🔒); only quantity/બાકી stay editable

### Admin App (`/admin`)
- **સમીક્ષા (Review)**: approve/reject, edit prices pre-approval, per-haat price boxes
- **ખેડૂત (Farmers)**: farmer DB, password reset (server-side via `resetFarmerAuthAccount` Cloud Function)
- **પ્રોડક્ટ (Products)**: master catalogue, Excel import, category management, drag-reorder
- **હાટ (Haats)**: add/edit/open-close/delete, week settings
- **🎨 ડિઝાઇન (Design)**: hero branding, both apps' login backgrounds — uploads correctly composite transparent-PNG logos onto white (fixed V7.6: a missing canvas fill used to silently turn transparent backgrounds black)
- **📊 રિપોર્ટ (Reports)** — read-only, never writes:
  - વેચાણ (sales) = **actual** qty sold × price, everywhere — a dash (—) when બાકી was never filled, never a guessed number (V7.8). ₹0 (genuinely sold nothing) and — (unknown) are kept visually distinct on purpose.
  - Views: ખેડૂત×પ્રોડક્ટ, પાક (crop), મહિના વાર (month matrix), હાટ-વાર વેચાણ (per-venue), હાજરી (attendance), Insights (top farmers/products, price spread, wastage %, week trend)
  - Excel export + 🖨 PDF/print
- **📖 માર્ગદર્શન (Guide)**: in-app help for every tab

---

## Deployment

Full runbook (including the version-bump checklist, Cloud Function/rules deploys, and what actually is vs. isn't safe to ship while farmers are submitting) lives in **[`Sristi/OPERATIONS.md`](../OPERATIONS.md)** — that file also holds the config/login reference and isn't in this public GitHub repo.

Quick reference for the common case (edit → ship):
```bash
# from D:\Guru\Mirror\CRITICAL FILES\Claude Apps\Sristi\Khedut Haat\
git add index.html khedut_haat_admin_v54.html khedut_haat_farmer_v54.html
git commit -m "..." && git push origin main      # also updates the GitHub Pages mirror
cd .. && firebase deploy --only hosting            # from Sristi/
curl -s https://sristikheduthaat.in/admin | grep -o '<title>[^<]*</title>'   # verify
```

---

## Version History

See **[CHANGELOG.md](CHANGELOG.md)** for the full version history (current decimal scheme V7.1→V8.1, plus a condensed summary of the earlier integer-versioned era).

---

## Tech Stack Summary

| Layer | Choice |
|---|---|
| UI | Vanilla JS + CSS, Gujarati UI throughout |
| Data | Firebase Realtime Database (`c0a89`, asia-southeast1) |
| Serverless | 1 Cloud Function (`resetFarmerAuthAccount`, asia-southeast1) |
| Hosting | Firebase Hosting (`c0a89`) + GitHub Pages mirror (auto-synced via `git push`) |
| Photos | Cloudinary (unsigned preset, free tier) |
| Excel | SheetJS (CDN, loaded on demand) |
| Drag-drop | Sortable.js (CDN, loaded on demand) |
| Fonts | Inter (Latin) + Hind Vadodara (Gujarati) via Google Fonts |
| Farmer auth | Phone + password; default derivable (last 4 digits), custom values write-only (unreadable once set) |
| Admin auth | Firebase Auth (synthetic `{username}@khedut-haat.app` email), backed by `admins/{username}` in RTDB for identity + audit trail |

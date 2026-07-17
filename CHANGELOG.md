# Changelog — Khedut Haat

Version shown in every app's `<title>` tag; bumped together across all three apps on every release, even when only one app changed functionally, so "what's live" is always a single number to check.

Full commit-level detail for any entry: `git log --oneline` in this repo, or `git show <version-title-text>` to find the exact commit.

---

## Versioning scheme

- **2026-07-13 onward:** decimal scheme, `V7.1`, `V7.2`, … `V8.0`, `V8.1` … — one shared number across customer/farmer/admin.
- **Before that (2026-06-19 to 2026-07-13):** each app had its own independently-incrementing integer version embedded in the filename (`_v21`, `_v23` …) and a separate internal feature-sequence number in the title — the two frequently drifted apart, which is part of why the scheme was reset. See "Earlier history" below for a condensed summary of that era.

---

## V8.1 — 2026-07-17
**Customer catalogue:** phone/PWA back button was closing the whole app instead of the open product-detail sheet or "બધા સ્થળ" panel — neither overlay ever pushed a browser-history entry, so the back gesture had nothing in-page to step into. Fixed by pushing one history entry per overlay open; every close path (✕ / tap-outside / Esc / back button) now routes through the same handler, so a second back press still correctly leaves the site — no phantom extra step in either direction. Verified against the real History API, not mocked.

## V8.0 — 2026-07-17
**Farmer app:** બાકી (unsold, post-haat) can no longer exceed લાવ્યા (brought), and can't be entered before લાવ્યા is filled — live-clamped on the input plus a submit-time backstop for the case where જથ્થો gets lowered *after* બાકી was already filled. Root-caused from 24 already-impossible live entries (6 typos where બાકી > લાવ્યા, 18 where લાવ્યા was left blank entirely) that were silently corrupting Reports' sold/revenue math. Also: the WhatsApp "સાચવો" share message was missing બાકી (the on-screen table showed it, the shared text didn't) — now included.

## V7.8 — 2026-07-17
**Admin Reports:** money column changed from an *estimate* (assumed everything brought was sold) to **actual sales** = qty sold × price, everywhere — farmer view, crop view, month matrix, હાટ-વાર, insights, stat bar, both Excel exports. A dash (—) shows when બાકી was never filled (genuinely unknown, no guess); a real **₹0** shows only when બાકી confirms nothing sold — the two are kept visually and computationally distinct (an all-blank farmer/week totals to —, never a false ₹0). Relabeled "અંદાજિત વેચાણ" → "વેચાણ" throughout since it's no longer an estimate. Verified on live data: the 14-July round was 81% real ₹ / 148 genuine ₹0 / 140 dash, matching the measured બાકી fill-rate exactly.

## V7.7 — 2026-07-16
Customer catalogue's "શેર કરો" button and admin's auto-generated customer/farmer broadcast messages derived their link from whatever domain the page happened to be opened from (`location.origin`/`location.href`) instead of a fixed address — so anyone using the old `prakrutik-kheti-c0a89.web.app` bookmark had every broadcast silently carry that URL instead of the branded `sristikheduthaat.in`. Verified live: opening admin from each of the two domains produced two *different* links in the generated messages, before this fix. Now hardcoded to the branded domain in both files. Also removed dead code: a `.replace()` targeting a path pattern that could never match `location.origin` (which never contains a path) — a leftover from a filename that predates the current one by several renames.

## V7.6 — 2026-07-16
Admin Design-tab uploads (logos, hero banner, both login backgrounds) share one resize function that drew onto a blank canvas and exported straight to JPEG without filling a background first — since JPEG has no alpha channel and an unfilled canvas is transparent black, any transparent-background PNG (how most logo files are exported) had its "empty" areas silently turned black instead of white. Fixed by filling white before drawing. Verified with a synthetic transparent PNG (corner went from black to genuine white, logo content unchanged) and confirmed no regression on normal opaque images.

## V7.5 — 2026-07-14
Customer catalogue above-the-fold + search layout, after user feedback on a first pass:
- Hero shrunk 340px → 230px; the old 3-card venue strip replaced with **one** featured venue card (first by admin's drag-order) + "બધા સ્થળ જુઓ" — was showing the same info the location chip already opens, at roughly double the screen cost of the 1-card version.
- Search box moved **below** the filter rows (city → venue → category → search), closest to the results it filters — more natural reading order than search-first.
- Search results grid was a separate, ~2.5× bigger card layout than the browse grid — products visibly "jumped" in size the instant you typed. Now identical sizing to browsing.
- Fixed category headers sticking mid-way through the filter bar while scrolling: the sticky `top` offset was a hardcoded pixel value sized for 2 filter rows, silently broken once a 3rd (city) row was added later. Replaced with a live-measured value via `ResizeObserver` so it can't drift out of sync again.
- Dropped the word "મળ્યા" from the results count; removed the "🛍️ થેલી લઈ આવજો" hero chip.

## V7.4 — 2026-07-14
- **Farmer app:** tapping the search bar now auto-scrolls it to the top (pins via its existing `position:sticky`) instead of leaving it stranded between the haat-selection cards above and the phone keyboard below, with almost no room left to see products.
- **Farmer app:** category headers became solid dark-green sticky bands (was a pale strip that blended into the background) so sections stay visually distinct on long scrolls; product cards lost their border in favor of a soft shadow to match.
- **Customer catalogue:** search used to debounce into a full-page `render()` — rebuilding the hero image, filter chips, **and the search input itself** on every keystroke. Fast typing raced that rebuild: the input got torn down and recreated mid-keystroke, and characters typed during that window landed on a detached DOM node and were lost (reported as "Dadam" → "ddm"). Fixed by never touching `#searchInput` again after first paint — only the results list below it refreshes.

## V7.3 — 2026-07-13
Farmer password reset moved fully server-side: a `resetFarmerAuthAccount` Cloud Function (asia-southeast1) that deletes+recreates the farmer's Firebase Auth account in one atomic call, callable only by a signed-in admin. Replaces an earlier client-side attempt that failed with `auth/email-already-in-use` for any farmer who already had an account — the client SDK can't delete another user's account, only the Admin SDK (server-side) can. Root-caused and fixed a live "internal" error in this feature the same day: `admin.initializeApp()` with no config can't auto-discover a named-regional RTDB instance, needs an explicit `databaseURL`.

## V7.2 — 2026-07-13
Pointed all user-facing links to the `sristikheduthaat.in` custom domain.

## V7.1 — 2026-07-13
**Versioning scheme reset** (see above) — this is the first release under the new shared-decimal scheme. Also shipped same-day:
- Admin login now signs in via Firebase Auth *before* reading the `admins/` node (was reading a plaintext `pwd` field directly) — closes a real credential-exposure gap while keeping the distinct "username doesn't exist" vs. "wrong password" login error messages (via a public `name`-only existence check, verified separately from the password itself).
- Customer catalogue: gzip-compressed Storage snapshot (4.25× smaller downloads) + preconnect hints.
- Fixed approve/reject/delete/edit-approve not reliably refreshing `catalogSnapshot` (the precomputed payload the customer app actually reads).

---

## Earlier history (2026-06-19 → 2026-07-13, integer/filename versioning — condensed)

Roughly 100 commits across this period; full detail via `git log`. Major milestones:

| Range | Theme |
|---|---|
| V10–V23 | Foundational build: sync fixes, font scheme (Inter+Hind Vadodara), per-haat pricing, haat management tab, Excel product import, category reorder, unified `_v21`→`_v23` filename versioning |
| V25–V38 | Reports tab built from scratch (Farmer×Product → Crop → Month-matrix → Insights, in that order), Start-fresh/Undo, farmer PWA install, product aliases (romanized search), haat drag-reorder + code-based venue matching (fixed 3 live regressions from earlier fuzzy name-matching) |
| V39–V49 | Customer-view analytics (fixed a half-built tracker, then IST-bucketing, then daily/weekly Excel export), admin dashboard funnel, **Firebase Auth login cutover for both farmer and admin** (V42 — the predecessor to V7.1's further hardening), price sanity-check flags in review |
| V50–V54 | Quota-blowout response: `catalogSnapshot` fast path + legacy photo-table retirement cut customer page-load RTDB cost significantly; per-app PWA icons; mobile-only admin sidebar nav; **filename rename to `_v54` across farmer+admin, all three titles bumped together** — this is the direct predecessor convention to the current decimal scheme |
| V55–V68 | Storage-first catalogue fetch (cheaper than RTDB reads), haat delete capability, attendance ticking (farmer chooses which haats they'll actually attend that week), per-venue sales report, image bandwidth compression |

**Known-resolved items from the old README's "Known Limitations" table** (kept here for continuity, not re-litigated): cross-farmer price anomaly flagging, Excel-export farmer dedup, and the Reports read-only guarantee were all addressed during the V25–V49 Reports build-out above.

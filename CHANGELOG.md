# Changelog

All notable changes to KJAH Prospecting Tool.

## [1.9.0] — 2026-05-26

### Added
- **Per-prospect audit checklist** — 6 ticked-or-not items grouped into "Pitch angle" (No website / Site needs redesign / Needs funnel / Needs automation) and "Positive signals" (Active on social / Has reviews). The first four map 1:1 to KJAH service offerings — a ticked box is a known pitch angle. Renders as checkbox group in the prospect panel below Notes.
- **Progress badge on cards + table rows** — shows `n/6 checks` once at least one box is ticked, so you see at a glance how far through the audit each prospect is. Turns lavender (matches the Qualified stage colour) when all six are ticked.
- **Single source of truth** at `app/dashboard/checklist.js` — adding/removing/renaming items in the future is a one-file change; the DB schema (a JSONB array of IDs) stays put.

### Migration required
Run in Supabase SQL editor before deploying:
```sql
ALTER TABLE prospects ADD COLUMN checks JSONB DEFAULT '[]'::jsonb;
```

---

## [1.8.0] — 2026-05-26

### Added
- **"Qualified" pipeline stage** — sits between Cold and Contacted. The intended flow: scraped raw prospects land in Cold; once you've checked their site/details and they're ready to reach out, drag them to Qualified; then move to Contacted once outreach happens. New status badge, kanban column, stat counter, filter tab, and dropdown option — all colour-tokenised as `--status-qualified` (soft lavender `#A493C7`). Updated `STATUS_ORDER` so sort-by-status keeps the new ordering.

### Changed
- **Stat counter row scrolls horizontally on mobile** — with 6 status counts now, the row could overflow on narrow phones. Added `overflow-x: auto` + `flex-shrink: 0` on the mobile stat group so the 6th stat isn't clipped.

---

## [1.7.0] — 2026-05-26

### Added
- **Dedicated Email field** — separate from the freeform Contact field. Stored on the prospect, shown as its own table column with a `mailto:` link, and added to the add/edit panel (paired with Contact in a single row). Empty when not known so it's obvious which prospects still need an email looked up.
- **Scraper extracts email** — the website fetch that already pulls an Instagram handle now also extracts a contact email (prefers `mailto:` links, falls back to plain-text addresses, skips obvious noise like `example.com`, `wixpress`, image filenames). Many sites won't expose one — those just stay blank.

### Fixed
- **Square character in notes** — the previous codepoint filter only stripped C0/C1 controls and U+FFFD, but the real culprit was a Private Use Area glyph injected by Google Maps' address element (a Material Icons "location pin" codepoint). New sanitizer in `lib/kv.js#toProspect` strips PUA + control + replacement chars at the read source, so the fix covers existing DB rows and every view (table + kanban + panel). The per-view `cleanNotes` in KanbanBoard was removed — single source of truth.

### Changed
- **Name/Business truncation now applies on desktop too** — `.nameText` capped at 280px on desktop, 200px on tablet, 150px on phone. Truncation properties moved out of the media query into base CSS.

### Migration required
Run in Supabase SQL editor before deploying:
```sql
ALTER TABLE prospects ADD COLUMN email TEXT;
```

---

## [1.6.2] — 2026-05-22

### Fixed
- **Table rows extremely tall on mobile/tablet** — `.name` and `.biz` had no truncation, so on narrow viewports the crushed Name/Business column wrapped text into many lines, ballooning row height. On screens ≤1024px the name and business now truncate to a single line each with an ellipsis (`.nameText` capped at 200px on tablet, 150px on phone).

### Changed
- **Name/Business cell is now clickable** — clicking (or tapping) the Name/Business cell opens the prospect detail panel. Removes the need to scroll the table horizontally to reach the Edit button on mobile/tablet. Applies on all viewport sizes for consistency.

---

## [1.6.1] — 2026-05-22

### Fixed
- **Delete confirm modal invisible / column "freeze"** — the delete confirmation rendered `.overlay` without the `.overlayVisible` class. `.overlay` defaults to `opacity: 0`, so the confirm dialog was completely invisible while still mounting a full-screen `z-index: 100` overlay over everything. Clicking Delete appeared to do nothing and made the column unclickable (the invisible overlay was intercepting all pointer events). Added `overlayVisible` to the confirm overlay.

---

## [1.6.0] — 2026-05-22

### Added
- **Website link on Kanban cards** — website shown as a truncated blue monospace link below the business name; clicking opens in a new tab without triggering the edit panel (stopPropagation on both mousedown and click).
- **Priority left border on Kanban cards** — 3px colored left border per priority: red (high), amber (medium), muted (low). Visual scan without needing text labels.
- **Nothing-style scrollbars** — 4px thin scrollbar across all scrollable areas; `--border-visible` track, darkens on hover. Applied globally in `globals.css`.

### Fixed
- **Kanban column header not sticky** — root cause was `padding: var(--space-md)` (all sides) on `.column` creating a 16px top gap that pushed the sticky header down. Fixed: column padding is now `0 var(--space-md) var(--space-md)` with `var(--space-md)` top padding moved inside `colHeader`. `z-index` raised to `2` so card `cardIn` animation stacking context can't bleed over it.
- **Kanban card text overflow** — business name and other text fields broke out of the card boundary on narrow columns. Fixed: `word-break: break-word; overflow-wrap: anywhere` on all card text elements + `overflow: hidden` on the card itself.
- **Square character in notes** — Google Maps address data can contain C0/C1 control characters and the Unicode replacement char (U+FFFD) that render as a square box. `cleanNotes()` in KanbanBoard filters these by codepoint before rendering.
- **Column header background on drag-over** — `.columnOver .colHeader` now gets `background: var(--surface)` so the header matches the highlighted column correctly.

### Changed
- **Mobile responsive overhaul** — stats, toolbar, and filter tabs all restack correctly on iPhone and iPad. Filter tabs scroll horizontally. Stats stack vertically at ≤768px. Panel goes full-width on mobile. Kanban board height uses `100dvh` to account for iOS Safari's dynamic address bar.
- **Kanban card font weights** — name bumped to `font-weight: 600`. Contact font-size reduced to 10px to match date label.

---

## [1.5.0] — 2026-05-22

### Added
- **Website field** — stored in DB, shown as a clickable link in dashboard table and scraper history. Prospects with no website show a red "No website" label for quick filtering. Also added as an input field in the edit/add panel.
- **Scraper UI page** (`/dashboard/scraper`) — command generator (keyword, city, limit → live-updating copy-able command), first-time setup instructions, and history table of all Google Maps scraped prospects.
- **Scraper button** in dashboard header linking to `/dashboard/scraper`.

### Fixed
- Scraper `networkidle` timeout — Google Maps never reaches networkidle due to background polling. Switched to `domcontentloaded` + explicit sleeps.
- Scraper env var mismatch — now accepts `SUPABASE_SERVICE_KEY` or `SUPABASE_SERVICE_ROLE_KEY`.
- Scraper `\r` output trick garbled error messages — removed.

---

## [1.4.0] — 2026-05-22

### Added
- **Prospect scraper** (`scripts/scrape.js`) — Playwright-based Google Maps scraper. Searches by keyword + city, extracts business name, category, phone, website, and address. For each result with a website, fetches the homepage and regex-extracts the Instagram handle. Inserts results directly into Supabase as `status: cold, source: google-maps`. Deduplicates against existing prospects by business name.
- **"Google Maps" source option** — added to the Source dropdown in the prospect panel.
- `dotenv` and `playwright` added as devDependencies.
- `npm run scrape` script — usage: `npm run scrape -- "<keyword>" "<city>" [limit]`

---

## [1.3.1] — 2026-05-22

### Fixed
- **Dropdown selection not saving** — outside-click handler used `mousedown` which fires before `click`, causing the portal list to unmount before `onChange` ran. Added `listRef` to the portal div; outside-click now checks both the trigger and the list, so selecting an option always registers.

---

## [1.3.0] — 2026-05-22

### Added
- **Custom Dropdown component** — portal-based (`createPortal` to document.body) to fix native `<select>` white background rendering bug. All status, priority, source, and service fields now use the custom dropdown.
- **Smooth panel animations** — prospect add/edit panel slides in from the right (280ms ease-out) and slides back out on close. Overlay fades in/out independently.
- **Row entrance animation** — table rows fade + translate up on mount (`@keyframes rowIn`).
- **Delete animation** — deleted row slides right and fades out (260ms) before being removed from state.
- **Kanban card entrance** — each card animates in with `@keyframes cardIn` (opacity + translateY).
- **Priority field** — High / Medium / Low with color-coded dot indicator in table (red / amber / disabled).
- **Source field** — Instagram, Facebook, LinkedIn, Referral, Cold DM, Cold Email, Other.
- **Service field** — Website, Funnel, Automation, Full Package, Other.
- **Assigned To field** — free-text team member name, shown in table name cell.
- **Activity Log** — timestamped notes per prospect (edit mode only). Optimistic UI: new entry appears immediately without waiting for server round-trip.

### Changed
- ProspectPanel form reorganised into field rows (Status+Priority, Source+Service, AssignedTo+FollowUp).
- `updateProspect` in `lib/kv.js` uses conditional patch — only updates provided fields, preserving partial-update safety for inline status changes.

---

## [1.2.0] — 2026-05-21

### Added
- **Kanban board view** — drag-and-drop across 5 status columns (Cold → Contacted → Interested → Converted → Lost) using HTML5 Drag and Drop API.
- **Inline status editing** — click any status badge in table view to open an inline select.
- **Search** — real-time filter by name or business name.
- **Sort** — sortable columns: Name, Contact, Status, Follow-up date. Toggle asc/desc.
- **30-second auto-refresh** — `router.refresh()` via `useTransition` every 30s keeps data current across team members.
- **View toggle** — Table / Kanban segmented control in the header.
- **Filter tabs** — All + 5 status filters in the toolbar.

---

## [1.1.0] — 2026-05-20

### Added
- Supabase Postgres backend replacing Vercel KV (Vercel retired KV product).
- `lib/kv.js` — full CRUD with snake_case→camelCase field mapper and in-memory dev fallback.
- Full prospect fields: Name, Business, Contact, Status, Follow-up Date, Notes.
- ProspectPanel slide-in form for add and edit.
- Delete confirmation dialog with overlay.
- Stats bar (total + per-status counts).
- Status badge with color coding per Nothing design system.

---

## [1.0.0] — 2026-05-19

### Added
- Initial project — separate Next.js App Router project.
- Password-protected login via `ADMIN_PASSWORD` env var.
- SHA-256 httpOnly cookie session (Web Crypto API — Edge + Node compatible).
- Next.js middleware protecting `/dashboard/:path*`.
- Nothing design system — dark OLED mode, Space Grotesk + Space Mono + Doto fonts.
- Deployed to Vercel at `prospecting.kjahstudio.com`.
- GitHub: `greyhat112-sys/kjah-studio-prospecting-tool`.

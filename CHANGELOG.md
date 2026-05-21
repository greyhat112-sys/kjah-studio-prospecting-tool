# Changelog

All notable changes to KJAH Prospecting Tool.

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

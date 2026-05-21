# Changelog

All notable changes to KJAH Prospecting Tool.

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

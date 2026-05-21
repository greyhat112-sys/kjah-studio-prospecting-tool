# KJAH Prospecting Tool

Internal sales CRM for KJAH Studio. Tracks prospects from cold outreach through to conversion.

Live at **[prospecting.kjahstudio.com](https://prospecting.kjahstudio.com)**

---

## Stack

- **Next.js** App Router — React 19, Server Actions, CSS Modules
- **Supabase** (Postgres) — server-side only, service role key
- **Nothing design system** — dark OLED mode, Space Grotesk + Space Mono + Doto

## Auth

Single-password login. Set env vars and the session is stateless (SHA-256 httpOnly cookie, 7-day expiry, Edge-compatible).

## Features

- **Table view** — sortable columns, filter tabs, search, inline status editing
- **Kanban view** — drag-and-drop across 5 pipeline stages
- **Prospect fields** — Name, Business, Contact, Status, Priority, Source, Service, Assigned To, Follow-up Date, Notes
- **Activity Log** — per-prospect timestamped notes (optimistic UI)
- **30s auto-refresh** — stays in sync across team members

## Pipeline

`Cold → Contacted → Interested → Converted → Lost`

## Local dev

```bash
npm install
```

Create `.env.local`:

```
ADMIN_PASSWORD=your-password
SESSION_SECRET=random-long-string
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
```

```bash
npm run dev   # localhost:3001 (or next available port)
```

> **iOS Safari / real device:** use `npm run build && npm start` — Turbopack outputs modern JS that WebKit cannot parse.

## Supabase schema

```sql
CREATE TABLE prospects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  business     TEXT NOT NULL,
  contact      TEXT,
  status       TEXT DEFAULT 'cold',
  follow_up    DATE,
  notes        TEXT,
  source       TEXT,
  service      TEXT,
  assigned_to  TEXT,
  priority     TEXT DEFAULT 'medium',
  activity     JSONB DEFAULT '[]'::jsonb,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ
);
```

## Deploy

Push to `master` → Vercel auto-deploys.

```bash
git push origin master
```

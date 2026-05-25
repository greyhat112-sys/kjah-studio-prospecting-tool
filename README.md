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

- **Table view** — sortable columns, filter tabs, search, inline status editing, clickable Name/Business cell opens the detail panel
- **Kanban view** — drag-and-drop across 5 pipeline stages with priority-coloured left borders
- **Prospect fields** — Name, Business, Contact (phone/handle), Email (`mailto:` link), Website, Status, Priority, Source, Service, Assigned To, Follow-up Date, Notes
- **Activity Log** — per-prospect timestamped notes (optimistic UI)
- **30s auto-refresh** — stays in sync across team members
- **Built-in scraper UI** at `/dashboard/scraper` — generates the command line, lists previously scraped prospects

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
  email        TEXT,
  website      TEXT,
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

-- If migrating an existing table, add the columns separately:
--   ALTER TABLE prospects ADD COLUMN email   TEXT;
--   ALTER TABLE prospects ADD COLUMN website TEXT;
```

## Scraper (free, no API key needed)

Scrapes Google Maps by keyword + city, fetches each business's website to extract an Instagram handle and a contact email (when one is publicly listed), and auto-inserts results into Supabase as Cold prospects. Prospects without an email stay blank so it's obvious which still need a manual lookup.

**One-time setup:**
```bash
npm install --save-dev dotenv playwright
npx playwright install chromium
```

**Run:**
```bash
npm run scrape -- "<keyword>" "<city>" [limit]

# Examples:
npm run scrape -- "restaurants" "Lagos" 30
npm run scrape -- "web design agency" "New York" 20
npm run scrape -- "e-commerce brand" "London" 50
```

A real Chromium window opens so you can watch it work. If Google shows a CAPTCHA, solve it manually and it continues. Results appear in the dashboard immediately.

> Scraper only runs locally — it is not part of the Vercel deployment.

## Deploy

Push to `master` → Vercel auto-deploys.

```bash
git push origin master
```

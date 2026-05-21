'use strict'
/**
 * KJAH Prospect Scraper
 * Scrapes Google Maps for businesses, checks their websites for Instagram handles,
 * then inserts results directly into Supabase as status: cold.
 *
 * Usage:
 *   node scripts/scrape.js <keyword> <city> [limit]
 *
 * Examples:
 *   node scripts/scrape.js "restaurants" "Lagos" 30
 *   node scripts/scrape.js "web design agency" "London" 20
 *   node scripts/scrape.js "e-commerce store" "New York" 50
 */

const { chromium } = require('playwright')
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// ── Args ──────────────────────────────────────────────────────────────────────

const [,, keyword, city, limitArg] = process.argv

if (!keyword || !city) {
  console.error('\nUsage: node scripts/scrape.js <keyword> <city> [limit]\n')
  console.error('  node scripts/scrape.js "restaurants" "Lagos" 30\n')
  process.exit(1)
}

const LIMIT = Math.min(parseInt(limitArg || '30'), 200)

// Instagram paths that aren't usernames
const IG_SKIP = new Set(['p', 'reel', 'reels', 'explore', 'accounts', 'stories', 'tv', 'share', 'web', 'sharer', 'direct', 'tags'])

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms))
const jitter = (base, spread) => base + Math.floor(Math.random() * spread)

async function getExistingBusinesses() {
  const { data, error } = await supabase.from('prospects').select('business')
  if (error) return new Set()
  return new Set((data || []).map(p => p.business?.toLowerCase().trim()).filter(Boolean))
}

async function findInstagram(url) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 7000)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
    })
    clearTimeout(timer)
    if (!res.ok) return null
    const html = await res.text()
    const match = html.match(/instagram\.com\/([\w.]{2,30})/i)
    if (match && !IG_SKIP.has(match[1].toLowerCase())) {
      return `@${match[1]}`
    }
  } catch {
    // network error, timeout, etc — skip silently
  }
  return null
}

// ── Supabase ─────────────────────────────────────────────────────────────────

const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!process.env.SUPABASE_URL || !SUPABASE_KEY) {
  console.error('\nMissing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local\n')
  process.exit(1)
}

const supabase = createClient(process.env.SUPABASE_URL, SUPABASE_KEY)

// ── Google Maps extraction ────────────────────────────────────────────────────

async function extractPlaceDetail(page) {
  try {
    await page.waitForSelector('h1', { timeout: 8000 })
  } catch {
    return null
  }

  return await page.evaluate(() => {
    const name = document.querySelector('h1')?.textContent?.trim() ?? null
    if (!name) return null

    // Phone — most reliable: the tel: anchor
    const phone = document.querySelector('a[href^="tel:"]')
      ?.getAttribute('href')?.replace('tel:', '').trim() ?? ''

    // Website — Google uses data-item-id="authority" on the website button
    const websiteEl =
      document.querySelector('a[data-item-id="authority"]') ??
      [...document.querySelectorAll('a[target="_blank"]')]
        .find(a => a.href && !a.href.includes('google.com') && /^https?:\/\//.test(a.href))
    const website = websiteEl?.href ?? ''

    // Category — the first category chip button
    const category =
      document.querySelector('button.DkEaL')?.textContent?.trim() ??
      document.querySelector('[jsaction*="category"]')?.textContent?.trim() ?? ''

    // Address — look for the copy-address button area
    const addressEl =
      [...document.querySelectorAll('[aria-label]')]
        .find(el => /address/i.test(el.getAttribute('aria-label') ?? ''))
    const address = addressEl?.querySelector('[class*="fontBodyMedium"], span')?.textContent?.trim() ?? ''

    return { name, phone, website, category, address }
  })
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n' + '─'.repeat(45))
  console.log('  KJAH Prospect Scraper')
  console.log('─'.repeat(45))
  console.log(`  Keyword : ${keyword}`)
  console.log(`  City    : ${city}`)
  console.log(`  Limit   : ${LIMIT}`)
  console.log('─'.repeat(45) + '\n')

  // Quick connection check
  const { error: testErr } = await supabase.from('prospects').select('id').limit(1)
  if (testErr) {
    console.error(`  Connection failed: ${testErr.message}`)
    console.error('  Check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local\n')
    process.exit(1)
  }

  const existing = await getExistingBusinesses()
  console.log(`  ${existing.size} prospect(s) already in DB — duplicates will be skipped\n`)

  const browser = await chromium.launch({
    headless: false,
    slowMo: 40,
    args: ['--start-maximized'],
  })
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
  })
  const page = await ctx.newPage()

  // Go to Google Maps search
  const query = encodeURIComponent(`${keyword} ${city}`)
  await page.goto(`https://www.google.com/maps/search/${query}`, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await sleep(3000)

  // Dismiss cookie/consent dialogs (EU regions)
  for (const label of ['Accept all', 'Accept', 'Agree', 'Reject all']) {
    await page.locator(`button:has-text("${label}")`).first().click({ timeout: 2000 }).catch(() => {})
  }
  await sleep(1500)

  const inserted = []
  let scrollRounds = 0
  const visited = new Set()

  while (inserted.length < LIMIT && scrollRounds < 50) {
    // Collect place URLs from the current results sidebar
    const hrefs = await page.$$eval(
      'div[role="feed"] a[href*="/maps/place/"]',
      els => els.map(a => a.href)
    )

    const fresh = hrefs.filter(h => !visited.has(h))
    if (fresh.length === 0) {
      // No new results — try scrolling more
      const atEnd = await page.evaluate(() => {
        const feed = document.querySelector('div[role="feed"]')
        if (!feed) return true
        return feed.scrollTop + feed.clientHeight >= feed.scrollHeight - 10
      })
      if (atEnd) break
    }

    for (const href of fresh) {
      if (inserted.length >= LIMIT) break
      visited.add(href)

      try {
        await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await sleep(jitter(1500, 800))

        const detail = await extractPlaceDetail(page)
        if (!detail?.name) continue

        const bizKey = detail.name.toLowerCase().trim()
        if (existing.has(bizKey)) {
          console.log(`  [skip]  ${detail.name} — already in DB`)
          continue
        }

        // Check website for Instagram handle
        let instagram = null
        if (detail.website) {
          instagram = await findInstagram(detail.website)
        }

        const contactParts = [detail.phone, instagram].filter(Boolean)
        const notesParts   = [detail.category, detail.address].filter(Boolean)

        const row = {
          name:     detail.name,
          business: detail.name,
          contact:  contactParts.join(' · '),
          website:  detail.website || null,
          status:   'cold',
          source:   'google-maps',
          notes:    notesParts.join(' — '),
        }

        const { error } = await supabase.from('prospects').insert(row)
        if (error) {
          console.log(`  [err]   ${detail.name} — ${error.message}`)
          continue
        }

        existing.add(bizKey)
        inserted.push(row)

        const ig  = instagram ? ` · ${instagram}` : ''
        const ph  = detail.phone ? ` · ${detail.phone}` : ''
        const web = detail.website ? ` · ${detail.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}` : ' · no website'
        console.log(`  [${String(inserted.length).padStart(2)}/${LIMIT}] ${detail.name}${ph}${ig}${web}`)

        await sleep(jitter(1000, 1000))

        // Go back to search results
        await page.goto(`https://www.google.com/maps/search/${query}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
        await sleep(jitter(1500, 500))

      } catch (err) {
        // Skip — go back to search page
        try {
          await page.goto(`https://www.google.com/maps/search/${query}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
        } catch {}
        await sleep(1000)
      }
    }

    // Scroll the results sidebar to load more
    await page.evaluate(() => {
      const feed = document.querySelector('div[role="feed"]')
      if (feed) feed.scrollTop += 1500
    })
    await sleep(jitter(1200, 800))
    scrollRounds++
  }

  await browser.close()

  console.log('\n' + '─'.repeat(45))
  if (inserted.length === 0) {
    console.log('  No new prospects found.')
  } else {
    console.log(`  Done — ${inserted.length} prospect${inserted.length !== 1 ? 's' : ''} added as Cold.`)
    console.log('  Open the dashboard to see them.')
  }
  console.log('─'.repeat(45) + '\n')
}

run().catch(err => {
  console.error('\nScraper error:', err.message)
  process.exit(1)
})

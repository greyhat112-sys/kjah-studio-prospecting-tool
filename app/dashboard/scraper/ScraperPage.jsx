'use client'
import { useState } from 'react'
import Link from 'next/link'
import styles from './scraper.module.css'

const STATUS_LABEL = {
  cold: 'Cold', contacted: 'Contacted', interested: 'Interested',
  converted: 'Converted', lost: 'Lost',
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function ScraperPage({ prospects }) {
  const [keyword, setKeyword] = useState('')
  const [city,    setCity]    = useState('')
  const [limit,   setLimit]   = useState(30)
  const [copied,  setCopied]  = useState(false)

  const kw  = keyword.trim() || 'restaurants'
  const ct  = city.trim()    || 'Lagos'
  const lm  = Math.max(1, Math.min(200, limit || 30))
  const cmd = `npm run scrape -- "${kw}" "${ct}" ${lm}`

  const handleCopy = () => {
    navigator.clipboard.writeText(cmd)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div className={styles.page}>

      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/dashboard" className={styles.back}>← Back</Link>
          <span className={styles.brand}>KJAH</span>
          <span className={styles.appName}>· Scraper</span>
        </div>
        <span className={styles.headerNote}>Runs locally — not on Vercel</span>
      </header>

      <div className={styles.body}>

        {/* ── Command Generator ── */}
        <section className={styles.card}>
          <p className={styles.cardLabel}>Command Generator</p>

          <div className={styles.fields}>
            <label className={styles.fieldWrap}>
              <span className={styles.fieldLabel}>Keyword</span>
              <input
                className={styles.input}
                placeholder="e.g. restaurants"
                value={keyword}
                onChange={e => setKeyword(e.target.value)}
              />
            </label>
            <label className={styles.fieldWrap}>
              <span className={styles.fieldLabel}>City</span>
              <input
                className={styles.input}
                placeholder="e.g. Lagos"
                value={city}
                onChange={e => setCity(e.target.value)}
              />
            </label>
            <label className={styles.fieldWrap}>
              <span className={styles.fieldLabel}>Limit</span>
              <input
                className={styles.input}
                type="number"
                min={1}
                max={200}
                value={limit}
                onChange={e => setLimit(parseInt(e.target.value) || 30)}
              />
            </label>
          </div>

          <div className={styles.cmdRow}>
            <code className={styles.cmd}>{cmd}</code>
            <button
              className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </section>

        {/* ── Setup ── */}
        <section className={styles.card}>
          <p className={styles.cardLabel}>First-time setup</p>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepN}>1</span>
              <code className={styles.stepCmd}>npm install --save-dev dotenv playwright</code>
            </div>
            <div className={styles.step}>
              <span className={styles.stepN}>2</span>
              <code className={styles.stepCmd}>npx playwright install chromium</code>
            </div>
          </div>
          <p className={styles.hint}>
            A browser window opens so you can watch — and solve CAPTCHAs if Google asks.
            Scraped prospects appear in the dashboard instantly as <strong>Cold</strong>.
          </p>
        </section>

        {/* ── History ── */}
        <section className={styles.card}>
          <p className={styles.cardLabel}>
            History
            <span className={styles.cardCount}>{prospects.length} scraped</span>
          </p>

          {prospects.length === 0 ? (
            <p className={styles.empty}>
              No scraped prospects yet. Fill in the form above, copy the command, and run it in your terminal.
            </p>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Business</th>
                    <th>Website</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {prospects.map(p => (
                    <tr key={p.id}>
                      <td className={styles.tdBiz}>{p.business}</td>
                      <td className={styles.tdWebsite}>
                        {p.website
                          ? <a href={p.website} target="_blank" rel="noopener noreferrer" className={styles.websiteLink}>
                              {p.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                            </a>
                          : <span className={styles.noWebsite}>No website</span>}
                      </td>
                      <td className={styles.tdMono}>{p.contact || '—'}</td>
                      <td>
                        <span className={`${styles.badge} ${styles[`badge_${p.status}`]}`}>
                          {STATUS_LABEL[p.status]}
                        </span>
                      </td>
                      <td className={styles.tdDate}>{formatDate(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </div>
  )
}

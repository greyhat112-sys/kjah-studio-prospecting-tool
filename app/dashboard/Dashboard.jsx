'use client'
import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { removeProspect, logout, updateStatus } from './actions'
import ProspectPanel from './ProspectPanel'
import KanbanBoard from './KanbanBoard'
import { CHECKLIST_TOTAL } from './checklist'
import styles from './dashboard.module.css'

const STATUSES = ['cold', 'qualified', 'contacted', 'interested', 'converted', 'lost']
const STATUS_LABEL = {
  cold: 'Cold', qualified: 'Qualified', contacted: 'Contacted', interested: 'Interested',
  converted: 'Converted', lost: 'Lost',
}
const STATUS_ORDER = { cold: 0, qualified: 1, contacted: 2, interested: 3, converted: 4, lost: 5 }

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

export default function Dashboard({ prospects: initial }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [prospects, setProspects]   = useState(initial)
  const [view, setView]             = useState('table')
  const [filter, setFilter]         = useState('all')
  const [search, setSearch]         = useState('')
  const [sort, setSort]             = useState({ field: null, dir: 'asc' })
  const [panel, setPanel]           = useState(null)
  const [confirm, setConfirm]       = useState(null)
  const [editStatus, setEditStatus] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  // Sync when server refreshes
  useEffect(() => { setProspects(initial) }, [initial])

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(() => startTransition(() => router.refresh()), 30000)
    return () => clearInterval(id)
  }, [router])

  const refresh = () => startTransition(() => router.refresh())

  // Filtered + searched + sorted
  const visible = [...prospects]
    .filter(p => filter === 'all' || p.status === filter)
    .filter(p => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return p.name.toLowerCase().includes(q) || p.business.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      if (!sort.field) return 0
      let av, bv
      if (sort.field === 'status') {
        av = STATUS_ORDER[a.status] ?? 0
        bv = STATUS_ORDER[b.status] ?? 0
      } else if (sort.field === 'followUp') {
        av = a.followUp || ''
        bv = b.followUp || ''
      } else {
        av = (a[sort.field] || '').toLowerCase()
        bv = (b[sort.field] || '').toLowerCase()
      }
      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      if (av > bv) return sort.dir === 'asc' ? 1 : -1
      return 0
    })

  const toggleSort = field => setSort(s =>
    s.field === field && s.dir === 'asc'
      ? { field, dir: 'desc' }
      : { field, dir: 'asc' }
  )
  const sortIcon = field => sort.field === field ? (sort.dir === 'asc' ? ' ↑' : ' ↓') : ''

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = prospects.filter(p => p.status === s).length
    return acc
  }, {})

  // Inline status change
  const handleStatusChange = async (id, newStatus) => {
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p))
    setEditStatus(null)
    const fd = new FormData()
    fd.set('id', id)
    fd.set('status', newStatus)
    await updateStatus(fd)
    refresh()
  }

  // Kanban drag-drop
  const handleKanbanDrop = async (prospectId, newStatus) => {
    setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, status: newStatus } : p))
    const fd = new FormData()
    fd.set('id', prospectId)
    fd.set('status', newStatus)
    await updateStatus(fd)
    refresh()
  }

  return (
    <>
      <div className={styles.page}>

        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.brand}>KJAH</span>
            <span className={styles.appName}>· Prospecting</span>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.viewToggle}>
              <button className={`${styles.viewBtn} ${view === 'table'  ? styles.viewActive : ''}`} onClick={() => setView('table')}>Table</button>
              <button className={`${styles.viewBtn} ${view === 'kanban' ? styles.viewActive : ''}`} onClick={() => setView('kanban')}>Kanban</button>
            </div>
            <Link href="/dashboard/scraper" className={styles.scraperBtn}>Scraper</Link>
            <button className={styles.addBtn} onClick={() => setPanel('new')}>+ Add</button>
            <form action={logout}>
              <button type="submit" className={styles.logoutBtn}>Log out</button>
            </form>
          </div>
        </header>

        {/* Stats */}
        <div className={styles.stats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{prospects.length}</span>
            <span className={styles.statLbl}>Total</span>
          </div>
          <div className={styles.statGroup}>
            {Object.entries(counts).map(([s, n]) => (
              <div key={s} className={styles.stat}>
                <span className={`${styles.statNum} ${styles[`stat_${s}`]}`}>{n}</span>
                <span className={styles.statLbl}>{STATUS_LABEL[s]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.filters}>
            {['all', ...STATUSES].map(s => (
              <button
                key={s}
                className={`${styles.filterTab} ${filter === s ? styles.filterActive : ''}`}
                onClick={() => setFilter(s)}
              >
                {s === 'all' ? 'All' : STATUS_LABEL[s]}
              </button>
            ))}
          </div>
          <input
            type="text"
            className={styles.search}
            placeholder="SEARCH..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Kanban view */}
        {view === 'kanban' ? (
          <KanbanBoard
            prospects={prospects}
            search={search}
            onDrop={handleKanbanDrop}
            onEdit={p => setPanel(p)}
            onDelete={p => setConfirm(p)}
          />

        /* Empty state */
        ) : visible.length === 0 ? (
          <div className={styles.empty}>
            <p>
              {search
                ? `No results for "${search}"`
                : filter !== 'all'
                ? `No ${STATUS_LABEL[filter]} prospects.`
                : 'No prospects yet.'}
            </p>
            {!search && filter === 'all' && (
              <button className={styles.addBtn} onClick={() => setPanel('new')}>
                Add your first prospect
              </button>
            )}
          </div>

        /* Table view */
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.sortable} onClick={() => toggleSort('name')}>Name / Business{sortIcon('name')}</th>
                  <th className={styles.sortable} onClick={() => toggleSort('contact')}>Contact{sortIcon('contact')}</th>
                  <th>Email</th>
                  <th>Website</th>
                  <th className={styles.sortable} onClick={() => toggleSort('status')}>Status{sortIcon('status')}</th>
                  <th className={styles.sortable} onClick={() => toggleSort('followUp')}>Follow-up{sortIcon('followUp')}</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map(p => (
                  <tr key={p.id} className={deletingId === p.id ? styles.rowDeleting : ''}>
                    <td className={styles.nameTd} onClick={() => setPanel(p)} title="Open details">
                      <div className={styles.nameCell}>
                        <span className={`${styles.dot} ${styles[`dot_${p.priority || 'medium'}`]}`} />
                        <div className={styles.nameText}>
                          <div className={styles.name}>{p.name}</div>
                          <div className={styles.biz}>{p.business}</div>
                          {p.assignedTo && <div className={styles.assigned}>{p.assignedTo}</div>}
                          {(p.checks?.length ?? 0) > 0 && (
                            <div className={`${styles.checkBadge} ${p.checks.length === CHECKLIST_TOTAL ? styles.checkBadgeFull : ''}`}>
                              {p.checks.length}/{CHECKLIST_TOTAL} checks
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className={styles.contact}>{p.contact || '—'}</td>
                    <td className={styles.emailCell}>
                      {p.email
                        ? <a href={`mailto:${p.email}`} className={styles.websiteLink}>{p.email}</a>
                        : null}
                    </td>
                    <td className={styles.websiteCell}>
                      {p.website
                        ? <a href={p.website} target="_blank" rel="noopener noreferrer" className={styles.websiteLink}>
                            {p.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                          </a>
                        : <span className={styles.websiteEmpty}>No website</span>}
                    </td>
                    <td>
                      {editStatus === p.id ? (
                        <select
                          autoFocus
                          defaultValue={p.status}
                          className={styles.statusSelect}
                          onChange={e => handleStatusChange(p.id, e.target.value)}
                          onBlur={() => setEditStatus(null)}
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`${styles.badge} ${styles[`badge_${p.status}`]} ${styles.badgeClick}`}
                          onClick={() => setEditStatus(p.id)}
                          title="Click to change"
                        >
                          {STATUS_LABEL[p.status]}
                        </span>
                      )}
                    </td>
                    <td className={styles.date}>{formatDate(p.followUp)}</td>
                    <td className={styles.notes}>{p.notes || '—'}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button className={styles.editBtn}   onClick={() => setPanel(p)}>Edit</button>
                        <button className={styles.deleteBtn} onClick={() => setConfirm(p)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit panel */}
      {panel && (
        <ProspectPanel
          prospect={panel === 'new' ? null : panel}
          onClose={() => { setPanel(null); refresh() }}
        />
      )}

      {/* Delete confirm */}
      {confirm && (
        <div className={`${styles.overlay} ${styles.overlayVisible}`} onClick={() => setConfirm(null)}>
          <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <p className={styles.confirmText}>
              Delete <strong>{confirm.name}</strong>? This cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirm(null)}>Cancel</button>
              <form action={async fd => {
                setDeletingId(confirm.id)
                setConfirm(null)
                await new Promise(r => setTimeout(r, 260))
                setProspects(prev => prev.filter(p => p.id !== confirm.id))
                setDeletingId(null)
                await removeProspect(fd)
                refresh()
              }}>
                <input type="hidden" name="id" value={confirm.id} />
                <button type="submit" className={styles.deleteConfirmBtn}>Delete</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

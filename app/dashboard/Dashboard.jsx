'use client'
import { useState } from 'react'
import { removeProspect, logout } from './actions'
import ProspectPanel from './ProspectPanel'
import styles from './dashboard.module.css'

const STATUSES = ['all', 'cold', 'contacted', 'interested', 'converted', 'lost']

const STATUS_LABEL = {
  cold:       'Cold',
  contacted:  'Contacted',
  interested: 'Interested',
  converted:  'Converted',
  lost:       'Lost',
}

function formatDate(str) {
  if (!str) return '—'
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

export default function Dashboard({ prospects }) {
  const [filter, setFilter]   = useState('all')
  const [panel, setPanel]     = useState(null) // null | 'new' | prospect object
  const [confirm, setConfirm] = useState(null) // prospect to delete

  const visible = filter === 'all' ? prospects : prospects.filter(p => p.status === filter)

  const counts = STATUSES.slice(1).reduce((acc, s) => {
    acc[s] = prospects.filter(p => p.status === s).length
    return acc
  }, {})

  return (
    <>
      <div className={styles.page}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.brand}>KJAH</span>
            <span className={styles.appName}>Prospecting</span>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.addBtn} onClick={() => setPanel('new')}>+ Add Prospect</button>
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
          {Object.entries(counts).map(([s, n]) => (
            <div key={s} className={styles.stat}>
              <span className={`${styles.statNum} ${styles[`stat_${s}`]}`}>{n}</span>
              <span className={styles.statLbl}>{STATUS_LABEL[s]}</span>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {STATUSES.map(s => (
            <button
              key={s}
              className={`${styles.filterTab} ${filter === s ? styles.filterActive : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'all' ? 'All' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {/* Table */}
        {visible.length === 0 ? (
          <div className={styles.empty}>
            <p>No prospects yet{filter !== 'all' ? ` in "${STATUS_LABEL[filter]}"` : ''}.</p>
            {filter === 'all' && (
              <button className={styles.addBtn} onClick={() => setPanel('new')}>Add your first prospect</button>
            )}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Name / Business</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visible.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className={styles.name}>{p.name}</div>
                      <div className={styles.biz}>{p.business}</div>
                    </td>
                    <td className={styles.contact}>{p.contact || '—'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge_${p.status}`]}`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className={styles.date}>{formatDate(p.followUp)}</td>
                    <td className={styles.notes}>{p.notes || '—'}</td>
                    <td>
                      <div className={styles.rowActions}>
                        <button className={styles.editBtn} onClick={() => setPanel(p)}>Edit</button>
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
          onClose={() => setPanel(null)}
        />
      )}

      {/* Delete confirmation */}
      {confirm && (
        <div className={styles.overlay} onClick={() => setConfirm(null)}>
          <div className={styles.confirmBox} onClick={e => e.stopPropagation()}>
            <p className={styles.confirmText}>
              Delete <strong>{confirm.name}</strong>? This cannot be undone.
            </p>
            <div className={styles.confirmActions}>
              <button className={styles.cancelBtn} onClick={() => setConfirm(null)}>Cancel</button>
              <form action={removeProspect} onSubmit={() => setConfirm(null)}>
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

'use client'
import { useState } from 'react'
import styles from './kanban.module.css'

const STATUSES = ['cold', 'contacted', 'interested', 'converted', 'lost']
const STATUS_LABEL = {
  cold: 'Cold', contacted: 'Contacted', interested: 'Interested',
  converted: 'Converted', lost: 'Lost',
}

function formatDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-')
  return `${d}/${m}/${y}`
}

export default function KanbanBoard({ prospects, search, onDrop, onEdit, onDelete }) {
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)

  const filtered = search.trim()
    ? prospects.filter(p => {
        const q = search.toLowerCase()
        return p.name.toLowerCase().includes(q) || p.business.toLowerCase().includes(q)
      })
    : prospects

  const byStatus = STATUSES.reduce((acc, s) => {
    acc[s] = filtered.filter(p => p.status === s)
    return acc
  }, {})

  return (
    <div className={styles.board}>
      {STATUSES.map(status => (
        <div
          key={status}
          className={`${styles.column} ${dragOver === status ? styles.columnOver : ''}`}
          onDragOver={e => { e.preventDefault(); setDragOver(status) }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(null) }}
          onDrop={e => {
            e.preventDefault()
            if (dragging && dragging.status !== status) onDrop(dragging.id, status)
            setDragging(null)
            setDragOver(null)
          }}
        >
          <div className={styles.colHeader}>
            <span className={`${styles.colTitle} ${styles['col_' + status]}`}>
              {STATUS_LABEL[status]}
            </span>
            <span className={styles.colCount}>{byStatus[status].length}</span>
          </div>

          <div className={styles.cards}>
            {byStatus[status].length === 0 && (
              <div className={styles.emptyCol}>Drop here</div>
            )}
            {byStatus[status].map(p => (
              <div
                key={p.id}
                className={[
                  styles.card,
                  styles['card_' + (p.priority || 'medium')],
                  dragging?.id === p.id ? styles.cardDragging : '',
                ].filter(Boolean).join(' ')}
                draggable
                onDragStart={e => {
                  // Don't start a drag if the source is inside cardActions
                  if (e.target.closest('.' + styles.cardActions)) {
                    e.preventDefault()
                    return
                  }
                  setDragging(p)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragEnd={() => { setDragging(null); setDragOver(null) }}
                onClick={() => onEdit(p)}
              >
                <div className={styles.cardName}>{p.name}</div>
                <div className={styles.cardBiz}>{p.business}</div>
                {p.website && (
                  <a
                    className={styles.cardWebsite}
                    href={p.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => e.stopPropagation()}
                  >
                    {p.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                  </a>
                )}
                {p.contact  && <div className={styles.cardContact}>{p.contact}</div>}
                {p.followUp && <div className={styles.cardDate}>{formatDate(p.followUp)}</div>}
                {p.notes    && <div className={styles.cardNotes}>{p.notes}</div>}
                <div
                  className={styles.cardActions}
                  draggable={false}
                  onDragStart={e => { e.preventDefault(); e.stopPropagation() }}
                >
                  <button
                    className={styles.cardEdit}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation()
                      setDragging(null)
                      setDragOver(null)
                      onEdit(p)
                    }}
                  >Edit</button>
                  <button
                    className={styles.cardDelete}
                    onMouseDown={e => e.stopPropagation()}
                    onClick={e => {
                      e.stopPropagation()
                      setDragging(null)
                      setDragOver(null)
                      onDelete(p)
                    }}
                  >Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

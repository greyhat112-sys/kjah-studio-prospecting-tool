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
            <span className={`${styles.colTitle} ${styles[`col_${status}`]}`}>
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
                className={`${styles.card} ${dragging?.id === p.id ? styles.cardDragging : ''}`}
                draggable
                onDragStart={e => {
                  setDragging(p)
                  e.dataTransfer.effectAllowed = 'move'
                }}
                onDragEnd={() => setDragging(null)}
              >
                <div className={styles.cardName}>{p.name}</div>
                <div className={styles.cardBiz}>{p.business}</div>
                {p.contact  && <div className={styles.cardContact}>{p.contact}</div>}
                {p.followUp && <div className={styles.cardDate}>{formatDate(p.followUp)}</div>}
                {p.notes    && <div className={styles.cardNotes}>{p.notes}</div>}
                <div className={styles.cardActions}>
                  <button className={styles.cardEdit}   onClick={() => onEdit(p)}>Edit</button>
                  <button className={styles.cardDelete} onClick={() => onDelete(p)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

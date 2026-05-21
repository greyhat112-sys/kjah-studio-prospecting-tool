'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import styles from './dropdown.module.css'

export default function Dropdown({ name, value, onChange, options, placeholder = 'Select…' }) {
  const [open, setOpen]       = useState(false)
  const [pos, setPos]         = useState({ top: 0, left: 0, width: 0 })
  const [mounted, setMounted] = useState(false)
  const triggerRef            = useRef(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    const onMouse = e => {
      if (!triggerRef.current?.closest('[data-dd]')?.contains(e.target)) setOpen(false)
    }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onMouse)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouse)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const toggle = () => {
    if (!open && triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPos({ top: r.bottom + 4, left: r.left, width: r.width })
    }
    setOpen(o => !o)
  }

  const selected = options.find(o => o.value === value)

  return (
    <div data-dd="" style={{ position: 'relative' }}>
      <input type="hidden" name={name} value={value ?? ''} />
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${open ? styles.open : ''}`}
        onClick={toggle}
      >
        <span className={selected ? styles.val : styles.placeholder}>
          {selected?.label ?? placeholder}
        </span>
        <span className={styles.caret}>{open ? '▲' : '▼'}</span>
      </button>

      {open && mounted && createPortal(
        <div className={styles.list} style={{ top: pos.top, left: pos.left, width: pos.width }}>
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`${styles.option} ${value === opt.value ? styles.active : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false) }}
            >
              {opt.label}
              {value === opt.value && <span className={styles.check}>✓</span>}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

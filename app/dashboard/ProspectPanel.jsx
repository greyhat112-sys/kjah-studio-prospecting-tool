'use client'
import { useActionState, useEffect } from 'react'
import { createProspect, editProspect } from './actions'
import styles from './dashboard.module.css'

const STATUSES = ['cold', 'contacted', 'interested', 'converted', 'lost']

export default function ProspectPanel({ prospect, onClose }) {
  const action = prospect ? editProspect : createProspect
  const [state, formAction, pending] = useActionState(action, null)

  useEffect(() => {
    if (state?.success) onClose()
  }, [state])

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <aside className={styles.panel}>
        <div className={styles.panelHead}>
          <h2 className={styles.panelTitle}>{prospect ? 'Edit Prospect' : 'Add Prospect'}</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">[ X ]</button>
        </div>

        <form action={formAction} className={styles.panelForm}>
          {prospect && <input type="hidden" name="id" value={prospect.id} />}

          <label className={styles.fieldLabel}>
            Name <span className={styles.req}>*</span>
            <input
              name="name"
              defaultValue={prospect?.name ?? ''}
              className={styles.field}
              placeholder="e.g. John Doe"
              required
            />
          </label>

          <label className={styles.fieldLabel}>
            Business / Brand <span className={styles.req}>*</span>
            <input
              name="business"
              defaultValue={prospect?.business ?? ''}
              className={styles.field}
              placeholder="e.g. Acme Corp"
              required
            />
          </label>

          <label className={styles.fieldLabel}>
            Contact (email / phone / social)
            <input
              name="contact"
              defaultValue={prospect?.contact ?? ''}
              className={styles.field}
              placeholder="e.g. @handle or email@example.com"
            />
          </label>

          <label className={styles.fieldLabel}>
            Status
            <select name="status" defaultValue={prospect?.status ?? 'cold'} className={styles.field}>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </label>

          <label className={styles.fieldLabel}>
            Follow-up Date
            <input
              type="date"
              name="followUp"
              defaultValue={prospect?.followUp ?? ''}
              className={styles.field}
            />
          </label>

          <label className={styles.fieldLabel}>
            Notes
            <textarea
              name="notes"
              defaultValue={prospect?.notes ?? ''}
              className={`${styles.field} ${styles.textarea}`}
              placeholder="Any relevant notes…"
              rows={4}
            />
          </label>

          {state?.error && <p className={styles.formError}>{state.error}</p>}

          <div className={styles.panelActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={pending}>
              {pending ? 'Saving…' : prospect ? 'Save Changes' : 'Add Prospect'}
            </button>
          </div>
        </form>
      </aside>
    </div>
  )
}

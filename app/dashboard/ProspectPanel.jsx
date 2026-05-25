'use client'
import { useState, useEffect, useRef } from 'react'
import { useActionState } from 'react'
import { createProspect, editProspect, addActivity } from './actions'
import Dropdown from './Dropdown'
import { CHECKLIST, CHECKLIST_GROUPS } from './checklist'
import styles from './dashboard.module.css'

const STATUS_OPTIONS = [
  { value: 'cold',       label: 'Cold' },
  { value: 'qualified',  label: 'Qualified' },
  { value: 'contacted',  label: 'Contacted' },
  { value: 'interested', label: 'Interested' },
  { value: 'converted',  label: 'Converted' },
  { value: 'lost',       label: 'Lost' },
]
const PRIORITY_OPTIONS = [
  { value: 'high',   label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low',    label: 'Low' },
]
const SOURCE_OPTIONS = [
  { value: '',            label: 'Unknown' },
  { value: 'google-maps', label: 'Google Maps' },
  { value: 'instagram',   label: 'Instagram' },
  { value: 'facebook',    label: 'Facebook' },
  { value: 'linkedin',    label: 'LinkedIn' },
  { value: 'referral',    label: 'Referral' },
  { value: 'cold-dm',     label: 'Cold DM' },
  { value: 'cold-email',  label: 'Cold Email' },
  { value: 'other',       label: 'Other' },
]
const SERVICE_OPTIONS = [
  { value: '',             label: 'Not specified' },
  { value: 'website',      label: 'Website' },
  { value: 'funnel',       label: 'Funnel' },
  { value: 'automation',   label: 'Automation' },
  { value: 'full-package', label: 'Full Package' },
  { value: 'other',        label: 'Other' },
]

function fmtDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

export default function ProspectPanel({ prospect, onClose }) {
  const action = prospect ? editProspect : createProspect
  const [state, formAction, pending]               = useActionState(action, null)
  const [activityState, activityAction, actPending] = useActionState(addActivity, null)

  // Slide animation
  const [entered, setEntered] = useState(false)
  const [closing, setClosing] = useState(false)

  // Dropdown controlled state
  const [status,   setStatus]   = useState(prospect?.status   ?? 'cold')
  const [priority, setPriority] = useState(prospect?.priority ?? 'medium')
  const [source,   setSource]   = useState(prospect?.source   ?? '')
  const [service,  setService]  = useState(prospect?.service  ?? '')

  // Activity local state (optimistic)
  const [localActivity, setLocalActivity] = useState(prospect?.activity ?? [])
  const [activityText, setActivityText]   = useState('')

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [])

  const handleClose = () => {
    setClosing(true)
    setTimeout(onClose, 280)
  }

  useEffect(() => { if (state?.success) handleClose() }, [state])

  useEffect(() => {
    if (activityState?.success && activityState.entry) {
      setLocalActivity(prev => [activityState.entry, ...prev])
      setActivityText('')
    }
  }, [activityState])

  const panelClass = [
    styles.panel,
    entered && !closing ? styles.panelEntered : '',
    closing ? styles.panelClosing : '',
  ].join(' ')

  const overlayClass = [
    styles.overlay,
    entered && !closing ? styles.overlayVisible : '',
  ].join(' ')

  return (
    <div className={overlayClass} onClick={e => e.target === e.currentTarget && handleClose()}>
      <aside className={panelClass}>

        <div className={styles.panelHead}>
          <p className={styles.panelTitle}>{prospect ? 'Edit Prospect' : 'Add Prospect'}</p>
          <button className={styles.closeBtn} onClick={handleClose}>[ X ]</button>
        </div>

        {/* Main form */}
        <form action={formAction} className={styles.panelForm}>
          {prospect && <input type="hidden" name="id" value={prospect.id} />}

          <label className={styles.fieldLabel}>
            Name <span className={styles.req}>*</span>
            <input name="name" defaultValue={prospect?.name ?? ''} className={styles.field} placeholder="e.g. John Doe" required />
          </label>

          <label className={styles.fieldLabel}>
            Business / Brand <span className={styles.req}>*</span>
            <input name="business" defaultValue={prospect?.business ?? ''} className={styles.field} placeholder="e.g. Acme Corp" required />
          </label>

          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>
              Contact
              <input name="contact" defaultValue={prospect?.contact ?? ''} className={styles.field} placeholder="@handle · phone" />
            </label>
            <label className={styles.fieldLabel}>
              Email
              <input type="email" name="email" defaultValue={prospect?.email ?? ''} className={styles.field} placeholder="name@company.com" />
            </label>
          </div>

          <label className={styles.fieldLabel}>
            Website
            <input name="website" defaultValue={prospect?.website ?? ''} className={styles.field} placeholder="https://example.com" />
          </label>

          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>
              Status
              <Dropdown name="status" value={status} onChange={setStatus} options={STATUS_OPTIONS} />
            </label>
            <label className={styles.fieldLabel}>
              Priority
              <Dropdown name="priority" value={priority} onChange={setPriority} options={PRIORITY_OPTIONS} />
            </label>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>
              Source
              <Dropdown name="source" value={source} onChange={setSource} options={SOURCE_OPTIONS} placeholder="Select source…" />
            </label>
            <label className={styles.fieldLabel}>
              Service
              <Dropdown name="service" value={service} onChange={setService} options={SERVICE_OPTIONS} placeholder="Select service…" />
            </label>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.fieldLabel}>
              Assigned To
              <input name="assignedTo" defaultValue={prospect?.assignedTo ?? ''} className={styles.field} placeholder="Team member" />
            </label>
            <label className={styles.fieldLabel}>
              Follow-up Date
              <input type="date" name="followUp" defaultValue={prospect?.followUp ?? ''} className={styles.field} />
            </label>
          </div>

          <label className={styles.fieldLabel}>
            Notes
            <textarea name="notes" defaultValue={prospect?.notes ?? ''} className={`${styles.field} ${styles.textarea}`} rows={3} placeholder="Any relevant notes…" />
          </label>

          <div className={styles.fieldLabel}>
            Audit Checklist
            <div className={styles.checks}>
              {CHECKLIST_GROUPS.map(group => (
                <div key={group.id} className={styles.checksGroup}>
                  <p className={styles.checksGroupLabel}>{group.label}</p>
                  {CHECKLIST.filter(c => c.group === group.id).map(item => (
                    <label key={item.id} className={styles.checkItem}>
                      <input
                        type="checkbox"
                        name="checks"
                        value={item.id}
                        defaultChecked={prospect?.checks?.includes(item.id) ?? false}
                      />
                      <span>{item.label}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {state?.error && <p className={styles.formError}>{state.error}</p>}

          <div className={styles.panelActions}>
            <button type="button" className={styles.cancelBtn} onClick={handleClose}>Cancel</button>
            <button type="submit" className={styles.saveBtn} disabled={pending}>
              {pending ? 'Saving…' : prospect ? 'Save Changes' : 'Add Prospect'}
            </button>
          </div>
        </form>

        {/* Activity log — edit mode only */}
        {prospect && (
          <div className={styles.activitySection}>
            <p className={styles.activityTitle}>Activity Log</p>

            <form action={activityAction} className={styles.activityForm}>
              <input type="hidden" name="id" value={prospect.id} />
              <input
                name="activityText"
                value={activityText}
                onChange={e => setActivityText(e.target.value)}
                className={styles.activityInput}
                placeholder="Add a note…"
                required
              />
              <button type="submit" className={styles.activityBtn} disabled={actPending}>
                {actPending ? '…' : 'Add'}
              </button>
            </form>

            {activityState?.error && <p className={styles.formError}>{activityState.error}</p>}

            <div className={styles.activityList}>
              {localActivity.length === 0 ? (
                <p className={styles.activityEmpty}>No activity yet.</p>
              ) : localActivity.map((entry, i) => (
                <div key={i} className={styles.activityEntry}>
                  <p className={styles.activityText}>{entry.text}</p>
                  <p className={styles.activityTime}>{fmtDate(entry.at)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </aside>
    </div>
  )
}

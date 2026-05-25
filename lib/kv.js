import { createClient } from '@supabase/supabase-js'

// In-memory fallback for local dev (no Supabase credentials needed)
const devStore = new Map()

function getClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!process.env.SUPABASE_URL || !key) return null
  return createClient(process.env.SUPABASE_URL, key)
}

// Remove "tofu" characters that render as empty squares: C0/C1 control
// chars, DEL, the Unicode replacement char, and the Private Use Area
// (Google Maps address data sometimes carries a private-use icon glyph).
// Tab, newline and carriage return are intentionally preserved.
function sanitizeText(str) {
  if (!str) return ''
  return Array.from(str).filter(ch => {
    const c = ch.codePointAt(0)
    if (c === 9 || c === 10 || c === 13) return true   // keep tab, LF, CR
    if (c < 32) return false                           // C0 control chars
    if (c >= 127 && c <= 159) return false             // DEL + C1 control chars
    if (c === 0xFFFD) return false                     // replacement char
    if (c >= 0xE000 && c <= 0xF8FF) return false       // Private Use Area
    if (c >= 0xF0000) return false                     // supplementary PUA
    return true
  }).join('').trim()
}

function toProspect(row) {
  return {
    id:         row.id,
    name:       row.name,
    business:   row.business,
    contact:    row.contact     ?? '',
    email:      row.email       ?? '',
    website:    row.website     ?? '',
    status:     row.status      ?? 'cold',
    priority:   row.priority    ?? 'medium',
    source:     row.source      ?? '',
    service:    row.service     ?? '',
    assignedTo: row.assigned_to ?? '',
    followUp:   row.follow_up   ?? '',
    notes:      sanitizeText(row.notes ?? ''),
    checks:     Array.isArray(row.checks)   ? row.checks   : [],
    activity:   Array.isArray(row.activity) ? row.activity : [],
    createdAt:  row.created_at,
    updatedAt:  row.updated_at,
  }
}

export async function getProspects() {
  const sb = getClient()
  if (!sb) return devStore.get('prospects') ?? []
  const { data } = await sb.from('prospects').select('*').order('created_at', { ascending: false })
  return (data ?? []).map(toProspect)
}

export async function addProspect(fields) {
  const sb = getClient()
  const row = {
    name:        fields.name,
    business:    fields.business,
    contact:     fields.contact    || null,
    email:       fields.email      || null,
    website:     fields.website    || null,
    status:      fields.status     || 'cold',
    priority:    fields.priority   || 'medium',
    source:      fields.source     || null,
    service:     fields.service    || null,
    assigned_to: fields.assignedTo || null,
    follow_up:   fields.followUp   || null,
    notes:       fields.notes      || null,
    checks:      Array.isArray(fields.checks) ? fields.checks : [],
  }
  if (!sb) {
    const prospect = { id: crypto.randomUUID(), ...fields, createdAt: new Date().toISOString() }
    const list = devStore.get('prospects') ?? []
    devStore.set('prospects', [prospect, ...list])
    return prospect
  }
  const { data } = await sb.from('prospects').insert(row).select().single()
  return toProspect(data)
}

export async function updateProspect(id, fields) {
  const sb = getClient()
  if (!sb) {
    const list = (devStore.get('prospects') ?? []).map(p =>
      p.id === id ? { ...p, ...fields, updatedAt: new Date().toISOString() } : p
    )
    devStore.set('prospects', list)
    return
  }
  // Only update fields that were explicitly provided (supports partial updates)
  const patch = { updated_at: new Date().toISOString() }
  if (fields.name     !== undefined) patch.name      = fields.name
  if (fields.business !== undefined) patch.business  = fields.business
  if (fields.contact    !== undefined) patch.contact     = fields.contact    || null
  if (fields.email      !== undefined) patch.email       = fields.email      || null
  if (fields.website    !== undefined) patch.website     = fields.website    || null
  if (fields.status     !== undefined) patch.status      = fields.status
  if (fields.priority   !== undefined) patch.priority    = fields.priority   || 'medium'
  if (fields.source     !== undefined) patch.source      = fields.source     || null
  if (fields.service    !== undefined) patch.service     = fields.service    || null
  if (fields.assignedTo !== undefined) patch.assigned_to = fields.assignedTo || null
  if (fields.followUp   !== undefined) patch.follow_up   = fields.followUp   || null
  if (fields.notes      !== undefined) patch.notes       = fields.notes      || null
  if (fields.checks     !== undefined) patch.checks      = Array.isArray(fields.checks) ? fields.checks : []
  if (fields.activity   !== undefined) patch.activity    = fields.activity
  await sb.from('prospects').update(patch).eq('id', id)
}

export async function deleteProspect(id) {
  const sb = getClient()
  if (!sb) {
    devStore.set('prospects', (devStore.get('prospects') ?? []).filter(p => p.id !== id))
    return
  }
  await sb.from('prospects').delete().eq('id', id)
}

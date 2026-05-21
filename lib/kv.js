import { createClient } from '@supabase/supabase-js'

// In-memory fallback for local dev (no Supabase credentials needed)
const devStore = new Map()

function getClient() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
}

function toProspect(row) {
  return {
    id:         row.id,
    name:       row.name,
    business:   row.business,
    contact:    row.contact     ?? '',
    website:    row.website     ?? '',
    status:     row.status      ?? 'cold',
    priority:   row.priority    ?? 'medium',
    source:     row.source      ?? '',
    service:    row.service     ?? '',
    assignedTo: row.assigned_to ?? '',
    followUp:   row.follow_up   ?? '',
    notes:      row.notes       ?? '',
    activity:   row.activity    ?? [],
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
    website:     fields.website    || null,
    status:      fields.status     || 'cold',
    priority:    fields.priority   || 'medium',
    source:      fields.source     || null,
    service:     fields.service    || null,
    assigned_to: fields.assignedTo || null,
    follow_up:   fields.followUp   || null,
    notes:       fields.notes      || null,
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
  if (fields.website    !== undefined) patch.website     = fields.website    || null
  if (fields.status     !== undefined) patch.status      = fields.status
  if (fields.priority   !== undefined) patch.priority    = fields.priority   || 'medium'
  if (fields.source     !== undefined) patch.source      = fields.source     || null
  if (fields.service    !== undefined) patch.service     = fields.service    || null
  if (fields.assignedTo !== undefined) patch.assigned_to = fields.assignedTo || null
  if (fields.followUp   !== undefined) patch.follow_up   = fields.followUp   || null
  if (fields.notes      !== undefined) patch.notes       = fields.notes      || null
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

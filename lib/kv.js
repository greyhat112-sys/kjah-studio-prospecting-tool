import { kv } from '@vercel/kv'

const KEY = 'prospects'

export async function getProspects() {
  const data = await kv.get(KEY)
  return data ?? []
}

export async function addProspect(fields) {
  const prospects = await getProspects()
  const prospect = {
    id: crypto.randomUUID(),
    ...fields,
    createdAt: new Date().toISOString(),
  }
  await kv.set(KEY, [prospect, ...prospects])
  return prospect
}

export async function updateProspect(id, fields) {
  const prospects = await getProspects()
  const updated = prospects.map(p =>
    p.id === id ? { ...p, ...fields, updatedAt: new Date().toISOString() } : p
  )
  await kv.set(KEY, updated)
}

export async function deleteProspect(id) {
  const prospects = await getProspects()
  await kv.set(KEY, prospects.filter(p => p.id !== id))
}

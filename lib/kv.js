const KEY = 'prospects'

// In-memory fallback for local dev (no KV credentials needed)
const devStore = new Map()

async function getKv() {
  if (!process.env.KV_REST_API_URL) return null
  const { kv } = await import('@vercel/kv')
  return kv
}

export async function getProspects() {
  const kv = await getKv()
  if (!kv) return devStore.get(KEY) ?? []
  return (await kv.get(KEY)) ?? []
}

export async function addProspect(fields) {
  const prospects = await getProspects()
  const prospect = {
    id: crypto.randomUUID(),
    ...fields,
    createdAt: new Date().toISOString(),
  }
  const next = [prospect, ...prospects]
  const kv = await getKv()
  if (kv) await kv.set(KEY, next)
  else devStore.set(KEY, next)
  return prospect
}

export async function updateProspect(id, fields) {
  const prospects = await getProspects()
  const next = prospects.map(p =>
    p.id === id ? { ...p, ...fields, updatedAt: new Date().toISOString() } : p
  )
  const kv = await getKv()
  if (kv) await kv.set(KEY, next)
  else devStore.set(KEY, next)
}

export async function deleteProspect(id) {
  const prospects = await getProspects()
  const next = prospects.filter(p => p.id !== id)
  const kv = await getKv()
  if (kv) await kv.set(KEY, next)
  else devStore.set(KEY, next)
}

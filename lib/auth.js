async function computeToken() {
  const secret = (process.env.ADMIN_PASSWORD ?? '') + (process.env.SESSION_SECRET ?? '')
  const data = new TextEncoder().encode(secret)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function verifySession(token) {
  if (!token) return false
  const expected = await computeToken()
  return token === expected
}

export { computeToken as createSessionToken }

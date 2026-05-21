import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/auth'
import { getProspects } from '@/lib/kv'
import ScraperPage from './ScraperPage'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!await verifySession(token)) redirect('/login')

  const all = await getProspects()
  const scraped = all
    .filter(p => p.source === 'google-maps')
    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))

  return <ScraperPage prospects={scraped} />
}

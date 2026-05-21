import { getProspects } from '@/lib/kv'
import Dashboard from './Dashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const prospects = await getProspects()
  return <Dashboard prospects={prospects} />
}

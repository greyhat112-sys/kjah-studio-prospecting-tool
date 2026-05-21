import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifySession } from '@/lib/auth'

export default async function Root() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  const valid = await verifySession(session)
  redirect(valid ? '/dashboard' : '/login')
}

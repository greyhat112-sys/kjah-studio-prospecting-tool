'use server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createSessionToken } from '@/lib/auth'

export async function login(prevState, formData) {
  const password = formData.get('password')

  if (password !== process.env.ADMIN_PASSWORD) {
    return { error: 'Incorrect password.' }
  }

  const token = await createSessionToken()
  const cookieStore = await cookies()
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  redirect('/dashboard')
}

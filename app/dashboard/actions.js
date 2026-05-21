'use server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { addProspect, updateProspect, deleteProspect } from '@/lib/kv'

export async function createProspect(prevState, formData) {
  const fields = {
    name:       formData.get('name')?.trim(),
    business:   formData.get('business')?.trim(),
    contact:    formData.get('contact')?.trim(),
    status:     formData.get('status') || 'cold',
    followUp:   formData.get('followUp') || '',
    notes:      formData.get('notes')?.trim() || '',
  }

  if (!fields.name || !fields.business) {
    return { error: 'Name and business are required.' }
  }

  await addProspect(fields)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function editProspect(prevState, formData) {
  const id = formData.get('id')
  const fields = {
    name:     formData.get('name')?.trim(),
    business: formData.get('business')?.trim(),
    contact:  formData.get('contact')?.trim(),
    status:   formData.get('status') || 'cold',
    followUp: formData.get('followUp') || '',
    notes:    formData.get('notes')?.trim() || '',
  }

  if (!fields.name || !fields.business) {
    return { error: 'Name and business are required.' }
  }

  await updateProspect(id, fields)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function removeProspect(formData) {
  const id = formData.get('id')
  await deleteProspect(id)
  revalidatePath('/dashboard')
}

export async function updateStatus(formData) {
  const id     = formData.get('id')
  const status = formData.get('status')
  await updateProspect(id, { status })
  revalidatePath('/dashboard')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  redirect('/login')
}

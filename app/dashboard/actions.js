'use server'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { addProspect, updateProspect, deleteProspect, getProspects } from '@/lib/kv'

function extractFields(formData) {
  return {
    name:       formData.get('name')?.trim(),
    business:   formData.get('business')?.trim(),
    contact:    formData.get('contact')?.trim()    || '',
    website:    formData.get('website')?.trim()    || '',
    status:     formData.get('status')             || 'cold',
    priority:   formData.get('priority')           || 'medium',
    source:     formData.get('source')             || '',
    service:    formData.get('service')            || '',
    assignedTo: formData.get('assignedTo')?.trim() || '',
    followUp:   formData.get('followUp')           || '',
    notes:      formData.get('notes')?.trim()      || '',
  }
}

export async function createProspect(prevState, formData) {
  const fields = extractFields(formData)
  if (!fields.name || !fields.business) return { error: 'Name and business are required.' }
  await addProspect(fields)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function editProspect(prevState, formData) {
  const id = formData.get('id')
  const fields = extractFields(formData)
  if (!fields.name || !fields.business) return { error: 'Name and business are required.' }
  await updateProspect(id, fields)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function addActivity(prevState, formData) {
  const id   = formData.get('id')
  const text = formData.get('activityText')?.trim()
  if (!text) return { error: 'Note cannot be empty.' }

  const prospects = await getProspects()
  const prospect  = prospects.find(p => p.id === id)
  if (!prospect) return { error: 'Prospect not found.' }

  const prev     = Array.isArray(prospect.activity) ? prospect.activity : []
  const entry    = { text, at: new Date().toISOString() }
  const activity = [entry, ...prev]

  await updateProspect(id, { activity })
  revalidatePath('/dashboard')
  return { success: true, entry }
}

export async function updateStatus(formData) {
  const id     = formData.get('id')
  const status = formData.get('status')
  await updateProspect(id, { status })
  revalidatePath('/dashboard')
}

export async function removeProspect(formData) {
  const id = formData.get('id')
  await deleteProspect(id)
  revalidatePath('/dashboard')
}

export async function logout() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
  redirect('/login')
}

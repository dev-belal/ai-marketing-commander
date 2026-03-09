'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type ClientActionState = {
  error: string | null
  success: boolean
}

export async function addClient(
  _prevState: ClientActionState,
  formData: FormData
): Promise<ClientActionState> {
  const name = formData.get('name') as string
  const websiteUrl = formData.get('websiteUrl') as string
  const industry = formData.get('industry') as string

  if (!name?.trim()) {
    return { error: 'Client name is required.', success: false }
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in.', success: false }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { error: 'User profile not found.', success: false }
  }

  const { error } = await supabase.from('clients').insert({
    agency_id: profile.agency_id,
    name: name.trim(),
    website_url: websiteUrl?.trim() || null,
    industry: industry || null,
  })

  if (error) {
    return { error: 'Failed to create client.', success: false }
  }

  revalidatePath('/clients')
  revalidatePath('/dashboard')

  return { error: null, success: true }
}

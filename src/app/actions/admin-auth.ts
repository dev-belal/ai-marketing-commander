'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AdminAuthState = {
  error: string | null
}

export async function adminSignIn(
  _prevState: AdminAuthState,
  formData: FormData
): Promise<AdminAuthState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL
  if (!superAdminEmail || email !== superAdminEmail) {
    return { error: 'Access denied.' }
  }

  const supabase = await createClient()

  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError) {
    return { error: 'Invalid credentials.' }
  }

  redirect('/admin')
}

import { Suspense } from 'react'
import { ForgotPasswordForm } from '@/components/app/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}

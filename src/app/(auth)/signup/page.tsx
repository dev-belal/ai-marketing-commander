import { Suspense } from 'react'
import { SignupForm } from '@/components/app/signup-form'

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}

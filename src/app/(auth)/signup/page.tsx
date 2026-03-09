'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { requestAccess, type RequestAccessState } from '@/app/actions/invite-request'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2Icon } from 'lucide-react'

const initialState: RequestAccessState = { error: null, success: false }

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(requestAccess, initialState)

  if (state.success) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <div className="flex size-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2Icon className="size-8 text-green-600" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Request received!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              We&apos;ll review your request and email you within 24 hours.
            </p>
          </div>
          <Link href="/login">
            <Button variant="outline" className="mt-2">
              Back to login
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Request Access</CardTitle>
        <CardDescription>
          Tell us about your agency and we&apos;ll get you set up
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="flex flex-col gap-4">
          {state.error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Jane Smith"
              required
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@agency.com"
              required
              disabled={isPending}
              autoComplete="email"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Account type</Label>
            <div className="grid grid-cols-2 gap-3">
              <label
                htmlFor="account-solo"
                className="flex cursor-pointer flex-col gap-1 rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="account-solo"
                    name="accountType"
                    value="solo"
                    defaultChecked
                    disabled={isPending}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium">Solo</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Just me, managing clients
                </p>
              </label>
              <label
                htmlFor="account-team"
                className="flex cursor-pointer flex-col gap-1 rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="account-team"
                    name="accountType"
                    value="team"
                    disabled={isPending}
                    className="accent-primary"
                  />
                  <span className="text-sm font-medium">Team</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Multiple team members
                </p>
              </label>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="company">Company name</Label>
            <Input
              id="company"
              name="company"
              type="text"
              placeholder="Acme Marketing"
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reason">Why do you want access?</Label>
            <Textarea
              id="reason"
              name="reason"
              placeholder="Tell us about your agency and what you're looking for..."
              rows={3}
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isPending}
          >
            {isPending ? 'Submitting...' : 'Request Access'}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary underline-offset-4 hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}

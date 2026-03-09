import { createAdminClient } from '@/lib/supabase/admin'
import { InviteAcceptForm } from '@/components/app/invite-accept-form'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { ShieldXIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type InvitePageProps = {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params

  const admin = createAdminClient()

  const { data: invite } = await admin
    .from('invites')
    .select('id, email, account_type, used_at, expires_at, request_id')
    .eq('token', token)
    .single()

  // Check for invalid/expired/used invite
  const isInvalid = !invite
  const isUsed = invite?.used_at !== null && invite?.used_at !== undefined
  const isExpired = invite ? new Date(invite.expires_at) < new Date() : false

  if (isInvalid || isUsed || isExpired) {
    const message = isUsed
      ? 'This invite has already been used.'
      : isExpired
        ? 'This invite has expired. Please request access again.'
        : 'Invalid invite link.'

    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
                <ShieldXIcon className="size-8 text-destructive" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold">Invalid Invite</h2>
                <p className="mt-1 text-sm text-muted-foreground">{message}</p>
              </div>
              <Link href="/signup">
                <Button variant="outline" className="mt-2">
                  Request new access
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Get name from the invite request
  let defaultName = ''
  if (invite.request_id) {
    const { data: request } = await admin
      .from('invite_requests')
      .select('name')
      .eq('id', invite.request_id)
      .single()

    if (request?.name) {
      defaultName = request.name
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-8">
      <div className="w-full max-w-md">
        <InviteAcceptForm
          token={token}
          email={invite.email}
          defaultName={defaultName}
        />
      </div>
    </div>
  )
}

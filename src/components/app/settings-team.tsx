'use client'

import { useActionState, useEffect, useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import {
  updateMemberRole,
  removeMember,
  type SettingsActionState,
} from '@/app/actions/settings'
import { inviteTeamMember } from '@/app/actions/team'
import {
  MoreVerticalIcon,
  PlusIcon,
  ShieldIcon,
  UserIcon,
  UserMinusIcon,
} from 'lucide-react'

type TeamMember = {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

const ROLE_BADGE_VARIANT: Record<string, 'default' | 'secondary'> = {
  owner: 'default',
  admin: 'default',
  lead: 'secondary',
  member: 'secondary',
}

const initialInviteState: { error: string | null; success: boolean } = { error: null, success: false }

function SettingsTeam({
  members,
  currentUserId,
}: {
  members: TeamMember[]
  currentUserId: string
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <InviteMemberDialog />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Team Members ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isCurrentUser={member.id === currentUserId}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function InviteMemberDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(inviteTeamMember, initialInviteState)

  useEffect(() => {
    if (state.success) {
      setOpen(false)
      toast.success('Invite request submitted. We\'ll notify you when it\'s approved.')
    }
  }, [state.success])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        <span>Invite Member</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Invite requests are reviewed before being sent.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction}>
          <div className="space-y-4">
            {state.error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {state.error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="settings-invite-email">Email</Label>
              <Input
                id="settings-invite-email"
                name="email"
                type="email"
                placeholder="teammate@agency.com"
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-invite-role">Role</Label>
              <select
                id="settings-invite-role"
                name="role"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                disabled={isPending}
              >
                <option value="member">Member</option>
                <option value="lead">Lead</option>
              </select>
              <p className="text-xs text-muted-foreground">
                Leads can edit and delete clients. Members can view and add clients.
              </p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Submitting...' : 'Submit Invite Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function MemberRow({
  member,
  isCurrentUser,
}: {
  member: TeamMember
  isCurrentUser: boolean
}) {
  const [isPending, startTransition] = useTransition()

  const date = new Date(member.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const isOwner = member.role === 'owner'
  const isAdmin = member.role === 'admin'

  function handleChangeRole(newRole: string) {
    startTransition(async () => {
      const result = await updateMemberRole(member.id, newRole)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Updated ${member.full_name ?? member.email} to ${newRole}`)
      }
    })
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await removeMember(member.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Removed ${member.full_name ?? member.email}`)
      }
    })
  }

  const initials = (member.full_name ?? member.email)
    .split(/[\s@]/)
    .slice(0, 2)
    .map((s) => s.charAt(0).toUpperCase())
    .join('')

  return (
    <div className="flex items-center justify-between rounded-lg border p-3">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
          {initials}
        </div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">
              {member.full_name ?? member.email}
            </p>
            {isCurrentUser && (
              <span className="text-[10px] text-muted-foreground">(you)</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {member.email} &middot; Joined {date}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={ROLE_BADGE_VARIANT[member.role] ?? 'secondary'}>
          {member.role}
        </Badge>
        {!isCurrentUser && !isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
              <MoreVerticalIcon className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {member.role !== 'lead' && (
                <DropdownMenuItem onClick={() => handleChangeRole('lead')} disabled={isPending}>
                  <ShieldIcon className="size-3.5" />
                  Promote to Lead
                </DropdownMenuItem>
              )}
              {member.role !== 'member' && !isAdmin && (
                <DropdownMenuItem onClick={() => handleChangeRole('member')} disabled={isPending}>
                  <UserIcon className="size-3.5" />
                  Set as Member
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={handleRemove}
                disabled={isPending}
                className="text-destructive"
              >
                <UserMinusIcon className="size-3.5" />
                Remove from team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

export { SettingsTeam }

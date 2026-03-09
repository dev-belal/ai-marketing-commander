'use client'

import { useState, useTransition } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { toast } from 'sonner'
import { deleteAgency } from '@/app/actions/settings'
import { SparklesIcon, TrashIcon } from 'lucide-react'
import type { Role } from '@/lib/permissions'

type AgencyData = {
  name: string
  accountType: string
  plan: string
  createdAt: string
}

function SettingsAccount({ agency, role }: { agency: AgencyData; role: Role }) {
  const memberSince = new Date(agency.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="space-y-6">
      {/* Beta card — glassmorphism */}
      <div className="relative overflow-hidden rounded-2xl p-[1px]">
        {/* Colorful backdrop that the blur reveals */}
        <div className="absolute inset-0">
          <div className="absolute -top-16 -left-16 size-56 rounded-full bg-violet-500/40 blur-3xl" />
          <div className="absolute -bottom-12 -right-12 size-48 rounded-full bg-sky-500/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 size-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/25 blur-3xl" />
        </div>

        {/* Glass panel */}
        <div
          className="relative overflow-hidden rounded-2xl p-8 shadow-lg"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div className="absolute -top-12 -right-12 size-40 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 size-32 rounded-full bg-primary/5 blur-2xl" />
          <div className="relative space-y-2">
            <div className="flex items-center gap-2">
              <SparklesIcon className="size-6 text-primary" />
              <h2 className="text-2xl font-bold">Beta User</h2>
            </div>
            <p className="text-muted-foreground">
              You&apos;re part of our exclusive beta program. Enjoy full access while we build.
            </p>
          </div>
        </div>
      </div>

      {/* Account info */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Account Type</p>
              <p className="text-sm font-medium capitalize">{agency.accountType}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium">{memberSince}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone — owner only */}
      {role === 'owner' && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions that permanently affect your agency.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DeleteAgencyDialog agencyName={agency.name} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function DeleteAgencyDialog({ agencyName }: { agencyName: string }) {
  const [open, setOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (confirmName !== agencyName) return

    startTransition(async () => {
      const result = await deleteAgency(agencyName)
      if (result?.error) {
        toast.error(result.error)
      }
    })
  }

  const isMatch = confirmName === agencyName

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" />}>
        <TrashIcon className="size-4" />
        Delete Agency
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Agency</DialogTitle>
          <DialogDescription>
            This will permanently delete your agency, all clients, audits,
            reports, and team members. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="confirm-name">
              Type <span className="font-mono font-semibold">{agencyName}</span> to confirm
            </Label>
            <Input
              id="confirm-name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={agencyName}
              disabled={isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isMatch || isPending}
          >
            {isPending ? 'Deleting...' : 'Delete Forever'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { SettingsAccount }

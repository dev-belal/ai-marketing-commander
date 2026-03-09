'use client'

import { useActionState, useEffect, useState } from 'react'
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
import { PlusIcon } from 'lucide-react'
import { addClient, type ClientActionState } from '@/app/actions/clients'

const INDUSTRIES = [
  'E-commerce',
  'SaaS / Software',
  'Healthcare',
  'Finance',
  'Real Estate',
  'Education',
  'Travel & Hospitality',
  'Food & Beverage',
  'Legal',
  'Manufacturing',
  'Retail',
  'Media & Entertainment',
  'Nonprofit',
  'Professional Services',
  'Other',
] as const

const initialState: ClientActionState = { error: null, success: false }

function AddClientDialog() {
  const [open, setOpen] = useState(false)
  const [state, formAction, isPending] = useActionState(addClient, initialState)

  useEffect(() => {
    if (state.success) {
      setOpen(false)
    }
  }, [state.success])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        <span>Add Client</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
          <DialogDescription>
            Create a new client workspace.
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
              <Label htmlFor="client-name">Client Name</Label>
              <Input
                id="client-name"
                name="name"
                placeholder="Client Co."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-website">Website URL</Label>
              <Input
                id="client-website"
                name="websiteUrl"
                type="url"
                placeholder="https://example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-industry">Industry</Label>
              <select
                id="client-industry"
                name="industry"
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="">Select an industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Adding...' : 'Add Client'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { AddClientDialog }

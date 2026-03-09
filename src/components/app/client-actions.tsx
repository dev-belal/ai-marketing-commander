'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVerticalIcon, PencilIcon, TrashIcon } from 'lucide-react'
import { toast } from 'sonner'

type ClientActionsProps = {
  clientId: string
  canEdit: boolean
  canDelete: boolean
}

function ClientActions({ clientId, canEdit, canDelete }: ClientActionsProps) {
  const [isPending, startTransition] = useTransition()

  function handleEdit() {
    // TODO: implement edit client dialog
    toast.info('Edit client coming soon')
  }

  function handleDelete() {
    startTransition(async () => {
      // TODO: implement delete client action
      toast.info('Delete client coming soon')
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="sm" />}>
        <MoreVerticalIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && (
          <DropdownMenuItem onClick={handleEdit} disabled={isPending}>
            <PencilIcon className="size-3.5" />
            Edit
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem onClick={handleDelete} disabled={isPending} className="text-destructive">
            <TrashIcon className="size-3.5" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { ClientActions }

import { redirect } from 'next/navigation'
import { GlobeIcon, UsersIcon } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddClientDialog } from '@/components/app/add-client-dialog'
import { ClientActions } from '@/components/app/client-actions'
import { getCurrentUser, getClients } from '@/lib/supabase/queries'
import { canEditClient, canDeleteClient, type Role } from '@/lib/permissions'

export default async function ClientsPage() {
  const { data: user } = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const { data: clients } = await getClients(user.agency_id)
  const role = user.role as Role
  const showEdit = canEditClient(role)
  const showDelete = canDeleteClient(role)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your client workspaces.
          </p>
        </div>
        <AddClientDialog />
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <UsersIcon className="size-8 text-muted-foreground" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">No clients yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first client to get started.
            </p>
          </div>
          <AddClientDialog />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle>{client.name}</CardTitle>
                      {client.industry && (
                        <CardDescription>{client.industry}</CardDescription>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={client.is_active ? 'default' : 'secondary'}>
                      {client.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    {(showEdit || showDelete) && (
                      <ClientActions
                        clientId={client.id}
                        canEdit={showEdit}
                        canDelete={showDelete}
                      />
                    )}
                  </div>
                </div>
              </CardHeader>
              {client.website_url && (
                <CardContent>
                  <a
                    href={client.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <GlobeIcon className="size-3.5" />
                    <span className="truncate">
                      {client.website_url.replace(/^https?:\/\//, '')}
                    </span>
                  </a>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

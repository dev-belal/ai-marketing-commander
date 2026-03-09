'use client'

import { useState, useTransition } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  approveRequest,
  rejectRequest,
  suspendAgency,
  reactivateAgency,
  approveLogo,
  rejectLogo,
} from '@/app/actions/admin'
import { CheckIcon, XIcon, LoaderIcon, UsersIcon, BuildingIcon, ImageIcon } from 'lucide-react'

type InviteRequest = {
  id: string
  name: string
  email: string
  account_type: string
  company: string | null
  reason: string | null
  status: string
  reviewed_at: string | null
  created_at: string
  invited_by: string | null
  assigned_role: string | null
}

type Agency = {
  id: string
  name: string
  account_type: string
  status: string
  plan: string
  created_at: string
}

type Invite = {
  id: string
  email: string
  account_type: string
  token: string
  expires_at: string
  used_at: string | null
  created_at: string
}

type PendingLogo = {
  id: string
  name: string
  logo_original_url: string | null
  logo_pending_url: string | null
}

type AdminDashboardProps = {
  requests: InviteRequest[]
  agencies: Agency[]
  invites: Invite[]
  agencyMap: Record<string, string>
  pendingLogos: PendingLogo[]
}

const TABS = ['Pending Requests', 'Logo Approvals', 'All Users', 'Invites Sent'] as const
type Tab = (typeof TABS)[number]

function AdminDashboard({ requests, agencies, invites, agencyMap, pendingLogos }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('Pending Requests')

  const pendingRequests = requests.filter((r) => r.status === 'pending')

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab}
            {tab === 'Pending Requests' && pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
            {tab === 'Logo Approvals' && pendingLogos.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingLogos.length}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'Pending Requests' && (
        <PendingRequestsTab requests={requests} agencyMap={agencyMap} />
      )}
      {activeTab === 'Logo Approvals' && (
        <LogoApprovalsTab logos={pendingLogos} />
      )}
      {activeTab === 'All Users' && (
        <AllUsersTab agencies={agencies} />
      )}
      {activeTab === 'Invites Sent' && (
        <InvitesSentTab invites={invites} />
      )}
    </div>
  )
}

function PendingRequestsTab({
  requests,
  agencyMap,
}: {
  requests: InviteRequest[]
  agencyMap: Record<string, string>
}) {
  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const processedRequests = requests.filter((r) => r.status !== 'pending')

  const pendingAgencySignups = pendingRequests.filter((r) => !r.invited_by)
  const pendingTeamInvites = pendingRequests.filter((r) => r.invited_by)

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No access requests yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {pendingAgencySignups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BuildingIcon className="size-4" />
              Agency Signups ({pendingAgencySignups.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingAgencySignups.map((request) => (
                <RequestRow key={request.id} request={request} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingTeamInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UsersIcon className="size-4" />
              Team Member Invites ({pendingTeamInvites.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingTeamInvites.map((request) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  agencyName={request.invited_by ? agencyMap[request.invited_by] : undefined}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {pendingRequests.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No pending requests.
          </CardContent>
        </Card>
      )}

      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Processed ({processedRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {processedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{request.name}</p>
                      {request.invited_by && (
                        <Badge variant="secondary" className="text-[10px]">
                          Team invite
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {request.email} &middot; {request.account_type}
                      {request.invited_by && agencyMap[request.invited_by]
                        ? ` &middot; ${agencyMap[request.invited_by]}`
                        : ` &middot; ${request.company ?? 'No company'}`}
                      {request.assigned_role && ` &middot; ${request.assigned_role}`}
                    </p>
                  </div>
                  <Badge
                    variant={request.status === 'approved' ? 'default' : 'secondary'}
                  >
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function RequestRow({
  request,
  agencyName,
}: {
  request: InviteRequest
  agencyName?: string
}) {
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    startTransition(async () => {
      const result = await approveRequest(request.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Approved and invited ${request.email}`)
      }
    })
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectRequest(request.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Rejected ${request.email}`)
      }
    })
  }

  const date = new Date(request.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  const isTeamInvite = !!request.invited_by

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{request.name}</p>
            {isTeamInvite && (
              <Badge variant="secondary" className="text-[10px]">
                Team invite
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {request.email}
            {isTeamInvite
              ? <> &middot; Invited by <span className="font-medium">{agencyName ?? 'Unknown'}</span> &middot; Role: {request.assigned_role}</>
              : <> &middot; {request.account_type} &middot; {request.company ?? 'No company'}</>
            }
            {' '}&middot; {date}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={handleApprove}
            disabled={isPending}
          >
            {isPending ? (
              <LoaderIcon className="size-3 animate-spin" />
            ) : (
              <CheckIcon className="size-3" />
            )}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReject}
            disabled={isPending}
          >
            <XIcon className="size-3" />
            Reject
          </Button>
        </div>
      </div>
      {request.reason && (
        <p className="text-sm text-muted-foreground bg-muted rounded-md px-3 py-2">
          {request.reason}
        </p>
      )}
    </div>
  )
}

function LogoApprovalsTab({ logos }: { logos: PendingLogo[] }) {
  if (logos.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No logos pending approval.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="size-4" />
          Pending Logos ({logos.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {logos.map((logo) => (
            <LogoRow key={logo.id} logo={logo} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function LogoRow({ logo }: { logo: PendingLogo }) {
  const [isPending, startTransition] = useTransition()

  function handleApprove() {
    startTransition(async () => {
      const result = await approveLogo(logo.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Logo approved for ${logo.name}`)
      }
    })
  }

  function handleReject() {
    startTransition(async () => {
      const result = await rejectLogo(logo.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(`Logo rejected for ${logo.name}`)
      }
    })
  }

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <p className="text-sm font-medium">{logo.name}</p>
      <div className="flex gap-6">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Original</p>
          <div className="rounded-lg border bg-muted/50 p-3">
            {logo.logo_original_url ? (
              <img
                src={logo.logo_original_url}
                alt="Original logo"
                className="max-h-24 max-w-48 object-contain"
              />
            ) : (
              <p className="text-xs text-muted-foreground">No original</p>
            )}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Processed (transparent)</p>
          <div
            className="rounded-lg border p-3"
            style={{
              backgroundImage:
                'linear-gradient(45deg, #e5e7eb 25%, transparent 25%), linear-gradient(-45deg, #e5e7eb 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e5e7eb 75%), linear-gradient(-45deg, transparent 75%, #e5e7eb 75%)',
              backgroundSize: '16px 16px',
              backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
            }}
          >
            {logo.logo_pending_url ? (
              <img
                src={logo.logo_pending_url}
                alt="Processed logo"
                className="max-h-24 max-w-48 object-contain"
              />
            ) : (
              <p className="text-xs text-muted-foreground">No processed version</p>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleApprove} disabled={isPending}>
          {isPending ? (
            <LoaderIcon className="size-3 animate-spin" />
          ) : (
            <CheckIcon className="size-3" />
          )}
          Approve
        </Button>
        <Button size="sm" variant="outline" onClick={handleReject} disabled={isPending}>
          <XIcon className="size-3" />
          Reject
        </Button>
      </div>
    </div>
  )
}

function AllUsersTab({ agencies }: { agencies: Agency[] }) {
  const [isPending, startTransition] = useTransition()

  function handleToggleStatus(agencyId: string, currentStatus: string) {
    startTransition(async () => {
      const result =
        currentStatus === 'active'
          ? await suspendAgency(agencyId)
          : await reactivateAgency(agencyId)

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(
          currentStatus === 'active' ? 'Agency suspended' : 'Agency reactivated'
        )
      }
    })
  }

  if (agencies.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No agencies yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          All Agencies ({agencies.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {agencies.map((agency) => {
            const date = new Date(agency.created_at).toLocaleDateString(
              'en-US',
              { month: 'short', day: 'numeric', year: 'numeric' }
            )

            return (
              <div
                key={agency.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{agency.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {agency.account_type} &middot; {agency.plan} &middot; {date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={agency.status === 'active' ? 'default' : 'destructive'}
                  >
                    {agency.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleStatus(agency.id, agency.status)}
                    disabled={isPending}
                  >
                    {agency.status === 'active' ? 'Suspend' : 'Reactivate'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function InvitesSentTab({ invites }: { invites: Invite[] }) {
  if (invites.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No invites sent yet.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Invites ({invites.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {invites.map((invite) => {
            const expiresAt = new Date(invite.expires_at)
            const isExpired = expiresAt < new Date()
            const isUsed = invite.used_at !== null

            let statusLabel: string
            let statusVariant: 'default' | 'secondary' | 'destructive'

            if (isUsed) {
              statusLabel = 'Used'
              statusVariant = 'default'
            } else if (isExpired) {
              statusLabel = 'Expired'
              statusVariant = 'destructive'
            } else {
              statusLabel = 'Pending'
              statusVariant = 'secondary'
            }

            const date = new Date(invite.created_at).toLocaleDateString(
              'en-US',
              { month: 'short', day: 'numeric', year: 'numeric' }
            )

            return (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {invite.account_type} &middot; Sent {date} &middot; Expires{' '}
                    {expiresAt.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <Badge variant={statusVariant}>{statusLabel}</Badge>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export { AdminDashboard }

'use client'

import { useState } from 'react'
import { SettingsBrandingForm } from './settings-branding-form'
import { SettingsAccount } from './settings-account'
import { SettingsTeam } from './settings-team'
import type { Role } from '@/lib/permissions'

type AgencyData = {
  id: string
  name: string
  logoUrl: string | null
  logoPendingUrl: string | null
  logoOriginalUrl: string | null
  logoStatus: string
  websiteUrl: string
  primaryColor: string
  accountType: string
  plan: string
  createdAt: string
}

type TeamMember = {
  id: string
  email: string
  full_name: string | null
  role: string
  created_at: string
}

type SettingsTabsWrapperProps = {
  agency: AgencyData
  role: Role
  showTeamTab: boolean
  members: TeamMember[]
  currentUserId: string
}

function SettingsTabsWrapper({
  agency,
  role,
  showTeamTab,
  members,
  currentUserId,
}: SettingsTabsWrapperProps) {
  const tabs = ['Branding', 'Plan & Account']
  if (showTeamTab) tabs.push('Team')

  const [activeTab, setActiveTab] = useState(tabs[0])

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-lg bg-muted p-1">
        {tabs.map((tab) => (
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
          </button>
        ))}
      </div>

      {activeTab === 'Branding' && (
        <SettingsBrandingForm agency={agency} />
      )}
      {activeTab === 'Plan & Account' && (
        <SettingsAccount agency={agency} role={role} />
      )}
      {activeTab === 'Team' && showTeamTab && (
        <SettingsTeam members={members} currentUserId={currentUserId} />
      )}
    </div>
  )
}

export { SettingsTabsWrapper }

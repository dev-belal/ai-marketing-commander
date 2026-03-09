type Role = 'owner' | 'admin' | 'lead' | 'member'

function canEditClient(role: Role): boolean {
  return role === 'owner' || role === 'admin' || role === 'lead'
}

function canDeleteClient(role: Role): boolean {
  return role === 'owner' || role === 'admin' || role === 'lead'
}

function canAddClient(_role: Role): boolean {
  return true
}

function canViewTeamPage(role: Role): boolean {
  return role === 'owner' || role === 'admin'
}

function canManageTeamMembers(role: Role): boolean {
  return role === 'owner' || role === 'admin'
}

function canViewAnalytics(role: Role): boolean {
  return role === 'owner' || role === 'admin'
}

function canViewSettings(role: Role): boolean {
  return role === 'owner' || role === 'admin'
}

function isTeamAccount(accountType: string): boolean {
  return accountType === 'team'
}

export {
  canEditClient,
  canDeleteClient,
  canAddClient,
  canViewTeamPage,
  canManageTeamMembers,
  canViewAnalytics,
  canViewSettings,
  isTeamAccount,
}

export type { Role }

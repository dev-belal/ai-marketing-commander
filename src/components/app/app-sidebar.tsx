'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboardIcon,
  UsersIcon,
  SearchIcon,
  PenToolIcon,
  FileTextIcon,
  SettingsIcon,
  BarChart3Icon,
  UserPlusIcon,
  ChevronRightIcon,
  SparklesIcon,
  ClipboardCheckIcon,
  WandIcon,
  HistoryIcon,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import {
  canViewAnalytics,
  canViewTeamPage,
  canViewSettings,
  isTeamAccount,
  type Role,
} from '@/lib/permissions'
import type { LucideIcon } from 'lucide-react'

type NavItem = {
  title: string
  href: string
  icon: LucideIcon
}

type AppSidebarProps = {
  agencyName: string
  agencyLogoUrl: string | null
  logoStatus: string
  role: Role
  accountType: string
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('')
}

function AppSidebar({ agencyName, agencyLogoUrl, logoStatus, role, accountType }: AppSidebarProps) {
  const pathname = usePathname()

  const navItems: NavItem[] = [
    { title: 'Overview', href: '/dashboard', icon: LayoutDashboardIcon },
    { title: 'Clients', href: '/clients', icon: UsersIcon },
    { title: 'Audits', href: '/audits', icon: SearchIcon },
    ...(canViewAnalytics(role)
      ? [{ title: 'Analytics', href: '/analytics', icon: BarChart3Icon } as NavItem]
      : []),
    { title: 'Reports', href: '/reports', icon: FileTextIcon },
  ]

  const bottomItems: NavItem[] = []

  if (canViewTeamPage(role) && isTeamAccount(accountType)) {
    bottomItems.push({ title: 'Team', href: '/team', icon: UserPlusIcon })
  }

  if (canViewSettings(role)) {
    bottomItems.push({ title: 'Settings', href: '/settings', icon: SettingsIcon })
  }

  const contentSubItems = [
    { title: 'Generate', href: '/content', icon: WandIcon },
    { title: 'History', href: '/content/history', icon: HistoryIcon },
    { title: 'SEO Blog Generator', href: '/content/seo-blog', icon: SparklesIcon },
    { title: 'Blog Audit', href: '/content/blog-audit', icon: ClipboardCheckIcon },
  ]

  const isContentActive = pathname.startsWith('/content')

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          {logoStatus === 'approved' && agencyLogoUrl ? (
            <img
              src={agencyLogoUrl}
              alt={agencyName}
              className="size-7 shrink-0 rounded-md object-contain"
            />
          ) : (
            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-[10px] font-bold text-primary-foreground">
              {getInitials(agencyName)}
            </div>
          )}
          <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:hidden">
            {agencyName}
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}

              {/* Content with sub-items */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/content" />}
                  isActive={isContentActive}
                  tooltip="Content"
                >
                  <PenToolIcon />
                  <span>Content</span>
                  <ChevronRightIcon className={`ml-auto size-3.5 transition-transform ${isContentActive ? 'rotate-90' : ''}`} />
                </SidebarMenuButton>
                {isContentActive && (
                  <SidebarMenuSub>
                    {contentSubItems.map((sub) => (
                      <SidebarMenuSubItem key={sub.href}>
                        <SidebarMenuSubButton
                          render={<Link href={sub.href} />}
                          isActive={sub.href === '/content' ? pathname === '/content' : pathname === sub.href || pathname.startsWith(sub.href + '/')}
                        >
                          <sub.icon />
                          <span>{sub.title}</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                )}
              </SidebarMenuItem>

              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                    tooltip={item.title}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

export { AppSidebar }

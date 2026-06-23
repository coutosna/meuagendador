'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, MessageSquare, Kanban, Calendar,
  Bot, Users, BarChart3, Settings, ChevronDown, LogOut, Bell,
} from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Conversas', href: '/conversations', icon: MessageSquare },
  { label: 'CRM', href: '/crm', icon: Kanban },
  { label: 'Agenda', href: '/agenda', icon: Calendar },
  { label: 'IA', href: '/ia', icon: Bot },
  { label: 'Contatos', href: '/contacts', icon: Users },
  { label: 'Relatórios', href: '/reports', icon: BarChart3 },
  { label: 'Config.', href: '/settings', icon: Settings },
]

export function TopNav() {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const [userOpen, setUserOpen] = useState(false)

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'

  return (
    <header className="h-14 border-b border-border bg-card flex items-center px-6 flex-shrink-0 sticky top-0 z-50 relative">
      {/* Logo — esquerda */}
      <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <span className="text-white font-black text-xs">M</span>
        </div>
        <span className="font-bold text-foreground text-sm tracking-tight">MeuAgendador</span>
      </Link>

      {/* Nav items — centro absoluto */}
      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap',
                active
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground',
              )}>
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Right side — direita */}
      <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
        <button className="relative w-8 h-8 rounded-lg hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
          <Bell className="w-4 h-4" />
        </button>

        <div className="relative">
          <button onClick={() => setUserOpen(!userOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-secondary transition-all">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {initials}
            </div>
            <span className="text-sm text-foreground font-medium max-w-24 truncate">{user?.name?.split(' ')[0]}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          </button>

          {userOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
              <div className="absolute right-0 top-full mt-1 w-52 bg-card border border-border rounded-xl shadow-xl z-20 p-1">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="text-sm font-semibold text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
                <button onClick={() => { logout(); setUserOpen(false) }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-all">
                  <LogOut className="w-3.5 h-3.5" />
                  Sair
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

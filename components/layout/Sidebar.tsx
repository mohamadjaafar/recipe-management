'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, CalendarDays, Share2, User, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/recipes', label: 'My Recipes', icon: BookOpen },
  { href: '/meal-planner', label: 'Meal Planner', icon: CalendarDays },
  { href: '/shared', label: 'Shared With Me', icon: Share2 },
  { href: '/ai-generator', label: 'AI Generator', icon: Sparkles },
  { href: '/profile', label: 'Profile', icon: User },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r transition-transform duration-200 lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="font-semibold text-gray-700">Menu</span>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-lg bg-emerald-50 p-3 text-sm">
            <p className="font-medium text-emerald-700 flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> AI-Powered
            </p>
            <p className="text-emerald-600 text-xs mt-1">
              Generate recipes, get substitutions & nutritional info with Claude AI
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}

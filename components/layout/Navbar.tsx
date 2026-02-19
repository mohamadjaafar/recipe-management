'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChefHat, LogOut, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

interface NavbarProps {
  user: { email?: string; id: string } | null
  onMenuClick?: () => void
}

export default function Navbar({ user, onMenuClick }: NavbarProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="flex h-16 items-center px-4 gap-4">
        <button onClick={onMenuClick} className="lg:hidden p-2 rounded-md hover:bg-gray-100">
          <Menu className="h-5 w-5" />
        </button>
        <Link href="/recipes" className="flex items-center gap-2 font-bold text-xl text-emerald-700">
          <ChefHat className="h-6 w-6" />
          <span>RecipeAI</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          {user && (
            <>
              <Link href="/profile">
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user.email?.split('@')[0]}</span>
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleSignOut} disabled={loading}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Sign out</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

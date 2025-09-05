"use client"

import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

interface NavigationProps {
  user: User
}

export default function Navigation({ user }: NavigationProps) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <h1 className="text-xl font-semibold">Versus</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
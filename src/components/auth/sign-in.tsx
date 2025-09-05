"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Check your email",
        description: "We sent you a magic link to sign in.",
      })
    }

    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in to Versus</CardTitle>
        <CardDescription>
          Enter your email to receive a magic link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSignIn} className="space-y-4">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send Magic Link'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
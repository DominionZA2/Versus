import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import SignIn from '@/components/auth/sign-in'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/comparisons')
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn />
    </div>
  )
}
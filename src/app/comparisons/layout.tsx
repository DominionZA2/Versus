import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import Navigation from '@/components/navigation'

export default async function ComparisonsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation user={user} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
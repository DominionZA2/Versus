import { createServerSupabaseClient } from '@/lib/supabase/server'
import CreateComparisonForm from '@/components/comparisons/create-comparison-form'
import ComparisonsList from '@/components/comparisons/comparisons-list'

export default async function ComparisonsPage() {
  const supabase = await createServerSupabaseClient()
  
  const { data: comparisons } = await supabase
    .from('comparisons')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Your Comparisons</h2>
        <p className="text-muted-foreground">
          Create and manage your comparisons
        </p>
      </div>

      <CreateComparisonForm />
      
      <ComparisonsList comparisons={comparisons || []} />
    </div>
  )
}
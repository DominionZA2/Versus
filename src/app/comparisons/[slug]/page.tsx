import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface ComparisonPageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ComparisonPage({ params }: ComparisonPageProps) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  
  const { data: comparison } = await supabase
    .from('comparisons')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!comparison) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/comparisons">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Comparisons
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{comparison.name}</CardTitle>
          <CardDescription>
            Created on {new Date(comparison.created_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/50 p-8 text-center">
            <p className="text-muted-foreground">
              Contenders coming soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
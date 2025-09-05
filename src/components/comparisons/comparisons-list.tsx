import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database } from '@/types/database'

type Comparison = Database['public']['Tables']['comparisons']['Row']

interface ComparisonsListProps {
  comparisons: Comparison[]
}

export default function ComparisonsList({ comparisons }: ComparisonsListProps) {
  if (comparisons.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            You haven't created any comparisons yet.
          </p>
          <p className="text-sm text-muted-foreground">
            Create your first comparison to get started!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {comparisons.map((comparison) => (
        <Card key={comparison.id} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle>{comparison.name}</CardTitle>
            <CardDescription>
              Created {new Date(comparison.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href={`/comparisons/${comparison.slug}`}>
                View Details
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
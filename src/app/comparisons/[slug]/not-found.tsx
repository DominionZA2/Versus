import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ComparisonNotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Comparison Not Found</CardTitle>
          <CardDescription>
            The comparison you're looking for doesn't exist or you don't have access to it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/comparisons">Back to Comparisons</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
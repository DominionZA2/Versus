import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AuthError() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Error</CardTitle>
          <CardDescription>
            There was an error signing you in. Please try again.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/">Back to Sign In</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    slug: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: comparison, error } = await supabase
    .from('comparisons')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !comparison) {
    return NextResponse.json({ error: 'Comparison not found' }, { status: 404 })
  }

  // Verify the user owns this comparison
  if (comparison.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ comparison })
}
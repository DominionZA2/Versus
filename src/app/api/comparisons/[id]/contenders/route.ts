import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify the user owns this comparison
  const { data: comparison } = await supabase
    .from('comparisons')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!comparison) {
    return NextResponse.json({ error: 'Comparison not found' }, { status: 404 })
  }

  // Get contenders for this comparison
  const { data: contenders, error } = await supabase
    .from('contenders')
    .select('*')
    .eq('comparison_id', id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ contenders })
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Verify the user owns this comparison
    const { data: comparison } = await supabase
      .from('comparisons')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (!comparison) {
      return NextResponse.json({ error: 'Comparison not found' }, { status: 404 })
    }

    // Create the contender
    const { data: contender, error } = await supabase
      .from('contenders')
      .insert({
        comparison_id: id,
        name,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ contender }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
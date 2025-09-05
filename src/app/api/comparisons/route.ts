import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/slugify'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: comparisons, error } = await supabase
    .from('comparisons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ comparisons })
}

export async function POST(request: NextRequest) {
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

    // Generate slug from name
    let slug = slugify(name)
    
    // Check if slug already exists for this user and make it unique if necessary
    const { data: existingComparisons } = await supabase
      .from('comparisons')
      .select('slug')
      .eq('user_id', user.id)
      .like('slug', `${slug}%`)

    if (existingComparisons && existingComparisons.length > 0) {
      const existingSlugs = existingComparisons.map(c => c.slug)
      let counter = 1
      let uniqueSlug = slug
      
      while (existingSlugs.includes(uniqueSlug)) {
        uniqueSlug = `${slug}-${counter}`
        counter++
      }
      
      slug = uniqueSlug
    }

    const { data: comparison, error } = await supabase
      .from('comparisons')
      .insert({
        user_id: user.id,
        name,
        slug,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ comparison }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
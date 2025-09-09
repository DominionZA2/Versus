import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { baseUrl } = body;

    if (!baseUrl) {
      return NextResponse.json({ error: 'Base URL required' }, { status: 400 });
    }

    // Fetch models from Ollama
    const response = await fetch(`${baseUrl}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Failed to fetch models: ${response.status} ${response.statusText}` 
      }, { status: response.status });
    }

    const data = await response.json();
    
    // Transform the response to match our expected format
    const models = data.models?.map((model: any) => ({
      name: model.name,
      size: model.size,
      modified: model.modified_at,
      family: model.details?.family || 'unknown'
    })) || [];

    return NextResponse.json({ models });

  } catch (error) {
    console.error('Ollama models API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch models from Ollama',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

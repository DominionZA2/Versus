import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, model, prompt, maxTokens = 1000, file } = body;

    console.log('API Request:', { provider, model, hasApiKey: !!apiKey, prompt: prompt?.substring(0, 50) });

    if (!provider || !apiKey) {
      return NextResponse.json({ error: 'Provider and API key required' }, { status: 400 });
    }

    let apiUrl: string;
    let headers: Record<string, string>;
    let requestBody: any;

    if (provider === 'anthropic') {
      apiUrl = 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'pdfs-2024-09-25'  // Enable PDF support
      };

      // Handle file uploads differently
      if (file && file.startsWith('data:')) {
        const [mediaInfo, base64Data] = file.split(',');
        const mediaType = mediaInfo.match(/data:([^;]+)/)?.[1] || 'application/octet-stream';
        
        // Check if the selected model supports PDFs for PDF files
        const isPDF = mediaType === 'application/pdf';
        const pdfCapableModels = ['claude-3-5-sonnet-20241022', 'claude-3-5-sonnet-20240620', 'claude-sonnet-4-20250514'];
        const selectedModel = model || 'claude-3-5-sonnet-20241022';
        
        if (isPDF && !pdfCapableModels.includes(selectedModel)) {
          return NextResponse.json({
            error: `Model "${selectedModel}" does not support PDF files. Please use Claude 3.5 Sonnet or Claude 4 Sonnet for PDF analysis.`,
            supportedModels: pdfCapableModels
          }, { status: 400 });
        }
        
        requestBody = {
          model: selectedModel,
          max_tokens: maxTokens,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: mediaType,
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }]
        };
      } else {
        requestBody = {
          model: model || 'claude-sonnet-4-20250514',
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }]
        };
      }
    } else if (provider === 'openai') {
      apiUrl = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      };
      requestBody = {
        model: model || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens
      };
    } else {
      return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', {
        status: response.status,
        statusText: response.statusText,
        provider,
        model,
        errorText
      });
      return NextResponse.json({ 
        error: `API request failed: ${response.status} ${response.statusText}`,
        details: errorText,
        provider,
        model
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
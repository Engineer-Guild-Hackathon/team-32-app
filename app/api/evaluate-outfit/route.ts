import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json();
    
    if (!imageData) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Dify API設定の確認
    const difyApiEndpoint = process.env.DIFY_API_ENDPOINT;
    const difyApiKey = process.env.DIFY_API_KEY;

    if (!difyApiEndpoint || !difyApiKey) {
      return NextResponse.json({ 
        error: 'Dify API configuration is missing. Please set DIFY_API_ENDPOINT and DIFY_API_KEY environment variables.' 
      }, { status: 500 });
    }

    // Dify API呼び出し
    const difyResponse = await fetch("https://api.dify.ai/v1/workflows/run", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${difyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          image: imageData
        },
        user:"hello"
      })
    });

    if (!difyResponse.ok) {
      const errorText = await difyResponse.text();
      console.error('Dify API error:', errorText);
      return NextResponse.json({ 
        error: `Dify API request failed: ${difyResponse.status} ${difyResponse.statusText}` 
      }, { status: 500 });
    }

    const evaluationText = await difyResponse.text();
    
    return NextResponse.json({ 
      success: true, 
      evaluationText 
    });
    
  } catch (error) {
    console.error('Error in evaluate-outfit API:', error);
    return NextResponse.json(
      { error: `Failed to evaluate outfit: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}


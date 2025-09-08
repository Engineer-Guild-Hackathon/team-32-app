import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
    }

    // Images API (Imagen 3/3-fast equivalent) を使用
    const imagesApiUrl = `https://generativelanguage.googleapis.com/v1beta/images:generate?key=${apiKey}`;
    
    const imagesApiResponse = await fetch(imagesApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: {
          text: `Create a high-quality, clean product photo of a ${prompt}. The image should be on a white background, well-lit, and show the clothing item clearly. Style: professional product photography, clean and minimalist.`,
        },
      }),
    });

    if (!imagesApiResponse.ok) {
      const errorData = await imagesApiResponse.json();
      console.error('Images API error:', errorData);
      return NextResponse.json(
        { error: `Images API error: ${errorData.error.message}` },
        { status: imagesApiResponse.status }
      );
    }

    const imagesApiResult = await imagesApiResponse.json();
    const base64Image = imagesApiResult.images[0].image.data; // レスポンス構造に応じて調整が必要
    const imageUrl = `data:image/png;base64,${base64Image}`;

    return NextResponse.json({ success: true, imageUrl });
  } catch (error) {
    console.error('Error in generate-image API:', error);
    return NextResponse.json(
      { error: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
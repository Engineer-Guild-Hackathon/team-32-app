import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, userImage } = body; // userImageは現在Images APIで直接使用していない

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
    }

    const clothingDescription = items
      .map((item: any) => `${item.color} ${item.name}${item.brand ? ` by ${item.brand}` : ''}`)
      .join(', ');

    const prompt = `Create a realistic full-body portrait of a person wearing: ${clothingDescription}. The person should be wearing the clothing items naturally and the outfit should look cohesive and stylish. Style: professional fashion photography, good lighting, clean background. The person should be standing in a natural pose, showing the full outfit clearly.`;

    // Images API (Imagen 3/3-fast equivalent) を使用
    const imagesApiUrl = `https://generativelanguage.googleapis.com/v1beta/images:generate?key=${apiKey}`;
    
    const imagesApiResponse = await fetch(imagesApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: {
          text: prompt,
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
    console.error('Error in generate-dress-up API:', error);
    return NextResponse.json(
      { error: `Failed to generate dress-up image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
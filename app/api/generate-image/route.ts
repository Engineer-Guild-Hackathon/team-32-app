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

    // Gemini 2.5 Flash Image (Nano Banana) を使用
    const imagesApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
    
    const imagesApiResponse = await fetch(imagesApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [{
            text: `Create a high-quality, clean product photo of a ${prompt}. The image should be on a white background, well-lit, and show the clothing item clearly. Style: professional product photography, clean and minimalist.`
          }]
        }]
      }),
    });

    if (!imagesApiResponse.ok) {
      const errorData = await imagesApiResponse.json();
      console.error('Images API error:', errorData);
      
      // クォータ制限の場合はプレースホルダー画像を返す
      if (errorData.error?.message?.includes('quota') || errorData.error?.message?.includes('billing')) {
        const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEdlbmVyYXRpb248L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9IjEuNWVtIj5BUEkgUXVvdGEgRXhjZWVkZWQ8L3RleHQ+PC9zdmc+';
        return NextResponse.json({ success: true, imageUrl: placeholderImage });
      }
      
      return NextResponse.json(
        { error: `Images API error: ${errorData.error?.message || 'Unknown error'}` },
        { status: imagesApiResponse.status }
      );
    }

    const imagesApiResult = await imagesApiResponse.json();
    const imageData = imagesApiResult.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (imageData && imageData.mimeType && imageData.data) {
      const imageUrl = `data:${imageData.mimeType};base64,${imageData.data}`;
      return NextResponse.json({ success: true, imageUrl });
    } else {
      console.error('Images API did not return image data:', imagesApiResult);
      return NextResponse.json({ error: 'Failed to generate image from Images API.' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in generate-image API:', error);
    return NextResponse.json(
      { error: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
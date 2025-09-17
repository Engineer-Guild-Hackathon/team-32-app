import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withApiLimit } from '@/lib/with-api-limit';

async function generateImageHandler(request: NextRequest, userId: string, requestId: string) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
    }

    // Imagen 4 Fast を使用するために GoogleGenerativeAI を初期化
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "imagen-4-fast" });

    const result = await model.generateContent([
      `Create a high-quality, clean product photo of a ${prompt}. The image should be on a white background, well-lit, and show the clothing item clearly. Style: professional product photography, clean and minimalist.`
    ]);

    const response = result.response;
    
    // 画像データを取得
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        return NextResponse.json({ success: true, imageUrl });
      }
    }
    
    // 画像が見つからない場合はエラーを返す
    return NextResponse.json({ error: 'Failed to generate image' }, { status: 500 });
    
  } catch (error) {
    console.error('Error in generate-image API (Imagen):', error);
    return NextResponse.json(
      { error: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export const POST = withApiLimit(generateImageHandler);
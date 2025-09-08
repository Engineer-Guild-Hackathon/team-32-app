import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "images" });

    const imageResult = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `Create a high-quality, clean product photo of a ${prompt}. The image should be on a white background, well-lit, and show the clothing item clearly. Style: professional product photography, clean and minimalist.` }] }],
      generationConfig: {
        responseMimeType: "image/jpeg",
      },
    });

    const response = imageResult.response;
    const imageData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (imageData && imageData.mimeType && imageData.data) {
      const imageUrl = `data:${imageData.mimeType};base64,${imageData.data}`;
      return NextResponse.json({ success: true, imageUrl });
    } else {
      console.error('Images API did not return image data:', response);
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
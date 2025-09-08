import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

export async function POST(request: NextRequest) {
  try {
    const { items, userImage } = await request.json();

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "images" });

    const clothingDescription = items
      .map((item: any) => `${item.color} ${item.name}${item.brand ? ` by ${item.brand}` : ''}`)
      .join(', ');

    const prompt = `Create a realistic full-body portrait of a person wearing: ${clothingDescription}. The person should be wearing the clothing items naturally and the outfit should look cohesive and stylish. Style: professional fashion photography, good lighting, clean background. The person should be standing in a natural pose, showing the full outfit clearly.`;

    const contents: Part[] = [{ text: prompt }];

    if (userImage) {
      // userImage is expected to be a base64 data URL (e.g., data:image/png;base64,...)
      const [mimeTypePart, dataPart] = userImage.split(';base64,');
      const mimeType = mimeTypePart.split(':')[1];
      contents.unshift({
        inlineData: {
          mimeType: mimeType,
          data: dataPart,
        },
      });
    }

    const imageResult = await model.generateContent({
      contents: [{ role: "user", parts: contents }],
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
      console.error('Images API did not return image data for dress-up:', response);
      return NextResponse.json({ error: 'Failed to generate dress-up image from Images API.' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in generate-dress-up API:', error);
    return NextResponse.json(
      { error: `Failed to generate dress-up image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
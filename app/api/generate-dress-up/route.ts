import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

    const clothingDescription = items
      .map((item: any) => `${item.color} ${item.name}${item.brand ? ` by ${item.brand}` : ''}`)
      .join(', ');

    const prompt = `Create a realistic full-body portrait of the SAME PERSON from the provided image wearing: ${clothingDescription}. 
    
    IMPORTANT: 
    - Keep the EXACT SAME person (same gender, same facial features, same body type, same age)
    - Only change the clothing to the specified items
    - Maintain the person's original appearance and identity
    - The person should be wearing the clothing items naturally and the outfit should look cohesive and stylish
    - Style: professional fashion photography, good lighting, clean background
    - The person should be standing in a natural pose, showing the full outfit clearly`;

    // Gemini 2.5 Flash Image (Nano Banana) を正しく使用
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    // ユーザー画像がある場合は画像とテキストの両方を含める
    const contents: any[] = [];
    
    if (userImage) {
      const [mimeTypePart, dataPart] = userImage.split(';base64,');
      const mimeType = mimeTypePart.split(':')[1];
      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: dataPart,
        },
      });
      contents.push({ 
        text: `This is the reference person. Please create a new image of this EXACT SAME person wearing: ${clothingDescription}. Keep all facial features, gender, body type, and age exactly the same. Only change the clothing.` 
      });
    } else {
      contents.push({ text: prompt });
    }

    const result = await model.generateContent(contents);
    const response = result.response;
    
    // 画像データを取得
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        return NextResponse.json({ success: true, imageUrl });
      }
    }

    // 画像が見つからない場合はプレースホルダーを返す
    const placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzY2NjY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkRyZXNzIFVwIEdlbmVyYXRpb248L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9IjEuNWVtIj5EcmVzcyBVcCBHZW5lcmF0aW9uPC90ZXh0Pjwvc3ZnPg==';
    return NextResponse.json({ success: true, imageUrl: placeholderImage });
    
  } catch (error) {
    console.error('Error in generate-dress-up API:', error);
    return NextResponse.json(
      { error: `Failed to generate dress-up image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
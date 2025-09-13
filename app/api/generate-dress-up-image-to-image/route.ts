import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { withApiLimit } from '@/lib/with-api-limit';

async function generateDressUpImageHandler(request: NextRequest, userId: string, requestId: string) {
  try {
    const { userImage, clothingImages } = await request.json();

    if (!userImage) {
      return NextResponse.json({ error: 'User image is required' }, { status: 400 });
    }

    if (!clothingImages || !Array.isArray(clothingImages) || clothingImages.length === 0) {
      return NextResponse.json({ error: 'Clothing images array is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    // ユーザー画像を処理（正規表現で安全にパース）
    const userImageMatch = userImage.match(/^data:(.+);base64,(.*)$/);
    if (!userImageMatch) {
      return NextResponse.json({ error: 'Invalid user image format' }, { status: 400 });
    }
    const userImagePart: Part = {
      inlineData: {
        mimeType: userImageMatch[1],
        data: userImageMatch[2],
      },
    };

    // 服の画像を処理（正規表現で安全にパース）
    const clothingImageParts: Part[] = clothingImages.map((img: string) => {
      const clothingImageMatch = img.match(/^data:(.+);base64,(.*)$/);
      if (!clothingImageMatch) {
        throw new Error('Invalid clothing image format');
      }
      return {
        inlineData: {
          mimeType: clothingImageMatch[1],
          data: clothingImageMatch[2],
        },
      };
    });

    // プロンプトを作成
    const prompt = `Create a realistic full-body portrait of the SAME PERSON from the first image wearing the clothing items shown in the subsequent images. 

    IMPORTANT: 
    - Keep the EXACT SAME person (same gender, same facial features, same body type, same age) from the first image
    - Only change the clothing to match the items shown in the other images
    - Maintain the person's original appearance and identity
    - The person should be wearing the clothing items naturally and the outfit should look cohesive and stylish
    - Style: professional fashion photography, good lighting, clean background
    - The person should be standing in a natural pose, showing the full outfit clearly
    - Combine all the clothing items into one cohesive outfit`;

    // APIに渡すリクエストのペイロードを作成
    // 指示(prompt)を最初に、次いで人物画像、服の画像の順に並べます
    const requestPayload = [
      prompt,
      userImagePart,
      ...clothingImageParts
    ];

    const result = await model.generateContent(requestPayload);
    const response = result.response;
    
    // 画像データを取得
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        return NextResponse.json({ success: true, imageUrl });
      }
    }

    // 画像が見つからない場合はエラーを返す
    return NextResponse.json({ success: false, error: 'Image could not be generated.' }, { status: 500 });
    
  } catch (error) {
    console.error('Error in generate-dress-up-image-to-image API:', error);
    return NextResponse.json(
      { error: `Failed to generate dress-up image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export const POST = withApiLimit(generateDressUpImageHandler);

// Next.js API Route Config
export const runtime = 'nodejs';
export const maxDuration = 60; // 60秒のタイムアウト設定
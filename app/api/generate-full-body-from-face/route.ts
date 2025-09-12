import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { checkUserPlan, checkProPlan } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // ユーザー認証とプラン確認
    const planCheck = await checkUserPlan();
    if (planCheck.error) {
      return planCheck.error;
    }

    // freeプランの場合はAPIの利用を制限
    const proCheck = checkProPlan(planCheck.userPlan);
    if (proCheck) {
      return proCheck;
    }

    const { faceImage } = await request.json();
    
    if (!faceImage) {
      return NextResponse.json({ error: 'Face image is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
    }

    // Gemini 2.5 Flash Image を使用
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    // Base64画像からMIMEタイプとデータを分離
    const base64Match = faceImage.match(/^data:(.+);base64,(.+)$/);
    if (!base64Match) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }
    
    const mimeType = base64Match[1];
    const base64Data = base64Match[2];

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data
        }
      },
      "Generate a full-body portrait based on this face photo. Keep the same facial features, hairstyle, and overall appearance. Create a natural standing pose wearing casual modern clothing. The image should be a clean, professional portrait photo with good lighting on a simple background. Maintain the person's original characteristics and identity while showing their full body from head to toe."
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
    console.error('Error in generate-full-body-from-face API:', error);
    return NextResponse.json(
      { error: `Failed to generate image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { withApiLimit } from '@/lib/with-api-limit';

async function evaluateOutfitHandler(request: NextRequest, userId: string, requestId: string) {
  try {
    const { imageData, tpo } = await request.json();
    
    if (!imageData) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Gemini API設定の確認
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ 
        error: 'Gemini API key not configured.' 
      }, { status: 500 });
    }

    // ユーザーのプロフィール情報を取得
    const profileResponse = await fetch(`${request.nextUrl.origin}/api/profile`, {
      headers: {
        'Cookie': request.headers.get('cookie') || '',
      },
    });

    let profileData = null;
    if (profileResponse.ok) {
      profileData = await profileResponse.json();
    }

    // Gemini APIの初期化
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-image-preview" });

    // 画像データの処理
    const imageMatch = imageData.match(/^data:(.+);base64,(.*)$/);
    if (!imageMatch) {
      return NextResponse.json({ error: 'Invalid image format' }, { status: 400 });
    }

    const imagePart = {
      inlineData: {
        mimeType: imageMatch[1],
        data: imageMatch[2],
      },
    };

    // プロフィール情報に基づくプロンプトの構築
    const profileContext = profileData ? `
【ユーザープロフィール情報】
- 骨格診断: ${profileData.frame_type || '未設定'}
- パーソナルカラー: ${profileData.personal_color || '未設定'}
` : `
【ユーザープロフィール情報】
- 骨格診断: 未設定
- パーソナルカラー: 未設定
`;

    // TPO情報の追加
    const tpoContext = tpo ? `
【TPO情報】
- シーン: ${tpo}
` : `
【TPO情報】
- シーン: 未指定
`;

    // 評価プロンプト
    const prompt = `あなたは、ユーザーのパーソナルカラー、骨格診断の結果、そしてTPOを考慮して、画像に対する専門的なアドバイスを行うAIファッションコンサルタントです。

${profileContext}
${tpoContext}

以下の評価項目に基づき、画像内のコーディネートを詳細に評価してください。

【評価項目】
- トレンド感：最新のファッショントレンドに合っているか
- 配色：パーソナルカラーとの調和、TPOにふさわしいか
- シルエット：骨格診断の結果を踏まえた、体型に合ったシルエットか
- スタイルの一貫性：カジュアル、クラシックなどのスタイルが統一されているか
- 全体のバランス：各アイテムの組み合わせ、雰囲気が調和しているか

【重要】回答は必ず以下のJSON形式のみで返してください。他の説明文は一切含めないでください。

\`\`\`json
{
  "trendScore": 数値(1-10),
  "colorScore": 数値(1-10),
  "silhouetteScore": 数値(1-10),
  "styleScore": 数値(1-10),
  "balanceScore": 数値(1-10),
  "goodPoints": [
    "良かった点1（150字以内で具体的な理由も含めて記述）",
    "良かった点2（150字以内で具体的な理由も含めて記述）"
  ],
  "improvements": [
    "改善点1（150字以内で具体的な理由も含めて記述）",
    "改善点2（150字以内で具体的な理由も含めて記述）"
  ],
  "recommendation": "さらにコーディネートを良くするための具体的な提案（300字以内）"
}
\`\`\`

「良かった点」と「改善点」を明確に分け、二点ずつ、それぞれ150字以内で、具体的な理由も含め箇条書きで記述してください。専門用語は避け、誰にでも分かりやすい言葉で説明してください。最終的なアドバイスとして、さらにコーディネートを良くするための具体的な提案を300字以内で加えてください。`;

    // Gemini APIにリクエストを送信
    const result = await model.generateContent([prompt, imagePart]);
    const response = result.response;
    
    // レスポンスからテキストを取得
    const evaluationText = response.text();
    console.log('Raw Gemini response:', evaluationText);
    
    // JSON形式の評価結果をパース
    let evaluationResult;
    try {
      // JSON形式のテキストを抽出（```json で囲まれている可能性がある）
      let jsonText = evaluationText;
      const jsonMatch = evaluationText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      } else {
        // ``` がない場合は、最初の { から最後の } までを抽出
        const startIndex = evaluationText.indexOf('{');
        const lastIndex = evaluationText.lastIndexOf('}');
        if (startIndex !== -1 && lastIndex !== -1 && lastIndex > startIndex) {
          jsonText = evaluationText.substring(startIndex, lastIndex + 1);
        }
      }
      
      evaluationResult = JSON.parse(jsonText);
      console.log('Parsed evaluation result:', evaluationResult);
    } catch (parseError) {
      console.error('Failed to parse evaluation result:', parseError);
      console.error('Raw text that failed to parse:', evaluationText);
      // JSONパースに失敗した場合は、テキストベースの評価を返す
      return NextResponse.json({
        success: true,
        evaluationText: evaluationText,
        isTextFormat: true
      });
    }

    // スコアの検証と調整
    const validateScore = (score: any): number => {
      if (typeof score === 'number' && score >= 1 && score <= 10) {
        return score;
      }
      return 5; // デフォルト値
    };

    const validatedResult = {
      ...evaluationResult,
      trendScore: validateScore(evaluationResult.trendScore),
      colorScore: validateScore(evaluationResult.colorScore),
      silhouetteScore: validateScore(evaluationResult.silhouetteScore),
      styleScore: validateScore(evaluationResult.styleScore),
      balanceScore: validateScore(evaluationResult.balanceScore),
    };

    return NextResponse.json({
      success: true,
      evaluation: validatedResult,
      isTextFormat: false
    });
    
  } catch (error) {
    console.error('Error in evaluate-outfit-gemini API:', error);
    return NextResponse.json(
      { error: `Failed to evaluate outfit: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export const POST = withApiLimit(evaluateOutfitHandler);

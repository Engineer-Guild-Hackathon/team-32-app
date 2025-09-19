import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { withApiLimit } from '@/lib/with-api-limit'

const IMAGE_ERROR_MESSAGE = '画像データが不足しています'

const extractImagePart = (dataUrl: unknown) => {
  if (typeof dataUrl !== 'string' || dataUrl.trim() === '') {
    return null
  }

  const match = dataUrl.match(/^data:(.+);base64,(.*)$/)
  if (!match) {
    return null
  }

  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  }
}

const generatePrompt = (tpo?: string) => `あなたはファッションスタイリストです。以下の3枚の画像を参照して、提案された入れ替えがなぜ効果的なのかを分析し、日本語で説明してください。

- 画像1: 現在のコーディネート全体
- 画像2: 元のアイテム
- 画像3: 入れ替え後のアイテム

${tpo ? `シーン: ${tpo}` : 'シーン情報はありません。'}

以下の点を簡潔に解説してください。
1. 入れ替えによって改善されるポイント（色、素材、シルエット、TPO適合など）
2. 元のアイテムで気になる点
3. 入れ替え後のアイテムがもたらす具体的なメリット

各項目は箇条書きで2〜3行程度、分かりやすい言葉で説明してください。余計な枕詞や挨拶は不要です。`

async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const { outfitImage, originalItemImage, replacementItemImage, tpo } = await request.json()

    const outfitPart = extractImagePart(outfitImage)
    const originalPart = extractImagePart(originalItemImage)
    const replacementPart = extractImagePart(replacementItemImage)

    if (!outfitPart || !originalPart || !replacementPart) {
      return NextResponse.json({ success: false, error: IMAGE_ERROR_MESSAGE }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'Gemini API key not configured.' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = generatePrompt(typeof tpo === 'string' && tpo.trim() !== '' ? tpo : undefined)

    const result = await model.generateContent([
      prompt,
      { text: '【画像1】現在のコーディネート' },
      outfitPart,
      { text: '【画像2】元のアイテム' },
      originalPart,
      { text: '【画像3】入れ替え後のアイテム' },
      replacementPart,
    ])

    const text = result.response.text().trim()

    if (!text) {
      return NextResponse.json({ success: false, error: 'Geminiからの解説を取得できませんでした' }, { status: 500 })
    }

    return NextResponse.json({ success: true, explanation: text })
  } catch (error) {
    console.error('Failed to generate improvement explanation:', error)
    return NextResponse.json({ success: false, error: '改善案の解説生成に失敗しました' }, { status: 500 })
  }
}

export const POST = withApiLimit(async (request, _userId, _requestId) => handler(request))

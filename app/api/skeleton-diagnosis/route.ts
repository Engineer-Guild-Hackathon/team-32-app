import { NextRequest, NextResponse } from 'next/server'

interface DiagnosisAnswers {
  question1: boolean // 上半身より下半身に厚みがある
  question2: boolean // 骨や節が太く筋張って目立つ
  question3: boolean // 肩回りが丸く腰の上に肉がつく
  question4: boolean // 首が短く鎖骨が出ない
  question5: boolean // 手のひらが厚く丸い
  question6: boolean // 肩幅が目立つ
}

interface DiagnosisResult {
  frameType: 'straight' | 'wave' | 'natural'
  confidence: number
  reasoning: string
}

export async function POST(request: NextRequest) {
  try {
    const { question1, question2, question3, question4, question5, question6 }: DiagnosisAnswers = await request.json()

    // フローチャートに基づく判定ロジック
    // 回答の順序: [一問目, 二問目, 三問目]
    const q1 = question1 // 上半身より下半身に厚みがある
    const q2 = question2 // 二問目の回答（骨や節 または 肩回り）
    const q3 = question3 // 三問目の回答（手のひら または 首と鎖骨）

    let frameType: 'straight' | 'wave' | 'natural'
    let confidence: number
    let reasoning: string

    if (q1) {
      // 一問目がYes→二問目は「骨や節が太く筋張って目立つ」
      if (q2) {
        // 二問目がYes→三問目は「手のひらが厚く丸い」
        if (q3) {
          // 三問目がYes→ストレート
          frameType = 'straight'
          confidence = 90
          reasoning = '下半身に厚みがあり、骨や節が太く筋張って目立ち、手のひらが厚く丸い特徴から、ストレートタイプと判定されました。'
        } else {
          // 三問目がNo→ナチュラル
          frameType = 'natural'
          confidence = 85
          reasoning = '下半身に厚みがあり、骨や節が太く筋張って目立つが、手のひらは薄く細長い特徴から、ナチュラルタイプと判定されました。'
        }
      } else {
        // 二問目がNo→三問目は「肩幅が目立つ」
        if (q3) {
          // 三問目がYes→ナチュラル
          frameType = 'natural'
          confidence = 85
          reasoning = '下半身に厚みがあり、骨や節は細く繊細だが、肩幅が目立つ特徴から、ナチュラルタイプと判定されました。'
        } else {
          // 三問目がNo→ウェーブ
          frameType = 'wave'
          confidence = 90
          reasoning = '下半身に厚みがあり、骨や節は細く繊細で、肩幅も目立たない特徴から、ウェーブタイプと判定されました。'
        }
      }
    } else {
      // 一問目がNo→二問目は「肩回りが丸く腰の上に肉がつく」
      if (q2) {
        // 二問目がYes→三問目は「首が短く鎖骨が出ない」
        if (q3) {
          // 三問目がYes→ストレート
          frameType = 'straight'
          confidence = 90
          reasoning = '上半身の方が厚く、肩回りが丸く腰の上に肉がつき、首が短く鎖骨が出ない特徴から、ストレートタイプと判定されました。'
        } else {
          // 三問目がNo→ウェーブ
          frameType = 'wave'
          confidence = 85
          reasoning = '上半身の方が厚く、肩回りが丸く腰の上に肉がつくが、首が長く鎖骨が目立つ特徴から、ウェーブタイプと判定されました。'
        }
      } else {
        // 二問目がNo→三問目は「手のひらが厚く丸い」
        if (q3) {
          // 三問目がYes→ストレート
          frameType = 'straight'
          confidence = 85
          reasoning = '上半身の方が厚く、肩回りは角張り腰回りはすっきりし、手のひらが厚く丸い特徴から、ストレートタイプと判定されました。'
        } else {
          // 三問目がNo→ウェーブ
          frameType = 'wave'
          confidence = 90
          reasoning = '上半身の方が厚く、肩回りは角張り腰回りはすっきりし、手のひらは薄く細長い特徴から、ウェーブタイプと判定されました。'
        }
      }
    }

    const result: DiagnosisResult = {
      frameType,
      confidence,
      reasoning
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('骨格診断エラー:', error)
    return NextResponse.json(
      { error: '骨格診断に失敗しました' },
      { status: 500 }
    )
  }
}

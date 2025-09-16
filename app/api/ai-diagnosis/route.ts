import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { image } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: '画像データが提供されていません' },
        { status: 400 }
      )
    }

    const apiEndpoint = process.env.ROBOFLOW_API_ENDPOINT
    const apiKey = process.env.ROBOFLOW_API_KEY

    if (!apiEndpoint || !apiKey) {
      console.error('Roboflow API configuration is missing')
      return NextResponse.json(
        { error: 'サーバー設定エラーが発生しました' },
        { status: 500 }
      )
    }

    const response = await fetch(
      apiEndpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          inputs: {
            image: {
              type: 'base64',
              value: image,
            },
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Roboflow API error:', errorText)
      return NextResponse.json(
        { error: 'AI診断APIエラーが発生しました' },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Roboflow API response data:', JSON.stringify(data, null, 2))

    // Extract and process predictions from outputs format
    const predictions = data?.outputs?.[0]?.predictions?.predictions

    if (predictions) {
      // Map class names and sort by confidence
      const processedResults = predictions
        .map((pred: any) => ({
          class: mapColorClass(pred.class),
          confidence: pred.confidence,
        }))
        .sort((a: any, b: any) => b.confidence - a.confidence)

      return NextResponse.json({ results: processedResults })
    } else {
      console.error('Unexpected response format:', data)
      return NextResponse.json(
        { error: '診断結果の形式が予期したものと異なります' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('AI diagnosis error:', error)
    return NextResponse.json(
      { error: '診断処理中にエラーが発生しました' },
      { status: 500 }
    )
  }
}

function mapColorClass(className: string): string {
  const colorMap: Record<string, string> = {
    spring: 'spring',
    autumn: 'autumn',
    fall: 'autumn',
    summer: 'summer',
    winter: 'winter',
  }

  return colorMap[className.toLowerCase()] || className
}
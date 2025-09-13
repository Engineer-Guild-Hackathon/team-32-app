import { GoogleGenerativeAI } from '@google/generative-ai';

// Gemini APIの初期化
const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
);

export interface ImageGenerationResponse {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

// サポートする画像ファイル形式を定義
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Helper to convert File to base64 for API
async function fileToBase64(file: File): Promise<string> {
  // 手順1: ファイルのMIMEタイプを検証する
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    // サポートされていない形式の場合は、エラーを発生させて処理を中断する
    throw new Error(`Unsupported file type: ${file.type}. Please use JPEG, PNG, or WebP.`);
  }

  // 手順2: 検証をパスした場合のみ、Base64への変換処理に進む
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

// 服のアイテム画像生成
export async function generateClothingItemImage(
  clothingDescription: string
): Promise<ImageGenerationResponse> {
  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: clothingDescription }),
    });
    
    const data = await response.json();
    
    if (data.success && data.imageUrl) {
      return { success: true, imageUrl: data.imageUrl };
    } else {
      return { success: false, error: data.error || 'Failed to generate image from API' };
    }
  } catch (error) {
    console.error('Error generating clothing item image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}


// 着せ替え画像生成（画像同士）
export async function generateDressUpImageFromImages(
  userImage: File,
  clothingImages: string[]
): Promise<ImageGenerationResponse> {
  try {
    const userImageBase64 = await fileToBase64(userImage);

    const response = await fetch('/api/generate-dress-up-image-to-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userImage: userImageBase64, clothingImages }),
    });
    
    const data = await response.json();
    
    if (data.success && data.imageUrl) {
      return { success: true, imageUrl: data.imageUrl };
    } else {
      return { success: false, error: data.error || 'Failed to generate dress-up image from API' };
    }
  } catch (error) {
    console.error('Error generating dress-up image from images:', error);

    // Request Entity Too Largeエラーの検出と処理
    if (error instanceof Error) {
      if (error.message.includes('Request En') || error.message.includes('413') || error.message.includes('too large')) {
        return {
          success: false,
          error: '画像サイズが大きすぎます。画像は自動的に圧縮されますが、それでも大きすぎる場合は、より小さい画像を使用してください。',
        };
      }
      if (error.message.includes('Unexpected token') && error.message.includes('is not valid JSON')) {
        return {
          success: false,
          error: 'サーバーからの応答が正しくありません。画像サイズが大きすぎる可能性があります。',
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

// 着せ替え評価のインターフェース
export interface OutfitEvaluation {
  trendScore: number;
  colorScore: number;
  silhouetteScore: number;
  styleScore: number;
  balanceScore: number;
  goodPoints: string[];
  improvements: string[];
  recommendation: string;
}

export interface OutfitEvaluationResponse {
  success: boolean;
  evaluation?: OutfitEvaluation;
  evaluationText?: string;
  isTextFormat?: boolean;
  error?: string;
}

// 着せ替え評価（Geminiベース）
export async function evaluateOutfitWithGemini(
  imageData: string,
  tpo?: string
): Promise<OutfitEvaluationResponse> {
  try {
    const response = await fetch('/api/evaluate-outfit-gemini', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ imageData, tpo }),
    });
    
    const data = await response.json();
    
    if (data.success) {
      return {
        success: true,
        evaluation: data.evaluation,
        evaluationText: data.evaluationText,
        isTextFormat: data.isTextFormat,
      };
    } else {
      return {
        success: false,
        error: data.error || 'Failed to evaluate outfit',
      };
    }
  } catch (error) {
    console.error('Error evaluating outfit with Gemini:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}


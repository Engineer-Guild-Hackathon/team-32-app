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

// 着せ替え画像生成
export async function generateDressUpImage(
  items: Array<{ name: string; color: string; brand?: string }>,
  userImage?: File
): Promise<ImageGenerationResponse> {
  try {
    const response = await fetch('/api/generate-dress-up', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items, userImage }),
    });
    
    const data = await response.json();
    
    if (data.success && data.imageUrl) {
      return { success: true, imageUrl: data.imageUrl };
    } else {
      return { success: false, error: data.error || 'Failed to generate dress-up image from API' };
    }
  } catch (error) {
    console.error('Error generating dress-up image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}


import { NextRequest, NextResponse } from 'next/server';
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

    const { imageData } = await request.json();
    
    if (!imageData) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Dify API設定の確認
    const difyApiEndpoint = process.env.DIFY_API_ENDPOINT;
    const difyApiKey = process.env.DIFY_API_KEY;

    if (!difyApiEndpoint || !difyApiKey) {
      return NextResponse.json({ 
        error: 'Dify API configuration is missing. Please set DIFY_API_ENDPOINT and DIFY_API_KEY environment variables.' 
      }, { status: 500 });
    }

    // ファイルをDifyにアップロード
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const binaryData = Buffer.from(base64Data, 'base64');
    const imageFile = new File([binaryData], 'outfit.jpg', { type: 'image/jpeg' });

    const fileUploadUrl = `${difyApiEndpoint}/files/upload`;
    const uploadFormData = new FormData();
    uploadFormData.append('file', imageFile);
    uploadFormData.append('user', 'webapp');

    const uploadResponse = await fetch(fileUploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${difyApiKey}`,
      },
      body: uploadFormData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('File upload error:', errorText);
      return NextResponse.json({
        error: `File upload failed: ${uploadResponse.status} ${errorText}`
      }, { status: 500 });
    }

    const uploadResult = await uploadResponse.json();
    const fileId = uploadResult.id;

    // ワークフローを実行
    const difyResponse = await fetch(`${difyApiEndpoint}/workflows/run`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${difyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: {
          image: {
            transfer_method: 'local_file',
            upload_file_id: fileId,
            type: 'image',
          }
        },
        response_mode: 'blocking',
        user: 'webapp'
      })
    });

    if (!difyResponse.ok) {
      const errorText = await difyResponse.text();
      console.error('Dify API error:', errorText);
      return NextResponse.json({ 
        error: `Dify API request failed: ${difyResponse.status} ${difyResponse.statusText}` 
      }, { status: 500 });
    }

    const difyResult = await difyResponse.json();

    // outputs.text からテキストを抽出
    const evaluationText = difyResult.data?.outputs?.text;
    
    return NextResponse.json({ 
      success: true, 
      evaluationText 
    });
    
  } catch (error) {
    console.error('Error in evaluate-outfit API:', error);
    return NextResponse.json(
      { error: `Failed to evaluate outfit: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}



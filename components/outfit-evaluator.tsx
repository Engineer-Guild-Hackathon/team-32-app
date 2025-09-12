'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Loader2, Upload } from 'lucide-react';
import { evaluateOutfitWithGemini } from '@/lib/gemini';

interface OutfitEvaluatorProps {
  imageUrl?: string;
}

export function OutfitEvaluator({ imageUrl: propImageUrl }: OutfitEvaluatorProps) {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tpo, setTpo] = useState<string>('');
  
  // プロパティで渡された画像URLまたはアップロードされた画像URLを使用
  const currentImageUrl = propImageUrl || uploadedImageUrl;
  
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImageUrl(result);
        setError(null);
        setEvaluationResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const evaluateOutfit = async () => {
    if (!currentImageUrl) {
      setError('評価する画像がありません');
      return;
    }

    setIsEvaluating(true);
    setError(null);
    setEvaluationResult(null);
    
    try {
      const result = await evaluateOutfitWithGemini(currentImageUrl, tpo || undefined);
      
      if (result.success) {
        setEvaluationResult(result);
      } else {
        setError(result.error || '評価に失敗しました');
      }
    } catch (error) {
      console.error('Evaluation failed:', error);
      setError('評価の実行中にエラーが発生しました');
    } finally {
      setIsEvaluating(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          着せ替え評価
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!currentImageUrl ? (
          <div className="space-y-4">
            <div className="aspect-[3/4] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
                id="evaluation-image" 
              />
              <label htmlFor="evaluation-image" className="cursor-pointer text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium mb-2">画像をアップロード</p>
                <p className="text-sm text-muted-foreground">評価する着せ替え画像を選択してください</p>
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="aspect-[3/4] border rounded-lg overflow-hidden bg-muted">
              <img
                src={currentImageUrl}
                alt="Evaluation target"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                TPO（シーン）
              </label>
              <select
                value={tpo}
                onChange={(e) => setTpo(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md"
              >
                <option value="">選択してください</option>
                <option value="カジュアル">カジュアル</option>
                <option value="ビジネス">ビジネス</option>
                <option value="フォーマル">フォーマル</option>
                <option value="デート">デート</option>
                <option value="パーティー">パーティー</option>
                <option value="旅行">旅行</option>
                <option value="スポーツ">スポーツ</option>
              </select>
            </div>
            
            <Button 
              onClick={evaluateOutfit} 
              disabled={isEvaluating}
              className="w-full"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  評価中...
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 mr-2" />
                  評価を実行
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setUploadedImageUrl(null);
                setEvaluationResult(null);
                setError(null);
              }}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              別の画像をアップロード
            </Button>
          </div>
        )}
        
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {evaluationResult && (
          <div className="mt-4 space-y-4">
            {evaluationResult.isTextFormat ? (
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">評価結果</h3>
                <div className="whitespace-pre-wrap text-sm">
                  {evaluationResult.evaluationText}
                </div>
              </div>
            ) : evaluationResult.evaluation ? (
              <div className="space-y-4">
                {evaluationResult.evaluation.goodPoints.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-green-800">良かった点</h4>
                    <ul className="space-y-1 text-sm text-green-700">
                      {evaluationResult.evaluation.goodPoints.map((point: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-green-500">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {evaluationResult.evaluation.improvements.length > 0 && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-orange-800">改善点</h4>
                    <ul className="space-y-1 text-sm text-orange-700">
                      {evaluationResult.evaluation.improvements.map((improvement: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-orange-500">•</span>
                          <span>{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {evaluationResult.evaluation.recommendation && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-2 text-blue-800">アドバイス</h4>
                    <p className="text-sm text-blue-700">
                      {evaluationResult.evaluation.recommendation}
                    </p>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

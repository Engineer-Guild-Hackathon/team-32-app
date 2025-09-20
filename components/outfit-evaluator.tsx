'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Loader2, Upload, ArrowRight } from 'lucide-react';
import { evaluateOutfitWithGemini, explainImprovementWithGemini } from '@/lib/gemini';
import { UsageConfirmationDialog } from '@/components/usage-confirmation-dialog';
import type { ClothingItem } from '@/lib/types/clothing';
import { categoryConfig as clothingCategoryConfig } from '@/lib/types/clothing';

interface OutfitEvaluatorProps {
  imageUrl?: string;
  selectedItems?: ClothingItem[];
}

type ImprovementSuggestion = {
  originalItem: { id: string; category: ClothingItem['category']; imageUrl: string | null };
  replacementItem: { id: string; category: ClothingItem['category']; imageUrl: string | null };
};

export function OutfitEvaluator({ imageUrl: propImageUrl, selectedItems = [] }: OutfitEvaluatorProps) {
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tpo, setTpo] = useState<string>('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [improvementSuggestion, setImprovementSuggestion] = useState<ImprovementSuggestion | null>(null);
  const [isFetchingImprovement, setIsFetchingImprovement] = useState(false);
  const [improvementError, setImprovementError] = useState<string | null>(null);
  const [improvementExplanation, setImprovementExplanation] = useState<string | null>(null);
  const [isFetchingImprovementExplanation, setIsFetchingImprovementExplanation] = useState(false);
  const [improvementExplanationError, setImprovementExplanationError] = useState<string | null>(null);

  // プロパティで渡された画像URLまたはアップロードされた画像URLを使用
  const currentImageUrl = propImageUrl || uploadedImageUrl;
  const hasPropImage = Boolean(propImageUrl);
  const selectedItemsToDisplay = hasPropImage ? selectedItems : [];

  useEffect(() => {
    setImprovementSuggestion(null);
    setImprovementError(null);
    setIsFetchingImprovement(false);
    setImprovementExplanation(null);
    setImprovementExplanationError(null);
    setIsFetchingImprovementExplanation(false);
  }, [selectedItems, currentImageUrl]);

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

  const handleEvaluateClick = () => {
    if (!currentImageUrl) {
      setError('評価する画像がありません');
      return;
    }

    setShowConfirmDialog(true);
  };

  const evaluateOutfit = async () => {
    setIsEvaluating(true);
    setError(null);
    setEvaluationResult(null);
    setImprovementSuggestion(null);
    setImprovementError(null);
    setIsFetchingImprovement(false);
    setImprovementExplanation(null);
    setImprovementExplanationError(null);
    setIsFetchingImprovementExplanation(false);
    
    if (!currentImageUrl) {
      setError('評価する画像がありません');
      setIsEvaluating(false);
      return;
    }

    const selectedItemIds = selectedItemsToDisplay.map((item) => item.id);
    const shouldFetchImprovement = selectedItemIds.length > 0;

    if (shouldFetchImprovement) {
      setIsFetchingImprovement(true);
      setIsFetchingImprovementExplanation(true);
    }

    const evaluationPromise = evaluateOutfitWithGemini(currentImageUrl, tpo || undefined);
    const improvementPromise = shouldFetchImprovement
      ? fetchImprovementSuggestionData(selectedItemIds)
      : Promise.resolve({ suggestion: null, error: null });

    try {
      const [evaluation, improvement] = await Promise.all([evaluationPromise, improvementPromise]);

      if (evaluation.success) {
        let explanationResult: { explanation: string | null; error: string | null } = {
          explanation: null,
          error: null,
        };

        if (improvement.suggestion && currentImageUrl) {
          explanationResult = await fetchImprovementExplanationData({
            suggestion: improvement.suggestion,
            outfitImage: currentImageUrl,
          });
        }

        setImprovementSuggestion(improvement.suggestion);
        setImprovementError(improvement.error);
        setImprovementExplanation(explanationResult.explanation);
        setImprovementExplanationError(explanationResult.error);
        setEvaluationResult(evaluation);
      } else {
        setError(evaluation.error || '評価に失敗しました');
      }
    } catch (error) {
      console.error('Evaluation failed:', error);
      setError('評価の実行中にエラーが発生しました');
    } finally {
      setIsEvaluating(false);
      setIsFetchingImprovement(false);
      setIsFetchingImprovementExplanation(false);
    }
  };

  const ensureDataUrl = async (source?: string | null): Promise<string | null> => {
    if (!source || source.trim() === '') {
      return null;
    }

    if (source.startsWith('data:')) {
      return source;
    }

    try {
      const headers: HeadersInit = {};
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
      } catch (authError) {
        console.warn('Failed to prepare auth headers for image fetch:', authError);
      }

      const response = await fetch(source, { headers });

      if (!response.ok) {
        throw new Error(`画像の取得に失敗しました (status: ${response.status})`);
      }

      const blob = await response.blob();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('画像データの変換に失敗しました'));
          }
        };
        reader.onerror = () => reject(new Error('画像データの読み込みに失敗しました'));
        reader.readAsDataURL(blob);
      });

      return dataUrl;
    } catch (fetchError) {
      console.error('Failed to convert image to data URL:', fetchError);
      return null;
    }
  };

  const fetchImprovementSuggestionData = async (
    selectedItemIds: string[]
  ): Promise<{ suggestion: ImprovementSuggestion | null; error: string | null }> => {
    if (selectedItemIds.length === 0) {
      return { suggestion: null, error: null };
    }

    try {
      const response = await fetch('/api/outfit-improvement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          selectedItemIds,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data) {
        throw new Error('Unexpected response');
      }

      const ignoredItemIds: string[] = Array.isArray(data.ignoredItemIds)
        ? data.ignoredItemIds.filter((id: unknown): id is string => typeof id === 'string' && id.trim() !== '')
        : [];

      if (!data.success) {
        const message =
          data.reason === 'NO_REPLACEMENT_CANDIDATE'
            ? '同じカテゴリの代替アイテムが見つかりませんでした'
            : data.reason === 'ACCESSORY_CATEGORY_EXCLUDED'
            ? '小物は現在改善案の対象外です'
            : data.reason === 'NO_VALID_SELECTION'
            ? '選択したアイテムの埋め込みが未登録のため改善案を生成できませんでした'
            : data.error || '改善案の取得に失敗しました';
        return { suggestion: null, error: message };
      }

      if (!data.suggestion && ignoredItemIds.length === selectedItemIds.length && ignoredItemIds.length > 0) {
        return {
          suggestion: null,
          error: '選択したアイテムの埋め込みが未登録のため改善案を生成できませんでした',
        };
      }

      return { suggestion: data.suggestion, error: null };
    } catch (fetchError) {
      console.error('Failed to fetch improvement suggestion:', fetchError);
      return { suggestion: null, error: '改善案の取得中にエラーが発生しました' };
    }
  };

  const fetchImprovementExplanationData = async ({
    suggestion,
    outfitImage,
  }: {
    suggestion: ImprovementSuggestion;
    outfitImage: string;
  }): Promise<{ explanation: string | null; error: string | null }> => {
    const outfitImageDataUrl = await ensureDataUrl(outfitImage);
    const originalItem = selectedItemsToDisplay.find((item) => item.id === suggestion.originalItem.id);
    const originalImageDataUrl = await ensureDataUrl(originalItem?.imageUrl ?? suggestion.originalItem.imageUrl);
    const replacementImageDataUrl = await ensureDataUrl(suggestion.replacementItem.imageUrl);

    if (!outfitImageDataUrl) {
      return { explanation: null, error: 'コーディネート画像を準備できませんでした' };
    }

    if (!originalImageDataUrl || !replacementImageDataUrl) {
      return { explanation: null, error: '改善案のアイテム画像を取得できませんでした' };
    }

    try {
      const response = await explainImprovementWithGemini({
        outfitImage: outfitImageDataUrl,
        originalItemImage: originalImageDataUrl,
        replacementItemImage: replacementImageDataUrl,
        tpo: tpo || undefined,
      });

      if (response.success && response.explanation) {
        return { explanation: response.explanation, error: null };
      }
    } catch (explanationError) {
      console.error('Failed to generate improvement explanation:', explanationError);
      return { explanation: null, error: '改善案の解説生成中にエラーが発生しました' };
    }

    return { explanation: null, error: '改善案の解説生成に失敗しました' };
  };

  const originalItemFromSelection = improvementSuggestion
    ? selectedItemsToDisplay.find((item) => item.id === improvementSuggestion.originalItem.id)
    : undefined;
  const originalImageUrl = improvementSuggestion
    ? originalItemFromSelection?.imageUrl ?? improvementSuggestion.originalItem.imageUrl ?? undefined
    : undefined;
  const replacementImageUrl = improvementSuggestion?.replacementItem.imageUrl ?? undefined;
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5" />
          Check
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

              {hasPropImage && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-700">選択したアイテム</h3>
                  {selectedItemsToDisplay.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {selectedItemsToDisplay.map((item) => {
                        const categoryLabel = clothingCategoryConfig[item.category]?.name ?? item.category;
                        return (
                          <div key={item.id} className="border rounded-md overflow-hidden bg-white">
                            <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                              {item.imageUrl ? (
                                <img
                                  src={item.imageUrl}
                                  alt={`${categoryLabel} アイテム`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="flex flex-col items-center justify-center text-gray-400 text-[11px] gap-1">
                                  <Upload className="w-4 h-4" />
                                  画像なし
                                </div>
                              )}
                            </div>
                            <div className="px-2 py-1">
                              <p className="text-xs font-semibold text-gray-700">{categoryLabel}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      アイテム情報が取得できませんでした。
                    </p>
                  )}
                </div>
              )}

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
                onClick={handleEvaluateClick} 
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
              {!hasPropImage && (
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
              )}
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
                <div className="text-sm leading-relaxed space-y-2 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4 [&_a]:text-blue-600">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {evaluationResult.evaluationText ?? ''}
                  </ReactMarkdown>
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

        {evaluationResult && (isFetchingImprovement || improvementSuggestion || improvementError) && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-800">入れ替え案</h4>
            {isFetchingImprovement ? (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm text-blue-700">
                <Loader2 className="w-4 h-4 animate-spin" />
                入れ替え案を取得中...
              </div>
            ) : improvementSuggestion ? (
              <div className="mt-3 flex items-center justify-center gap-4">
                <div className="w-20 h-20 border border-blue-100 rounded-md overflow-hidden bg-white flex items-center justify-center">
                  {originalImageUrl ? (
                    <img
                      src={originalImageUrl}
                      alt="元のアイテム"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-blue-300 text-[11px] gap-1">
                      <Upload className="w-4 h-4" />
                      画像なし
                    </div>
                  )}
                </div>
                <ArrowRight className="w-6 h-6 text-blue-500" />
                <div className="w-20 h-20 border border-blue-100 rounded-md overflow-hidden bg-white flex items-center justify-center">
                  {replacementImageUrl ? (
                    <img
                      src={replacementImageUrl}
                      alt="提案アイテム"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-blue-300 text-[11px] gap-1">
                      <Upload className="w-4 h-4" />
                      画像なし
                    </div>
                  )}
                </div>
              </div>
            ) : improvementError ? (
              <p className="mt-3 text-xs text-center text-red-600">{improvementError}</p>
            ) : null}
          </div>
        )}

        {evaluationResult && (isFetchingImprovementExplanation || improvementExplanation || improvementExplanationError) && (
          <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-800">入れ替え案の解説</h4>
            {isFetchingImprovementExplanation ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                解説を生成中...
              </div>
            ) : improvementExplanation ? (
              <div className="mt-2 text-sm leading-relaxed text-slate-700 space-y-2 [&_ul]:list-disc [&_ol]:list-decimal [&_li]:ml-4 [&_a]:text-blue-600">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {improvementExplanation}
                </ReactMarkdown>
              </div>
            ) : improvementExplanationError ? (
              <p className="mt-2 text-xs text-red-600 text-center">{improvementExplanationError}</p>
            ) : null}
          </div>
        )}
      </CardContent>

      <UsageConfirmationDialog
        isOpen={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={evaluateOutfit}
        title="コーディネートを評価しますか？"
        description="この機能を使用すると、1回分の利用回数を消費します。"
      />
    </Card>
  );
}

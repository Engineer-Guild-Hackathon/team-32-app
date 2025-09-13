'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getBackgroundThemeByPersonalColor, 
  type BackgroundTheme,
  getAllBackgroundThemes
} from '@/lib/background-mapping';
import { usePersonalColor } from '@/hooks/use-user-profile';

interface BackgroundContextType {
  selectedBackground: string | null;
  setSelectedBackground: (backgroundId: string) => void;
  personalColor: string | null;
  isLoading: boolean;
  availableThemes: BackgroundTheme[];
  currentTheme: BackgroundTheme;
  refreshBackground: () => void;
}

const BackgroundContext = createContext<BackgroundContextType | undefined>(undefined);

export function useBackground() {
  const context = useContext(BackgroundContext);
  if (context === undefined) {
    throw new Error('useBackground must be used within a BackgroundProvider');
  }
  return context;
}

interface BackgroundProviderProps {
  children: React.ReactNode;
  defaultBackground?: string;
}

export function BackgroundProvider({ 
  children,
}: BackgroundProviderProps) {
  const { personalColor, isLoading, refetch } = usePersonalColor();
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);
  const availableThemes = getAllBackgroundThemes();

  // パーソナルカラーに基づく背景の自動設定
  useEffect(() => {
    console.log('BackgroundProvider - personalColor変更:', personalColor, 'isLoading:', isLoading)
    if (!isLoading) {
      const recommendedTheme = getBackgroundThemeByPersonalColor(personalColor);
      console.log('推奨背景テーマ:', recommendedTheme)
      setSelectedBackground(recommendedTheme.id);
    }
  }, [personalColor, isLoading]);

  const currentTheme = getBackgroundThemeByPersonalColor(personalColor);

  // 背景を強制更新する関数
  const refreshBackground = () => {
    refetch(); // プロフィールデータを再取得
  };

  const value: BackgroundContextType = {
    selectedBackground,
    setSelectedBackground,
    personalColor,
    isLoading,
    availableThemes,
    currentTheme,
    refreshBackground
  };

  return (
    <BackgroundContext.Provider value={value}>
      {children}
    </BackgroundContext.Provider>
  );
}

// ページ全体の背景コンポーネント（スマホ最適化）
interface MobilePageBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export function MobilePageBackground({ 
  children, 
  className = '' 
}: MobilePageBackgroundProps) {
  const { selectedBackground, availableThemes, isLoading } = useBackground();

  // 選択された背景テーマを取得（ローディング中は背景を表示しない）
  const selectedTheme = selectedBackground
    ? availableThemes.find(theme => theme.id === selectedBackground)
    : null;

  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* 背景画像（ローディングが完了してから表示） */}
      {!isLoading && selectedTheme && (
        <div
          className="fixed inset-0 -z-10"
          style={{
            backgroundImage: `url(${selectedTheme.imagePath})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed'
          }}
        >
          {/* オーバーレイ */}
          <div className="absolute inset-0 bg-white/15" />
        </div>
      )}
      
      {/* コンテンツ */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}

// 背景選択コンポーネント（スマホ最適化）
interface MobileBackgroundSelectorProps {
  className?: string;
}

export function MobileBackgroundSelector({ className = '' }: MobileBackgroundSelectorProps) {
  const { 
    selectedBackground, 
    setSelectedBackground, 
    personalColor, 
    availableThemes,
    currentTheme 
  } = useBackground();

  return (
    <div className={`space-y-3 ${className}`}>
      {/* パーソナルカラー情報 */}
      {personalColor && (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
              style={{
                backgroundImage: `url(${currentTheme.imagePath})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
            <div>
              <div className="text-sm font-medium">{personalColor}</div>
              <div className="text-xs text-gray-600">{currentTheme.name}</div>
            </div>
          </div>
        </div>
      )}

      {/* 背景選択 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-white/20">
        <h3 className="text-sm font-medium mb-3">背景を選択</h3>
        <div className="grid grid-cols-2 gap-2">
          {availableThemes.map((theme) => (
            <button
              key={theme.id}
              className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
                selectedBackground === theme.id 
                  ? 'ring-2 ring-blue-500 ring-offset-2' 
                  : 'hover:scale-105'
              }`}
              onClick={() => setSelectedBackground(theme.id)}
            >
              <div 
                className="w-full h-20"
                style={{
                  backgroundImage: `url(${theme.imagePath})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              />
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-1">
                <div className="text-xs font-medium truncate">{theme.name}</div>
              </div>
              {selectedBackground === theme.id && (
                <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

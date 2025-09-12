/**
 * パーソナルカラーと背景画像のマッピング定義
 */

export interface BackgroundTheme {
  id: string;
  name: string;
  imagePath: string;
  description: string;
}

export interface PersonalColorMapping {
  personalColor: string;
  backgroundTheme: BackgroundTheme;
}

// 背景テーマの定義
export const backgroundThemes: Record<string, BackgroundTheme> = {
  spring: {
    id: 'spring',
    name: '春の花畑',
    imagePath: '/backgrounds/spring-flowers.png',
    description: '桜と蝶が舞う春の花畑'
  },
  summer: {
    id: 'summer', 
    name: '夏のビーチ',
    imagePath: '/backgrounds/summer-beach.png',
    description: '青い海とヤシの木のビーチ'
  },
  autumn: {
    id: 'autumn',
    name: '秋の森',
    imagePath: '/backgrounds/autumn-forest.png', 
    description: '紅葉とリスがいる秋の森'
  },
  winter: {
    id: 'winter',
    name: '冬の雪景色',
    imagePath: '/backgrounds/winter-snow.png',
    description: '雪と雪の結晶の冬景色'
  }
};

// パーソナルカラーから背景テーマへのマッピング
export const personalColorBackgroundMapping: PersonalColorMapping[] = [
  // 春系パーソナルカラー → 春の花畑
  { personalColor: 'spring', backgroundTheme: backgroundThemes.spring },
  { personalColor: 'スプリング', backgroundTheme: backgroundThemes.spring },
  { personalColor: 'ライトスプリング', backgroundTheme: backgroundThemes.spring },
  { personalColor: 'ブライトスプリング', backgroundTheme: backgroundThemes.spring },
  
  // 夏系パーソナルカラー → 夏のビーチ
  { personalColor: 'summer', backgroundTheme: backgroundThemes.summer },
  { personalColor: 'サマー', backgroundTheme: backgroundThemes.summer },
  { personalColor: 'ライトサマー', backgroundTheme: backgroundThemes.summer },
  { personalColor: 'ソフトサマー', backgroundTheme: backgroundThemes.summer },
  
  // 秋系パーソナルカラー → 秋の森
  { personalColor: 'autumn', backgroundTheme: backgroundThemes.autumn },
  { personalColor: 'オータム', backgroundTheme: backgroundThemes.autumn },
  { personalColor: 'ソフトオータム', backgroundTheme: backgroundThemes.autumn },
  { personalColor: 'ディープオータム', backgroundTheme: backgroundThemes.autumn },
  
  // 冬系パーソナルカラー → 冬の雪景色
  { personalColor: 'winter', backgroundTheme: backgroundThemes.winter },
  { personalColor: 'ウィンター', backgroundTheme: backgroundThemes.winter },
  { personalColor: 'クールウィンター', backgroundTheme: backgroundThemes.winter },
  { personalColor: 'ディープウィンター', backgroundTheme: backgroundThemes.winter }
];

/**
 * パーソナルカラーから対応する背景テーマを取得する
 * @param personalColor ユーザーのパーソナルカラー
 * @returns 対応する背景テーマ、見つからない場合はデフォルト（春）を返す
 */
export function getBackgroundThemeByPersonalColor(personalColor: string | null | undefined): BackgroundTheme {
  if (!personalColor) {
    return backgroundThemes.spring; // デフォルト
  }
  
  const mapping = personalColorBackgroundMapping.find(
    item => item.personalColor.toLowerCase() === personalColor.toLowerCase()
  );
  
  return mapping?.backgroundTheme || backgroundThemes.spring; // デフォルト
}

/**
 * 利用可能なすべての背景テーマを取得する
 * @returns すべての背景テーマの配列
 */
export function getAllBackgroundThemes(): BackgroundTheme[] {
  return Object.values(backgroundThemes);
}

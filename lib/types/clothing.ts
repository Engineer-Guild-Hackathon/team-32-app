export type ClothingCategory = "tops" | "bottoms" | "shoes" | "accessories"

export interface ClothingItem {
  id: string
  category: ClothingCategory
  image_path: string
  created_at: string
  user_id: string
  imageUrl?: string
}

export const categoryConfig = {
  tops: {
    name: "トップス",
    iconName: "Shirt" as const,
  },
  bottoms: {
    name: "ボトムス",
    iconName: "Package" as const,
  },
  shoes: {
    name: "シューズ",
    iconName: "Footprints" as const,
  },
  accessories: {
    name: "小物",
    iconName: "Watch" as const,
  },
} as const
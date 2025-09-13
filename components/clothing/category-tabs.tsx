"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Shirt, Footprints, Watch } from "lucide-react"
import { PiPantsLight } from "react-icons/pi"
import type { ClothingCategory, ClothingItem } from "@/lib/types/clothing"
import { categoryConfig } from "@/lib/types/clothing"
import { ItemCard } from "./item-card"

interface CategoryTabsProps {
  items: ClothingItem[]
  activeCategory: ClothingCategory
  onCategoryChange: (category: ClothingCategory) => void
  onDeleteItem: (id: string) => Promise<void>
}

const iconMap = {
  Shirt: Shirt,
  PantsIcon: PiPantsLight,
  Footprints: Footprints,
  Watch: Watch,
} as const

export function CategoryTabs({ items, activeCategory, onCategoryChange, onDeleteItem }: CategoryTabsProps) {
  const getItemsByCategory = (category: ClothingCategory) => {
    return items.filter((item) => item.category === category)
  }

  return (
    <Tabs value={activeCategory} onValueChange={(value) => onCategoryChange(value as ClothingCategory)}>
      <TabsList className="grid w-full grid-cols-4 mb-4 bg-gray-100">
        {Object.entries(categoryConfig).map(([key, config]) => {
          const Icon = iconMap[config.iconName]
          const itemCount = getItemsByCategory(key as ClothingCategory).length
          const isActive = activeCategory === key
          return (
            <TabsTrigger 
              key={key} 
              value={key} 
              className={`gap-1 text-sm font-medium ${
                isActive 
                ? 'bg-blue-600 text-white data-[state=active]:text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-black' : ''}`} />
              <span className={`hidden sm:inline ${isActive ? 'text-black' : ''}`}>{config.name}</span>
              {itemCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className={`ml-1 text-xs ${
                    isActive 
                    ? 'bg-blue-500 text-white border-blue-500' 
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {itemCount}
                </Badge>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>

      {Object.entries(categoryConfig).map(([key, config]) => {
        const Icon = iconMap[config.iconName]
        const categoryItems = getItemsByCategory(key as ClothingCategory)
        
        return (
          <TabsContent key={key} value={key}>
            <div className="grid grid-cols-3 gap-2">
              {categoryItems.map((item) => (
                <ItemCard key={item.id} item={item} onDelete={onDeleteItem} />
              ))}

              {categoryItems.length === 0 && (
                <div className="col-span-3 text-center py-12">
                  <div className="text-muted-foreground">
                    <Icon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">まだ{config.name}がありません</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        )
      })}
    </Tabs>
  )
}
"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Shirt, Package, Footprints, Watch } from "lucide-react"
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
  Package: Package,
  Footprints: Footprints,
  Watch: Watch,
} as const

export function CategoryTabs({ items, activeCategory, onCategoryChange, onDeleteItem }: CategoryTabsProps) {
  const getItemsByCategory = (category: ClothingCategory) => {
    return items.filter((item) => item.category === category)
  }

  return (
    <Tabs value={activeCategory} onValueChange={(value) => onCategoryChange(value as ClothingCategory)}>
      <TabsList className="grid w-full grid-cols-4 mb-6">
        {Object.entries(categoryConfig).map(([key, config]) => {
          const Icon = iconMap[config.iconName]
          const itemCount = getItemsByCategory(key as ClothingCategory).length
          return (
            <TabsTrigger key={key} value={key} className="gap-2">
              <Icon className="w-4 h-4" />
              {config.name}
              {itemCount > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
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
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categoryItems.map((item) => (
                <ItemCard key={item.id} item={item} onDelete={onDeleteItem} />
              ))}

              {categoryItems.length === 0 && (
                <div className="col-span-full text-center py-12">
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
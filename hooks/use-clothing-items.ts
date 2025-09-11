import { useState, useEffect, useCallback } from "react"
import type { ClothingItem, ClothingCategory } from "@/lib/types/clothing"

export function useClothingItems() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    try {
      const response = await fetch('/api/items')
      if (response.ok) {
        const data = await response.json()
        setItems(data.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch items:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const addItem = useCallback((item: ClothingItem) => {
    setItems((prev) => [item, ...prev])
  }, [])

  const deleteItem = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/items/${id}/image`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id))
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      console.error('Failed to delete item:', error)
      throw error
    }
  }, [])

  const getItemsByCategory = useCallback((category: ClothingCategory) => {
    return items.filter((item) => item.category === category)
  }, [items])

  return {
    items,
    isLoading,
    addItem,
    deleteItem,
    getItemsByCategory,
    refreshItems: fetchItems
  }
}
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import type { ClothingCategory } from '@/lib/types/clothing'

type ItemRow = {
  id: string
  category: Database['public']['Enums']['item_category']
  image_path: string | null
}

type SuggestionItem = {
  id: string
  category: ClothingCategory
  imageUrl: string | null
}

type SuggestionResponse = {
  originalItem: SuggestionItem
  replacementItem: SuggestionItem
}

const buildImageUrl = (item: ItemRow): string | null => {
  if (!item.image_path) {
    return null
  }
  return `/api/items/${item.id}/image`
}

const toSuggestionItem = (item: ItemRow): SuggestionItem => ({
  id: item.id,
  category: item.category as ClothingCategory,
  imageUrl: buildImageUrl(item),
})

const getRandomElement = <T,>(items: T[]): T => {
  const index = Math.floor(Math.random() * items.length)
  return items[index]
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let payload: unknown
    try {
      payload = await request.json()
    } catch (error) {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
    }

    const selectedItemIds = Array.isArray((payload as any)?.selectedItemIds)
      ? (payload as any).selectedItemIds.filter((id: unknown): id is string => typeof id === 'string' && id.trim() !== '')
      : null

    if (!selectedItemIds || selectedItemIds.length === 0) {
      return NextResponse.json({ success: false, error: 'selectedItemIds must be a non-empty array of strings' }, { status: 400 })
    }

    const { data: allItems, error } = await supabase
      .from('items')
      .select('id, category, image_path')
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to fetch items:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch items' }, { status: 500 })
    }

    if (!allItems || allItems.length === 0) {
      return NextResponse.json({ success: false, error: 'No items available for the user' }, { status: 400 })
    }

    const itemsById = new Map(allItems.map((item) => [item.id, item]))
    const selectedItems: ItemRow[] = []

    for (const id of selectedItemIds) {
      const item = itemsById.get(id)
      if (!item) {
        return NextResponse.json({ success: false, error: `Selected item ${id} not found` }, { status: 400 })
      }
      selectedItems.push(item)
    }

    const eligibleItems = selectedItems.filter((item) => item.category !== 'accessories')

    if (eligibleItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Accessories are excluded from improvement suggestions',
        reason: 'ACCESSORY_CATEGORY_EXCLUDED',
      }, { status: 400 })
    }

    const candidates = eligibleItems
      .map((item) => {
        const replacements = allItems.filter((candidate) => candidate.category === item.category && candidate.id !== item.id)
        if (replacements.length === 0) {
          return null
        }
        return {
          original: item,
          replacements,
        }
      })
      .filter((candidate): candidate is { original: ItemRow; replacements: ItemRow[] } => candidate !== null)

    if (candidates.length === 0) {
      return NextResponse.json({ success: false, error: 'No replacement candidates found for the selected items', reason: 'NO_REPLACEMENT_CANDIDATE' })
    }

    const chosenCandidate = getRandomElement(candidates)
    const replacement = getRandomElement(chosenCandidate.replacements)

    const suggestion: SuggestionResponse = {
      originalItem: toSuggestionItem(chosenCandidate.original),
      replacementItem: toSuggestionItem(replacement),
    }

    return NextResponse.json({ success: true, suggestion })
  } catch (error) {
    console.error('Unexpected error while generating improvement suggestion:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

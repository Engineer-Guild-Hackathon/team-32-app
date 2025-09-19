import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'
import type { ClothingCategory } from '@/lib/types/clothing'

type ItemRow = {
  id: string
  category: Database['public']['Enums']['item_category']
  image_path: string | null
  embedding: number[] | null
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

type ClosetItemPayload = {
  id: string
  category: Database['public']['Enums']['item_category']
  embedding: number[]
}

type ImprovementServiceResponse = {
  improved: boolean
  original_score: number
  best_score: number
  suggestion: null | {
    original_item_id: string
    replacement_item_id: string
    score: number
  }
}

const normalizeEmbedding = (embedding: unknown): number[] | null => {
  if (Array.isArray(embedding)) {
    const values = embedding.map((value) => Number(value))
    return values.every((value) => Number.isFinite(value)) ? values : null
  }

  if (typeof embedding === 'string') {
    try {
      const parsed = JSON.parse(embedding)
      return normalizeEmbedding(parsed)
    } catch (error) {
      console.warn('Failed to parse embedding string:', error)
      return null
    }
  }

  if (embedding && typeof embedding === 'object' && 'length' in embedding && typeof (embedding as { length: unknown }).length === 'number') {
    try {
      const arrayLike = embedding as ArrayLike<unknown>
      const values = Array.from(arrayLike, (value) => Number(value))
      return values.length > 0 && values.every((value) => Number.isFinite(value)) ? values : null
    } catch (error) {
      console.warn('Failed to normalize embedding from array-like object:', error)
      return null
    }
  }

  if (embedding && typeof embedding === 'object') {
    try {
      const values = Object.values(embedding as Record<string, unknown>).map((value) => Number(value))
      return values.length > 0 && values.every((value) => Number.isFinite(value)) ? values : null
    } catch (error) {
      console.warn('Failed to normalize embedding from object:', error)
      return null
    }
  }

  return null
}

const isValidEmbedding = (embedding: unknown): embedding is number[] => {
  const normalized = normalizeEmbedding(embedding)
  return Array.isArray(normalized) && normalized.length > 0
}

const isImprovementServiceResponse = (data: unknown): data is ImprovementServiceResponse => {
  if (!data || typeof data !== 'object') {
    return false
  }

  const record = data as Record<string, unknown>
  const hasScores = typeof record.improved === 'boolean'
    && typeof record.original_score === 'number'
    && typeof record.best_score === 'number'

  if (!hasScores) {
    return false
  }

  if (record.suggestion === null) {
    return true
  }

  if (!record.suggestion || typeof record.suggestion !== 'object') {
    return false
  }

  const suggestion = record.suggestion as Record<string, unknown>

  return typeof suggestion.original_item_id === 'string'
    && typeof suggestion.replacement_item_id === 'string'
    && typeof suggestion.score === 'number'
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
      .select('id, category, image_path, embedding')
      .eq('user_id', user.id)

    if (error) {
      console.error('Failed to fetch items:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch items' }, { status: 500 })
    }

    if (!allItems || allItems.length === 0) {
      return NextResponse.json({ success: false, error: 'No items available for the user' }, { status: 400 })
    }

    const normalizedItems = allItems.map((item) => ({
      ...item,
      embedding: normalizeEmbedding(item.embedding) ?? null,
    })) satisfies ItemRow[]

    const itemsById = new Map(normalizedItems.map((item) => [item.id, item]))
    const selectedItems: ItemRow[] = []

    for (const id of selectedItemIds) {
      const item = itemsById.get(id)
      if (!item) {
        return NextResponse.json({ success: false, error: `Selected item ${id} not found` }, { status: 400 })
      }
      selectedItems.push(item)
    }

    const validSelectedItems = selectedItems.filter((item) => isValidEmbedding(item.embedding))
    const ignoredSelectedItems = selectedItems.filter((item) => !isValidEmbedding(item.embedding))
    const ignoredItemIds = ignoredSelectedItems.map((item) => item.id)

    if (validSelectedItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid embeddings available in the selected items',
        reason: 'NO_VALID_SELECTION',
        ignoredItemIds,
      })
    }

    const selectedIdSet = new Set(selectedItemIds)

    const replacementOptions = validSelectedItems
      .map((item) => {
        const candidates = normalizedItems.filter((candidate) =>
          candidate.category === item.category
          && candidate.id !== item.id
          && !selectedIdSet.has(candidate.id)
          && isValidEmbedding(candidate.embedding)
        )

        if (candidates.length === 0) {
          return null
        }

        return {
          original: item,
          candidates,
        }
      })
      .filter((entry): entry is { original: ItemRow; candidates: ItemRow[] } => entry !== null)

    if (replacementOptions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No replacement candidates found for the selected items',
        reason: 'NO_REPLACEMENT_CANDIDATE',
      }, { status: 400 })
    }

    const improvementApiBaseUrl = process.env.OUTFIT_COMPATIBILITY_API_URL

    if (!improvementApiBaseUrl) {
      return NextResponse.json({ success: false, error: 'Outfit compatibility API is not configured' }, { status: 500 })
    }

    const closetItemsPayload = new Map<string, ClosetItemPayload>()
    const addClosetItemPayload = (item: ItemRow) => {
      if (!isValidEmbedding(item.embedding) || closetItemsPayload.has(item.id)) {
        return
      }

      closetItemsPayload.set(item.id, {
        id: item.id,
        category: item.category,
        embedding: item.embedding as number[],
      })
    }

    validSelectedItems.forEach(addClosetItemPayload)
    replacementOptions.forEach(({ candidates }) => {
      candidates.forEach(addClosetItemPayload)
    })

    const requestBody = {
      selected_item_ids: validSelectedItems.map((item) => item.id),
      closet_items: Array.from(closetItemsPayload.values()),
    }

    const trimmedBaseUrl = improvementApiBaseUrl.replace(/\/+$/, '')
    const targetUrl = `${trimmedBaseUrl || improvementApiBaseUrl}/suggest-improvement`

    let improvementResponse: Response
    try {
      improvementResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
    } catch (fetchError) {
      console.error('Failed to call outfit compatibility service:', fetchError)
      return NextResponse.json({ success: false, error: 'Failed to call outfit compatibility service' }, { status: 502 })
    }

    let improvementPayload: unknown
    try {
      improvementPayload = await improvementResponse.json()
    } catch (parseError) {
      console.error('Failed to parse improvement service response:', parseError)
      return NextResponse.json({ success: false, error: 'Invalid response from outfit compatibility service' }, { status: 502 })
    }

    if (!improvementResponse.ok) {
      console.error('Improvement service responded with error:', improvementPayload)
      return NextResponse.json({ success: false, error: 'Outfit compatibility service returned an error' }, { status: 502 })
    }

    if (!isImprovementServiceResponse(improvementPayload)) {
      console.error('Improvement service returned unexpected payload:', improvementPayload)
      return NextResponse.json({ success: false, error: 'Outfit compatibility service returned an unexpected payload' }, { status: 502 })
    }

    const { improved, suggestion: improvementSuggestion, original_score: originalScore, best_score: bestScore } = improvementPayload

    const metrics = {
      originalScore,
      bestScore,
      suggestionScore: improvementSuggestion?.score ?? bestScore,
    }

    if (!improved || !improvementSuggestion) {
      const responsePayload: Record<string, unknown> = { success: true, suggestion: null, metrics }
      if (ignoredItemIds.length > 0) {
        responsePayload.ignoredItemIds = ignoredItemIds
      }
      return NextResponse.json(responsePayload)
    }

    const originalItem = itemsById.get(improvementSuggestion.original_item_id)
    const replacementItem = itemsById.get(improvementSuggestion.replacement_item_id)

    if (!originalItem || !replacementItem) {
      console.error('Suggested items not found in fetched item set:', improvementSuggestion)
      return NextResponse.json({ success: false, error: 'Suggested items could not be found' }, { status: 500 })
    }

    const suggestion: SuggestionResponse = {
      originalItem: toSuggestionItem(originalItem),
      replacementItem: toSuggestionItem(replacementItem),
    }

    const responsePayload: Record<string, unknown> = { success: true, suggestion, metrics }
    if (ignoredItemIds.length > 0) {
      responsePayload.ignoredItemIds = ignoredItemIds
    }

    return NextResponse.json(responsePayload)
  } catch (error) {
    console.error('Unexpected error while generating improvement suggestion:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

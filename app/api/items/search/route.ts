import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { query, category } = await request.json()

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
  }

  try {
    console.log('Starting text embedding for query:', query)
    const embeddingStartTime = Date.now()

    // Get text embedding from external API
    const clipEndpoint = process.env.CLIP_API_ENDPOINT
    if (!clipEndpoint) {
      throw new Error('CLIP_API_ENDPOINT is not configured')
    }

    const embeddingResponse = await fetch(`${clipEndpoint}/vectorize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: query
      })
    })

    if (!embeddingResponse.ok) {
      throw new Error('Failed to get text embedding')
    }

    const { vector } = await embeddingResponse.json()
    const embeddingDuration = Date.now() - embeddingStartTime

    console.log(`Text embedding retrieved successfully in ${embeddingDuration}ms, vector length:`, vector?.length)

    // Use Supabase RPC function for vector search
    const vectorSearchStartTime = Date.now()
    console.log('Starting vector search with category filter:', category && category !== 'all' ? category : null)

    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_items_by_vector', {
        query_embedding: vector,
        match_count: 10,
        filter_category: category && category !== 'all' ? category : null
      })

    const vectorSearchDuration = Date.now() - vectorSearchStartTime
    console.log(`Vector search completed in ${vectorSearchDuration}ms, results count:`, searchResults?.length)

    if (searchError) {
      console.error('Vector search error:', searchError)
      // Fallback to simple query
      let fallbackQuery = supabase
        .from('items')
        .select('*')
        .eq('user_id', user.id)
        .limit(10)
        .order('created_at', { ascending: false })

      if (category && category !== 'all') {
        fallbackQuery = fallbackQuery.eq('category', category)
      }

      const { data: items, error } = await fallbackQuery
      if (error) throw error

      return NextResponse.json({ items: items || [] })
    }

    // Map search results to include image URLs from ec_item_images bucket
    if (!searchResults || searchResults.length === 0) {
      console.log('No search results found')
      return NextResponse.json({ items: [] })
    }

    console.log('Processing search results:', searchResults.map(r => ({ id: r.item_id, similarity: r.similarity })))

    // 取得したファイル名はアプリ内のプロキシAPI経由で画像を返す
    const itemsWithImages = searchResults.map((result) => {
      const proxyUrl = `/api/ec-item-images/${encodeURIComponent(result.item_id)}`

      console.log(`Mapped result ${result.item_id} to proxy URL`)

      return {
        id: result.item_id,
        image_url: proxyUrl,
        similarity: result.similarity,
        // Since these are from ec_item_images, we don't have category info
        // unless it's in the metadata
        category: category === 'all' ? null : category
      }
    })

    console.log('Final items with images count:', itemsWithImages.length)
    return NextResponse.json({ items: itemsWithImages })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search items' },
      { status: 500 }
    )
  }
}

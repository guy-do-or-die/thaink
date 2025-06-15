import { useState, useEffect, useCallback } from 'react'

interface UseInfiniteCollectionOptions {
  totalItems: number
  itemsPerPage?: number
  initialLoad?: number
  loadDelay?: number
}

interface UseInfiniteCollectionReturn {
  displayedItems: number[]
  hasMore: boolean
  loadMore: () => Promise<void>
  isNewItem: (id: number) => boolean
}

export function useInfiniteCollection({
  totalItems,
  itemsPerPage = 3,
  initialLoad = itemsPerPage,
  loadDelay = 500,
}: UseInfiniteCollectionOptions): UseInfiniteCollectionReturn {
  const [displayedItems, setDisplayedItems] = useState<number[]>([])
  const [hasMore, setHasMore] = useState(true)

  // Handle new items and initial load
  useEffect(() => {
    if (totalItems > 0) {
      const currentHighestDisplayed = displayedItems[0] || 0

      if (displayedItems.length === 0) {
        // Initial load
        const initialItems = Array.from({ length: initialLoad }, (_, i) => totalItems - i).filter((id) => id > 0)
        setDisplayedItems(initialItems)
        setHasMore(initialItems[initialItems.length - 1] > 1)
      } else if (totalItems > currentHighestDisplayed) {
        // New items arrived
        const newItems = Array.from({ length: totalItems - currentHighestDisplayed }, (_, i) => totalItems - i)
        setDisplayedItems((prev) => {
          const merged = [...newItems, ...prev]
          // Remove duplicates while preserving order
          return [...new Set(merged)]
        })
      }
    }
  }, [totalItems, initialLoad])

  const loadMore = useCallback(async () => {
    const lastDisplayedId = displayedItems[displayedItems.length - 1]

    if (lastDisplayedId && lastDisplayedId > 1) {
      const nextItems = Array.from(
        { length: Math.min(itemsPerPage, lastDisplayedId - 1) },
        (_, i) => lastDisplayedId - 1 - i,
      ).filter((id) => id > 0)

      if (nextItems.length > 0) {
        // Add artificial delay
        await new Promise((resolve) => setTimeout(resolve, loadDelay))
        setDisplayedItems((prev) => [...prev, ...nextItems])
        setHasMore(nextItems[nextItems.length - 1] > 1)
      } else {
        setHasMore(false)
      }
    } else {
      setHasMore(false)
    }
  }, [displayedItems, itemsPerPage, loadDelay])

  const isNewItem = useCallback(
    (id: number) => {
      return id > (displayedItems[1] || 0)
    },
    [displayedItems],
  )

  return {
    displayedItems,
    hasMore,
    loadMore,
    isNewItem,
  }
}

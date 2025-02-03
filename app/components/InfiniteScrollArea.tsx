import { useState, useEffect, useCallback, ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'
import { LoaderCircle } from 'lucide-react'
import { ScrollArea } from "@/components/ui/scroll-area"

interface InfiniteScrollAreaProps<T> {
  items: T[]
  onLoadMore: () => Promise<void>
  hasMore: boolean
  isLoading?: boolean
  renderItem: (item: T) => ReactNode
  newItemAnimation?: boolean
  isNewItem?: (item: T) => boolean
  className?: string
}

export function InfiniteScrollArea<T>({
  items,
  onLoadMore,
  hasMore,
  isLoading = false,
  renderItem,
  newItemAnimation = false,
  isNewItem,
  className = ""
}: InfiniteScrollAreaProps<T>) {
  const [loading, setLoading] = useState(false)
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  })

  const handleLoadMore = useCallback(async () => {
    if (loading || isLoading) return
    setLoading(true)
    await onLoadMore()
    setLoading(false)
  }, [loading, isLoading, onLoadMore])

  useEffect(() => {
    if (inView && hasMore && !loading && !isLoading) {
      handleLoadMore()
    }
  }, [inView, hasMore, loading, isLoading, handleLoadMore])

  return (
    <div className="relative h-[calc(100vh-4rem)] md:h-[calc(100vh-8rem)] w-full">
      <div className="pointer-events-none absolute top-0 z-10 h-12 md:h-16 w-full bg-gradient-to-b from-background via-background/80 via-background/50 via-background/20 to-transparent" />
      <ScrollArea className={`h-full md:px-8 py-4 md:py-8 ${className}`}>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className={newItemAnimation && isNewItem?.(item) ? "animate-in slide-in-from-top duration-500" : ""}
            >
              {renderItem(item)}
            </div>
          ))}
          {hasMore && (
            <div ref={ref} className="h-4">
              {(loading || isLoading) && (
                <div className="flex justify-center">
                  <LoaderCircle className="m-4 h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="pointer-events-none absolute bottom-0 z-10 h-12 md:h-16 w-full bg-gradient-to-t from-background via-background/80 via-background/50 via-background/20 to-transparent" />
    </div>
  )
}

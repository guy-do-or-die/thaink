import { useState, useEffect, useCallback, useRef, ReactNode } from 'react'
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
    rootMargin: '400px',
  })

  const handleLoadMore = useCallback(async () => {
    if (loading || isLoading) return
    setLoading(true)
    await onLoadMore()
    setLoading(false)
  }, [loading, isLoading, onLoadMore])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (loading || isLoading || !hasMore) return
    const target = e.currentTarget;
    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (scrollBottom < 400) {
      handleLoadMore();
    }
  }, [loading, isLoading, hasMore, handleLoadMore]);

  useEffect(() => {
    if (inView && hasMore && !loading && !isLoading) {
      handleLoadMore()
    }
  }, [inView, hasMore, loading, isLoading, handleLoadMore])

  const renderContent = () => (
    <div className="space-y-4 px-2">
      {items.map((item, index) => (
        <div
          key={index}
          className={newItemAnimation && isNewItem?.(item) ? "animate-in fade-in slide-in-from-top" : ""}
        >
          {renderItem(item)}
        </div>
      ))}
      {hasMore && (
        <div ref={ref} className="h-32">
          {(loading || isLoading) && (
            <div className="flex justify-center">
              <LoaderCircle className="m-4 h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      )}
    </div>
  )

  return (
    <>
      <div className="relative h-[calc(100vh-2rem)] md:h-[calc(100vh-10rem)] w-full hidden md:block">
        <div className="pointer-events-none absolute top-0 z-10 h-12 md:h-16 w-full bg-gradient-to-b from-background via-background/80 via-background/50 via-background/20 to-transparent" />
        <ScrollArea onScrollCapture={handleScroll} className={`h-full md:px-8 py-2 md:py-4 w-full ${className}`}>
          {renderContent()}
        </ScrollArea>
        <div className="pointer-events-none absolute bottom-0 z-10 h-12 md:h-16 w-full bg-gradient-to-t from-background via-background/80 via-background/50 via-background/20 to-transparent" />
      </div>

      <div className="fixed right-0 top-[calc(4rem+0.5rem)] h-[calc(100vh-10rem)] w-full md:hidden z-20">
        <div className="pointer-events-none absolute top-0 z-10 h-12 w-full bg-gradient-to-b from-background via-background/80 via-background/50 via-background/20 to-transparent" />
        <ScrollArea className={`h-full py-2 w-full [&_[data-radix-scroll-area-thumb]]:w-1.5 ${className}`}>
          {renderContent()}
        </ScrollArea>
        <div className="pointer-events-none absolute bottom-0 z-10 h-12 w-full bg-gradient-to-t from-background via-background/80 via-background/50 via-background/20 to-transparent" />
      </div>
    </>
  )
}

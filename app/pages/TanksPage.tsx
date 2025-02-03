import { useReadThainkTanksNumber } from '@/contracts'
import Content from '@/components/Content'
import Tank from '@/components/Tank'
import { InfiniteScrollArea } from '@/components/InfiniteScrollArea'
import { useInfiniteCollection } from '@/hooks/useInfiniteCollection'
import { useBlockStore } from '@/stores/useBlockStore'

export default function TanksPage() {
  const { blockNumber } = useBlockStore()
  const { data: tanksNumber } = useReadThainkTanksNumber({ blockNumber })
  const lastTankId = Number(tanksNumber) || 0

  const {
    displayedItems: displayedTanks,
    hasMore,
    loadMore,
    isNewItem
  } = useInfiniteCollection({
    totalItems: lastTankId,
    itemsPerPage: 3
  })

  return (
    <Content>
      <InfiniteScrollArea
        items={displayedTanks}
        onLoadMore={loadMore}
        hasMore={hasMore}
        renderItem={(tankId) => <Tank tankId={tankId} />}
        newItemAnimation
        isNewItem={isNewItem}
      />
    </Content>
  )
}

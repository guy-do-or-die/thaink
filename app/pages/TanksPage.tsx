import { useState, useEffect, useCallback } from 'react'
import { useBlockNumber } from 'wagmi'

import Content from '@/components/Content'
import Tank from '@/components/Tank'

import { InfiniteScrollArea } from '@/components/InfiniteScrollArea'
import { useInfiniteCollection } from '@/hooks/useInfiniteCollection'

import { useReadThainkTanksNumber } from '@/contracts'

export default function TanksPage() {
  const [lastTankId, setLastTankId] = useState(0)

  const { data: blockNumber } = useBlockNumber({ watch: true })
  const { data: tanksNumber } = useReadThainkTanksNumber({ blockNumber })

  useEffect(() => {
    tanksNumber && setLastTankId(Math.max(Number(tanksNumber), 0))
  }, [tanksNumber])

  const {
    displayedItems: displayedTanks,
    hasMore,
    loadMore,
  } = useInfiniteCollection({
    totalItems: lastTankId,
    initialLoad: 5,
  })

  const renderTank = (id: number) => <div key={id}><Tank tankId={id} /></div>

  return (
    <Content>
      <InfiniteScrollArea
        items={displayedTanks}
        hasMore={hasMore}
        onLoadMore={loadMore}
        renderItem={renderTank} />
    </Content>
  )
}

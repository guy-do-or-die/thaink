import { useState, useEffect } from 'react'
import { useBlockNumber, usePublicClient } from 'wagmi'
import { decodeEventLog } from 'viem'

import { Link } from 'wouter'

import Content from '@/components/Content'
import Tank from '@/components/Tank'

import { InfiniteScrollArea } from '@/components/InfiniteScrollArea'
import { useInfiniteCollection } from '@/hooks/useInfiniteCollection'
import { thainkAbi, thainkAddress } from '@/contracts'

import { chain } from '@/wallet'

import { ROUTES } from '@/routes.config'

export default function EngagePage() {
  const [mintedTankIds, setMintedTankIds] = useState<number[]>([])

  const { data: blockNumber } = useBlockNumber({ watch: true })

  const publicClient = usePublicClient()

  useEffect(() => {
    const loadMintEvents = async () => {
      try {
        const logs = await publicClient.getLogs({
          address: thainkAddress[chain.id],
          event: {
            type: 'event',
            name: 'MintEvent',
            inputs: [
              { type: 'address', name: 'to', indexed: true },
              { type: 'uint256', name: 'id', indexed: true },
            ],
          },
          fromBlock: blockNumber ? BigInt(blockNumber) - 100000n : 'latest',
          toBlock: blockNumber ? BigInt(blockNumber) : 'latest',
        })

        const ids = logs
          .map((log) => {
            const { args } = decodeEventLog({
              abi: thainkAbi,
              data: log.data,
              topics: log.topics,
            })
            return Number(args.id)
          })
          .sort((a, b) => b - a)

        setMintedTankIds(ids)
      } catch (error) {
        console.error('Failed to load mint events:', error)
      }
    }

    loadMintEvents()
  }, [blockNumber])

  const {
    displayedItems: displayedTanks,
    hasMore,
    loadMore,
  } = useInfiniteCollection({
    totalItems: mintedTankIds.length,
    initialLoad: 5,
    getItem: (index) => mintedTankIds[index],
  })

  const renderTank = (id: number) => (
    <div key={id}>
      <Tank tankId={id} variant="minted" />
    </div>
  )

  if (mintedTankIds.length === 0) {
    return (
      <Content>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <h2 className="text-2xl font-bold mb-4">Nothing to engage yet</h2>
          <Link href={ROUTES.TANKS.path} className="cursor-pointer">
            Mint one
          </Link>
        </div>
      </Content>
    )
  }

  return (
    <Content>
      <InfiniteScrollArea items={displayedTanks} hasMore={hasMore} onLoadMore={loadMore} renderItem={renderTank} />
    </Content>
  )
}

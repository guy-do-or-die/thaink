import { create } from 'zustand'
import { useEffect } from 'react'
import { usePublicClient } from 'wagmi'

interface BlockState {
  blockNumber: number | null
  setBlockNumber: (blockNumber: number) => void
}

export const useBlockStore = create<BlockState>((set) => ({
  blockNumber: null,
  setBlockNumber: (blockNumber) => {
    if (!blockNumber) return
    set({ blockNumber })
  },
}))

export function useWatchBlock() {
  const publicClient = usePublicClient()
  const setBlockNumber = useBlockStore((state) => state.setBlockNumber)

  useEffect(() => {
    console.log('Setting up block watcher')

    if (!publicClient) {
      console.log('No public client available')
      return
    }

    const unwatch = publicClient.watchBlockNumber({
      onBlockNumber: (blockNumber) => {
        setBlockNumber(Number(blockNumber))
      },
      emitOnBegin: true,
    })

    return () => {
      console.log('Cleaning up block watcher')
      unwatch()
    }
  }, [publicClient, setBlockNumber])

  useEffect(() => {
    const fetchCurrentBlock = async () => {
      if (!publicClient) return
      try {
        const blockNumber = await publicClient.getBlockNumber()
        console.log('Initial block number:', blockNumber)
        setBlockNumber(Number(blockNumber))
      } catch (error) {
        console.error('Error fetching initial block:', error)
      }
    }
    fetchCurrentBlock()
  }, [publicClient, setBlockNumber])
}

import { useEffect, useState } from 'react'

import JSON5 from 'json5'

import { useReadContracts, useBlockNumber } from 'wagmi'

import { Flame, CheckCircle, PenLine, Hash, HandCoins } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import TxButton from '@/components/TxButton'

import { useNavigation } from '@/hooks/useNavigation'
import { ROUTES } from '@/routes.config'

import { thainkAbi, thainkAddress, useSimulateThainkMint, useWriteThainkMint } from '@/contracts'

import { useAccount, chain } from '@/wallet'
import { Skeleton } from './ui/skeleton'

interface TankData {
  id: number
  address: string
  minted: number
  mintsCount: number
  meta: Record<string, any>
}

interface TankCardProps {
  data: TankData
}

interface TankProps {
  tankId: number
  variant?: 'list' | 'single' | 'minted'
}

const THAINK_CONTRACT_CONFIG = {
  abi: thainkAbi,
  address: thainkAddress[chain.id],
}

function parseTankMetadata(uri: string): Record<string, any> {
  try {
    return JSON5.parse(atob(uri.substring(29)) || '{}')
  } catch (error) {
    console.error('Failed to parse tank metadata:', error)
    return {}
  }
}

export default function Tank({ tankId, variant = 'list' }: TankProps) {
  const { address, connected } = useAccount()
  const { data: blockNumber } = useBlockNumber({ watch: true })

  const [tankData, setTankData] = useState<TankData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { data: readData, isError } = useReadContracts({
    blockNumber,
    contracts: [
      {
        functionName: 'tanks',
        args: [BigInt(tankId)],
        ...THAINK_CONTRACT_CONFIG,
      },
      {
        functionName: 'balanceOf',
        args: [address, BigInt(tankId)],
        ...THAINK_CONTRACT_CONFIG,
      },
      {
        functionName: 'totalSupply',
        args: [BigInt(tankId)],
        ...THAINK_CONTRACT_CONFIG,
      },
      {
        functionName: 'uri',
        args: [BigInt(tankId)],
        ...THAINK_CONTRACT_CONFIG,
      },
    ],
  })

  useEffect(() => {
    if (readData) {
      setTankData({
        id: tankId,
        address: readData[0].result as string,
        minted: Number(readData[1].result || 0),
        mintsCount: Number(readData[2].result || 0),
        meta: parseTankMetadata(readData[3].result || ''),
      })
      setTimeout(() => setIsLoading(false), 100)
    }
  }, [readData, isError, tankId])

  return tankData && !isLoading ? <TankCard data={tankData} variant={variant} /> : <SkeletonCard />
}

function SkeletonCard() {
  return (
    <Card className="group relative flex flex-col transition-all duration-200 my-4 h-52">
      <CardHeader className="h-8 py-4 px-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-8" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-6 pt-8 pb-6">
        <div className="w-full space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
        </div>
      </CardContent>
      <CardFooter className="h-12 flex justify-between items-center px-6">
        <div>
          <Skeleton className="h-9 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-9 w-16" />
        </div>
      </CardFooter>
    </Card>
  )
}

function TankCard({ data, variant }: TankCardProps & { variant: 'list' | 'single' | 'minted' }) {
  const { address, connected } = useAccount()

  const { navigateTo } = useNavigation()

  const mintConfig = {
    args: [address, BigInt(data.id)],
    enabled: connected && data.minted === 0,
  }

  const emoji = data.minted ? <CheckCircle className="text-green-500" /> : <Flame className="text-red-500" />
  const text = data.minted ? 'Minted' : 'Mint'

  const tankPage = `${ROUTES.TANK.path.replace(':id', data.id)}`

  const isListView = variant === 'list'
  const isMintedView = variant === 'minted'

  return (
    <Card
      className={`group relative flex flex-col transition-all duration-200 my-4
                        ${isListView || isMintedView ? 'h-52 hover:shadow-[0_4px_4px_rgba(0,82,255,0.3)]' : 'min-h-52'}`}
    >
      <CardHeader className="h-8 py-4 px-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-6 text-sm text-muted-foreground">
            <div title="Minted Times" className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> {data.meta?.attributes?.[1]?.value || 0}
            </div>
            <div title="Contributions" className="flex items-center gap-1">
              <PenLine className="h-4 w-4" /> {data.meta?.attributes?.[0]?.value || 0}
            </div>
            <div title="Funds Received" className="flex items-center gap-1">
              <HandCoins className="h-4 w-4" /> {data.meta?.attributes?.[3]?.value || 0} ETH
            </div>
          </div>
          <div title="Minted Times" className="flex items-center gap-1 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            {data.id}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-6 pt-8 pb-6">
        <div className="w-full">
          <div
            className={`text-sm md:text-base leading-relaxed text-foreground ${isListView || isMintedView ? 'line-clamp-2 overflow-hidden text-ellipsis' : ''}`}
          >
            {data.meta.description}
          </div>
        </div>
      </CardContent>
      <CardFooter className="h-12 flex justify-between items-center px-6">
        <div>
          {!isMintedView && (
            <TxButton
              emoji={emoji}
              text={text}
              simulateHook={useSimulateThainkMint}
              writeHook={useWriteThainkMint}
              params={mintConfig}
            />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => {}}>
            Fund
          </Button>
          {isListView || isMintedView ? (
            <Button variant="outline" onClick={() => navigateTo(tankPage)}>
              {isListView ? 'Join' : 'Open'}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => {}}>
              Share
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
}

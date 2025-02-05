import { useEffect, useState } from 'react'

import JSON5 from 'json5'

import { useReadContracts, useBlockNumber } from 'wagmi'

import { Flame, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import TxButton from '@/components/TxButton'

import { useNavigation } from '@/hooks/useNavigation'
import { ROUTES } from '@/routes.config'

import {
    thainkAbi,
    thainkAddress,
    useSimulateThainkMint,
    useWriteThainkMint
} from '@/contracts'

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
    variant?: 'list' | 'single'
}

const CONTRACT_CONFIG = {
    abi: thainkAbi,
    address: thainkAddress[chain.id],
}

function parseTankMetadata(uri: string): Record<string, any> {
    try {
        return JSON5.parse(atob(uri.substring(29)) || "{}")
    } catch (error) {
        console.error('Failed to parse tank metadata:', error)
        return {}
    }
}

export default function Tank({ tankId, variant = 'list' }: TankProps) {
    const { address } = useAccount()
    const { data: blockNumber } = useBlockNumber({ watch: true })
    const [tankData, setTankData] = useState<TankData | null>(null)

    const { data: readData, isError } = useReadContracts({
        blockNumber,
        contracts: [
            {
                functionName: 'tanks',
                args: [BigInt(tankId)],
                ...CONTRACT_CONFIG,
            },
            {
                functionName: 'balanceOf',
                args: [address, BigInt(tankId)],
                ...CONTRACT_CONFIG,
            },
            {
                functionName: 'totalSupply',
                args: [BigInt(tankId)],
                ...CONTRACT_CONFIG,
            },
            {
                functionName: 'uri',
                args: [BigInt(tankId)],
                ...CONTRACT_CONFIG,
            }
        ]
    })

    useEffect(() => {
        if (readData) {
            setTankData({
                id: tankId,
                address: readData[0].result as string,
                minted: Number(readData[1].result || 0),
                mintsCount: Number(readData[2].result || 0),
                meta: parseTankMetadata(readData[3].result || ""),
            })
        }
    }, [readData, isError, tankId])

    return (tankData ? <TankCard data={tankData} variant={variant} /> : <SkeletonCard />)
}

function SkeletonCard() {
    return (
        <Card className="w-full">
            <CardHeader className="space-y-1 sm:space-y-2">
                <Skeleton className="h-8" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-24" />
            </CardContent>
            <CardFooter>
                <Skeleton className="h-4" />
            </CardFooter>
        </Card >
    )
}

function TankCard({ data, variant }: TankCardProps & { variant: 'list' | 'single' }) {
    const { address, connected } = useAccount()

    const { navigateTo } = useNavigation()

    const mintConfig = {
        args: [address, BigInt(data.id)],
        enabled: connected && !data.minted
    }

    const emoji = data.minted ? <CheckCircle className="text-green-500" /> : <Flame className="text-red-500" />
    const text = data.minted ? 'Minted' : 'Mint'

    const tankPage = `${ROUTES.TANK.path.replace(":id", data.id)}`
    const isListView = variant === 'list'

    return (
        <Card className="w-full group">
            <CardHeader className="space-y-1 sm:space-y-2">
                <CardTitle className="text-lg sm:text-xl">{data.meta.name}</CardTitle>
                <CardDescription className="text-sm sm:text-base"></CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="space-y-2 w-full sm:w-auto text-sm sm:text-base">
                    <div>{data.meta.description}</div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
                <TxButton
                    emoji={emoji} text={text}
                    simulateHook={useSimulateThainkMint}
                    writeHook={useWriteThainkMint}
                    params={mintConfig} />
                {isListView && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-100">
                        <Button variant="outline" onClick={() => navigateTo(tankPage)}>Join</Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    )
}
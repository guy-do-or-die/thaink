import { Flame, Check } from 'lucide-react'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

import TxButton from '@/components/TxButton'

import {
    useReadThainkBalanceOf,
    useReadThainkTanks,
    useReadThainkUri,
    useReadThainkTotalSupply,
    useSimulateThainkMint,
    useWriteThainkMint
} from '@/contracts'

import { useAccount } from '@/wallet'
import { useBlockStore } from '@/stores/useBlockStore'


export default function Tank({ tankId }: { tankId: number }) {

    const { address, connected } = useAccount()
    const { blockNumber } = useBlockStore()

    const { data: tankAddress } = useReadThainkTanks({
        args: [BigInt(tankId)],
    })

    const { data: balance } = useReadThainkBalanceOf({
        blockNumber, args: [address, BigInt(tankId)],
    })

    const { data: tankTotalSupply } = useReadThainkTotalSupply({
        blockNumber, args: [BigInt(tankId)],
    })

    const { data: uriData } = useReadThainkUri({
        args: [BigInt(tankId)],
    })

    const tankJson = atob((uriData || "").substring(29)) || "{}"
    const tankData = JSON.parse(tankJson);

    const mintConfig = {
        args: [address, BigInt(tankId)],
        enabled: connected && Number(balance) === 0,
        onConfirmationSuccess: data => {
            console.log('data', data)
        }
    }

    return (
        <Card className="w-full">
            <CardHeader className="space-y-1 sm:space-y-2">
                <CardTitle className="text-lg sm:text-xl">{tankData.name}</CardTitle>
                <CardDescription className="text-sm sm:text-base">{tankData.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="space-y-2 w-full sm:w-auto text-sm sm:text-base">
                    <div className="break-all">{tankAddress}</div>
                    <div>{Number(tankTotalSupply) || 0} minted</div>
                </div>
                <div className="flex items-center justify-center">
                    <img className="w-32 sm:w-40" src={tankData.image} alt={tankData.name} />
                </div>
            </CardContent>
            <CardFooter className="pt-2 sm:pt-4">
                <TxButton emoji={balance > 0n ? <Check className="text-green-500" /> : <Flame className="text-red-500" />}
                    text={`${balance > 0n ? 'Minted' : 'Mint'}`}
                    simulateHook={useSimulateThainkMint}
                    writeHook={useWriteThainkMint}
                    params={mintConfig} />
            </CardFooter>
        </Card>
    )
}
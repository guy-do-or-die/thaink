import { useAccount } from '@/wallet'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { TxButton } from '@/components/TxButton'

import { useReadThainkTanks, useReadThainkUri, useReadThainkTotalSupply, useSimulateThainkMint, useWriteThainkMint } from '@/contracts'


export default function Tank({ tankId }: { tankId: number }) {

    const { address, connected } = useAccount()

    const { data: tankAddress } = useReadThainkTanks({
        args: [BigInt(tankId)],
    })

    const { data: tankTotalSupply } = useReadThainkTotalSupply({
        args: [BigInt(tankId)],
    })

    const { data: uriData } = useReadThainkUri({
        args: [BigInt(tankId)],
    })

    const tankJson = atob((uriData || "").substring(29)) || "{}"
    const tankData = JSON.parse(tankJson);

    const mintConfig = {
        args: [address, BigInt(tankId)],
        enabled: connected,
        onConfirmationSuccess: data => {
            console.log('data', data)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{tankData.name}</CardTitle>
                <CardDescription>{tankData.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
                <div className="space-y-2">
                    <div>{tankAddress}</div>
                    <div>{Number(tankTotalSupply) || 0} minted</div>
                </div>
                <div className="flex items-center justify-center h-full">
                    <img className='w-40' src={tankData.image} />
                </div>
            </CardContent>
            <CardFooter>
                <TxButton emoji="🔥" text="Mint"
                    simulateHook={useSimulateThainkMint}
                    writeHook={useWriteThainkMint}
                    params={mintConfig} />
            </CardFooter>
        </Card>
    )
}
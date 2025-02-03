
import { Sparkles } from "lucide-react"

import Content from '@/components/Content'
import TxButton from '@/components/TxButton'

import { useNavigation } from '@/hooks/useNavigation'
import { ROUTES } from '@/routes.config'

import { useAccount } from '@/wallet'


import { useSimulateThainkMakeTank, useWriteThainkMakeTank } from '@/contracts'


export default function MakePage() {

    const { navigateTo } = useNavigation()
    const { connected } = useAccount()

    const makeTankParams = {
        args: [],
        enabled: connected,
        onConfirmationSuccess: data => {
            navigateTo(ROUTES.TANKS.path)
        }
    }

    return (
        <Content>
            <TxButton text="Make Tank" emoji={<Sparkles className="text-yellow-500" />}
                simulateHook={useSimulateThainkMakeTank}
                writeHook={useWriteThainkMakeTank}
                params={makeTankParams} />
        </Content>
    );
}

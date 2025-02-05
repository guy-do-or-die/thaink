import { useState } from 'react'

import { Textarea } from '@/components/ui/textarea'
import { Sparkles } from "lucide-react"

import Content from '@/components/Content'
import TxButton from '@/components/TxButton'

import { useNavigation } from '@/hooks/useNavigation'
import { ROUTES } from '@/routes.config'

import { useAccount } from '@/wallet'

import {
    useSimulateThainkMakeTank,
    useWriteThainkMakeTank
} from '@/contracts'

export default function MakePage() {
    const { navigateTo } = useNavigation()
    const { connected } = useAccount()

    const [idea, setIdea] = useState('')

    const makeTankParams = {
        args: [idea],
        enabled: connected && idea.trim().length > 0,
        onConfirmationSuccess: data => {
            navigateTo(ROUTES.TANKS.path)
        }
    }

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = e.target;
        setIdea(textarea.value);

        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    }

    return (
        <Content>
            <Textarea
                placeholder="Share your idea..."
                onChange={handleTextareaChange}
                disabled={!connected}
                className="min-h-[200px] lg:w-1/2 md:w-2/3 w-full"
                value={idea}
            />
            <TxButton
                text="Let's think about it!"
                className="col-span-2 w-full py-6 text-lg font-semibold mt-4"
                emoji={<Sparkles className="text-yellow-500 w-6 h-6" />}
                simulateHook={useSimulateThainkMakeTank}
                writeHook={useWriteThainkMakeTank}
                params={makeTankParams}
            />
        </Content>
    );
}

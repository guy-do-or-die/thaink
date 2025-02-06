import { useState, useEffect } from 'react'

import { Card, CardDescription, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, HandHeart } from "lucide-react"

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
    const [debouncedIdea, setDebouncedIdea] = useState('')
    const [contributionFee, setContributionFee] = useState(0.001)
    const [thainkFee, setThainkFee] = useState(0.0001)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedIdea(idea)
        }, 500)

        return () => clearTimeout(timer)
    }, [idea])

    const makeTankParams = {
        args: [debouncedIdea],
        enabled: connected && debouncedIdea.trim().length > 0,
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
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="md:text-2xl">Make a Thaink Tank</CardTitle>
                    <CardDescription>Set up a new collaborative space</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="mb-8">
                        <Textarea
                            placeholder="Share your idea..."
                            className="min-h-[200px] w-full"
                            onChange={handleTextareaChange}
                            disabled={!connected}
                            value={idea} />
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between">
                            <div>
                                <Label>Incentive</Label>
                                <CardDescription>Distributed to contributors</CardDescription>
                            </div>
                            <div className="w-1/3">
                                <Slider
                                    value={[contributionFee]}
                                    onValueChange={([value]) => setContributionFee(value)}
                                    min={0.0001}
                                    max={0.01}
                                    step={0.0001} />
                                <div className="text-sm text-right mt-1">{contributionFee} ETH</div>
                            </div>
                        </div>
                        <div className="flex justify-between">
                            <div>
                                <div className="flex items-center gap-1">
                                    <Label>Thaink Fee</Label>
                                    <HandHeart className="w-3.5 h-3.5 mb-0.5" />
                                </div>
                                <CardDescription>Not required but appreciated</CardDescription>
                            </div>
                            <div className="w-1/3">
                                <Slider
                                    value={[thainkFee]}
                                    onValueChange={([value]) => setThainkFee(value)}
                                    min={0}
                                    max={0.01}
                                    step={0.0001} />
                                <div className="text-sm text-right mt-1">{thainkFee} ETH</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <TxButton
                        text="Let's think about it!"
                        className="col-span-2 py-6 text-lg font-semibold mt-4"
                        emoji={<Sparkles className="text-yellow-500 w-6 h-6" />}
                        simulateHook={useSimulateThainkMakeTank}
                        writeHook={useWriteThainkMakeTank}
                        params={makeTankParams} />
                </CardFooter>
            </Card>
        </Content >
    );
}

import { useState } from 'react'

import { notify } from '@/components/Notification'
import { Sparkles } from 'lucide-react'
import { promptLitAction, promptLitActionParams } from '../../../lit/actions/prompt'
import LitButton from '@/components/LitButton'
import { Textarea } from '@/components/ui/textarea'

interface PromptFormProps {
  tankId: number
  tankAddress: string
}

enum NotificationType {
  success = 'success',
  fail = 'fail',
  info = 'info',
}

export function PromptForm({ tankId, tankAddress }: PromptFormProps) {
  const [prompt, setPrompt] = useState('')

  const promptParams: promptLitActionParams = {
    contractAddress: tankAddress,
    prompt,
  }

  const notificationParams = (type: NotificationType) => ({
    duration: Infinity,
    icon: null,
    style: {
      color: 'rgba(255, 255, 255, 0.95)',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.5)',
      textAlign: 'center',
      maxWidth: window.innerWidth >= 1024 ? '50%' : window.innerWidth >= 768 ? '80%' : '100%',
      boxShadow:
        type === NotificationType.info
          ? '0 4px 4px rgba(0, 82, 255, 0.3'
          : type === NotificationType.fail
            ? '0 4px 4px rgba(255, 0, 0, 0.3'
            : '0 4px 4px rgba(0, 128, 0, 0.3)',
      backgroundColor:
        type === NotificationType.info
          ? 'rgba(0, 82, 255, 0.9'
          : type === NotificationType.fail
            ? 'rgba(255, 0, 0, 0.9)'
            : 'rgba(0, 128, 0, 0.9)',
    },
  })

  const promptSuccess = (result: any) => {
    notify(result.reasoning, 'info', notificationParams(NotificationType.info))
  }

  return (
    <div className="flex flex-col">
      <div className="space-y-4">
        <Textarea
          placeholder="Ask a question about this tank's contributions..."
          className="min-h-[120px] p-2 w-full"
          onChange={(e) => setPrompt(e.target.value)}
          value={prompt}
        />
      </div>
      <div className="flex justify-center mt-4 pb-4">
        <LitButton
          action={promptLitAction}
          actionParams={promptParams}
          onSuccess={promptSuccess}
          icon={<Sparkles />}
          text="Prompt"
          disabled={!prompt.trim()}
          className="py-6 text-lg font-semibold"
        />
      </div>
    </div>
  )
}

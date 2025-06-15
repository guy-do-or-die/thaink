import { useState } from 'react'

import { Lightbulb, Brain, Send } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

import LitButton from '@/components/LitButton'

import { hintLitAction, hintLitActionParams } from '../../../lit/actions/hint'
import { submitLitAction, submitLitActionParams } from '../../../lit/actions/submit'

import { notify } from '@/components/Notification'
import { txLink } from '@/components/Utils'

import { useAccount, chain } from '@/wallet'

import { SendTxButton } from '@/components/SendTxButton'

import { useReadTankContributors } from '@/contracts'

interface ContributeFormProps {
  tankId: number
  tankAddress: string
}

enum NotificationType {
  success = 'success',
  fail = 'fail',
  info = 'info',
}

export function ContributeForm({ tankId, tankAddress }: ContributeFormProps) {
  const [note, setNote] = useState('')
  const [signedTx, setSignedTx] = useState()

  const { address } = useAccount()

  const { data: evaluation } = useReadTankContributors({
    address: tankAddress,
    args: [address],
    query: {
      enabled: !!address,
    },
  })

  const hintParams: hintLitActionParams = {
    contractAddress: tankAddress,
  }

  const submitParams: submitLitActionParams = {
    contractAddress: tankAddress,
    address,
    note,
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

  const hintSuccess = (result: any) => {
    notify(result.hint, 'info', notificationParams(NotificationType.info))
  }

  const evaluationSuccess = (result: any) => {
    const evaluation = result.evaluation

    if (evaluation.verdict === 'accept') {
      notify(evaluation.justification, 'info', notificationParams(NotificationType.success))

      if (result.signedTx) {
        setSignedTx(result.signedTx)
      }

      if (result.txHash) {
        notify(<span>{txLink(result.txHash, 'Transaction')} sent</span>, 'success', { id: txMessageId })
        setTx(result.txHash)
      }
    } else {
      notify(evaluation.justification, 'info', notificationParams(NotificationType.fail))
    }
  }

  const submitSuccess = () => {
    notify('Your contribution has been successfully submitted', 'success')
  }

  return (
    <>
      {evaluation ? (
        <div className="flex flex-col items-center justify-center p-6 text-center space-y-2 bg-secondary/20 rounded-lg">
          <h2 className="text-xl font-semibold">Thank you for your contribution!</h2>
          <p className="text-muted-foreground">You have already shared your thoughts on this tank.</p>
        </div>
      ) : (
        <div className="flex flex-col w-full">
          <div className="flex-1 space-y-4">
            {!signedTx && (
              <Textarea
                placeholder="Share your thoughts..."
                className="flex-1 min-h-[180px] p-2 w-full"
                onChange={(e) => setNote(e.target.value)}
                value={note}
              />
            )}
          </div>
          <div className="flex space-x-2 justify-center mt-4">
            {signedTx ? (
              <SendTxButton
                signedTx={signedTx}
                onSuccess={submitSuccess}
                icon={<Send />}
                text="Submit"
                className="w-32"
              />
            ) : (
              <>
                <LitButton
                  action={hintLitAction}
                  actionParams={hintParams}
                  onSuccess={hintSuccess}
                  icon={<Lightbulb />}
                  text="Hint"
                  variant="outline"
                  className="w-32"
                />

                <LitButton
                  action={submitLitAction}
                  actionParams={submitParams}
                  onSuccess={evaluationSuccess}
                  icon={<Brain />}
                  text="Evaluate"
                  disabled={!note.trim()}
                  className="w-32"
                />
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

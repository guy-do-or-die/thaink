import { useState, useEffect } from 'react'

import { useWaitForTransactionReceipt } from 'wagmi'

import { Send, Lightbulb } from 'lucide-react'

import { Textarea } from '@/components/ui/textarea'
import LitButton from '@/components/LitButton'

import { hintLitAction, hintLitActionParams } from '@/lit/actions/hint'
import { submitLitAction, submitLitActionParams } from '@/lit/actions/submit'

import { notify } from '@/components/Notification'
import { txLink } from '@/components/Utils'

import { useAccount } from '@/wallet'


interface ContributeFormProps {
  tankId: number
  tankAddress: string
}

enum NotificationType {
  success = 'success',
  fail = 'fail',
  info = 'info',
}

const SUBMIT_LIT_ACTION_IPFS_CID = import.meta.env.VITE_SUBMIT_LIT_ACTION_IPFS_CID
const PKP_PUBLIC_KEY = import.meta.env.VITE_PKP_PUBLIC_KEY


export function ContributeForm({ tankId, tankAddress }: ContributeFormProps) {
  const [note, setNote] = useState('')
  const [tx, setTx] = useState('')

  const txMessageId = `${tx}-message`

  const { address } = useAccount()



  const hintParams: hintLitActionParams = {
    contractAddress: tankAddress
  }

  const submitParams: submitLitActionParams = {
    ipfsCid: SUBMIT_LIT_ACTION_IPFS_CID,
    pkp: PKP_PUBLIC_KEY,
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
      boxShadow: (
        type === NotificationType.info ? '0 4px 4px rgba(0, 82, 255, 0.3' :
          type === NotificationType.fail ? '0 4px 4px rgba(255, 0, 0, 0.3' : '0 4px 4px rgba(0, 128, 0, 0.3)'),
      backgroundColor: (
        type === NotificationType.info ? 'rgba(0, 82, 255, 0.9' :
          type === NotificationType.fail ? 'rgba(255, 0, 0, 0.9)' : 'rgba(0, 128, 0, 0.9)'),
    }
  })

  const hintSuccess = (result: any) => {
    notify(result.hint, 'info', notificationParams(NotificationType.info))
  }

  const submitSuccess = (result: any) => {
    const evaluation = result.evaluation

    if (evaluation.verdict === 'accept') {
      notify(evaluation.justification, 'info', notificationParams(NotificationType.success))

      if (result.txHash) {
        notify(<span>{txLink(result.txHash, 'Transaction')} sent</span>, 'success', { id: txMessageId })
        setTx(result.txHash)
      }
    } else {
      notify(evaluation.justification, 'info', notificationParams(NotificationType.fail))
    }
  }

  const {
    error: confirmationError,
    isError: isConfirmationError,
    isSuccess: isConfirmationSuccess,
  } = useWaitForTransactionReceipt({
    query: { enabled: tx },
    confirmations: 1,
    hash: tx,
  })

  useEffect(() => {
    if (isConfirmationSuccess) {
      notify('Transaction confirmed', 'success')
      hide(txMessageId)
    }
  }, [tx, isConfirmationSuccess])

  useEffect(() => {
    if (isConfirmationError) {
      notify(`Transaction failed: ${confirmationError}`, 'error')
    }
  }, [tx, isConfirmationError])

  return (
    <div className="flex flex-col w-full">
      <div className="flex-1 space-y-4">
        <Textarea
          placeholder="Share your thoughts..."
          className="flex-1 min-h-[180px] p-2 w-full"
          onChange={(e) => setNote(e.target.value)}
          value={note} />
      </div>
      <div className="flex space-x-2 justify-center mt-4">
        <LitButton
          action={hintLitAction} actionParams={hintParams} onSuccess={hintSuccess}
          icon={<Lightbulb />} text="Hint" variant="outline"
          className="w-32" />
        <LitButton
          action={submitLitAction} actionParams={submitParams} onSuccess={submitSuccess}
          icon={<Send />} text="Submit" disabled={!note.trim()}
          className="w-32" />
      </div>
    </div >
  )
}

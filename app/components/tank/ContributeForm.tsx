import { useState, useEffect } from 'react'

import { useWaitForTransactionReceipt, useSendTransaction } from 'wagmi'

import { Send, Lightbulb, Brain } from 'lucide-react'

import { Textarea } from '@/components/ui/textarea'
import LitButton from '@/components/LitButton'

import { hintLitAction, hintLitActionParams } from '@/lit/actions/hint'
import { submitLitAction, submitLitActionParams } from '@/lit/actions/submit'

import { notify } from '@/components/Notification'
import { txLink } from '@/components/Utils'

import { useAccount, chain } from '@/wallet'
import { Button } from '../ui/button'
import { ethers } from 'ethers'

interface ContributeFormProps {
  tankId: number
  tankAddress: string
}

enum NotificationType {
  success = 'success',
  fail = 'fail',
  info = 'info',
}

const SUBMIT_LIT_ACTION_IPFS_CID = import.meta.env.VITE_SUBMITLITACTION_IPFS_CID
const PKP_PUBLIC_KEY = import.meta.env.VITE_PKP_PUBLIC_KEY
const PKP_TOKEN_ID = import.meta.env.VITE_PKP_TOKEN_ID


export function ContributeForm({ tankId, tankAddress }: ContributeFormProps) {
  const [note, setNote] = useState('')

  const [signedTx, setSignedTx] = useState()
  const [tx, setTx] = useState('')

  const txMessageId = `${tx}-message`

  const { address } = useAccount()


  const hintParams: hintLitActionParams = {
    contractAddress: tankAddress
  }

  const submitParams: submitLitActionParams = {
    ipfsCid: SUBMIT_LIT_ACTION_IPFS_CID,
    pkp: PKP_PUBLIC_KEY,
    pkpTokenId: PKP_TOKEN_ID,
    chainNetwork: chain.network,
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

  const { sendTransaction } = useSendTransaction({
    onSuccess: (data) => {
      console.log(`Transaction sent: ${data.hash}`)
      setTx(data.hash)
    },
    onError: (error) => {
      if (error.message.includes('insufficient funds')) {
        notify(
          'Insufficient funds. Please get test ETH from:\n' +
          '1. Base Sepolia Faucet: https://sepoliafaucet.com/base\n' +
          '2. Or bridge ETH using Base Bridge: https://bridge.base.org/deposit',
          'error'
        )
      } else {
        notify(error.message, 'error')
      }
    }
  })

  const handleSubmit = () => {
    if (!signedTx) return

    // Parse the signed transaction
    const parsedTx = ethers.utils.parseTransaction(signedTx)

    sendTransaction({
      to: parsedTx.to,
      data: parsedTx.data,
      chainId: chain.id,
      value: parsedTx.value
    })
  }

  const hintSuccess = (result: any) => {
    notify(result.hint, 'info', notificationParams(NotificationType.info))
  }

  const submitSuccess = (result: any) => {
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
        {
          !signedTx &&
          <Textarea
            placeholder="Share your thoughts..."
            className="flex-1 min-h-[180px] p-2 w-full"
            onChange={(e) => setNote(e.target.value)}
            value={note} />
        }
      </div>
      <div className="flex space-x-2 justify-center mt-4">
        <LitButton
          action={hintLitAction} actionParams={hintParams} onSuccess={hintSuccess}
          icon={<Lightbulb />} text="Hint" variant="outline"
          className="w-32" />
        {
          signedTx ?
            <Button
              variant="outline"
              className="w-32"
              onClick={handleSubmit}>
              <Send /> Submit
            </Button>
            :
            <LitButton
              action={submitLitAction} actionParams={submitParams} onSuccess={submitSuccess}
              icon={<Brain />} text="Evaluate" disabled={!note.trim()}
              className="w-32" />
        }
      </div>
    </div>
  )
}

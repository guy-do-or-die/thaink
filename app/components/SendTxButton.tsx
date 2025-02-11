import { useEffect } from 'react'

import { useWaitForTransactionReceipt, useSendTransaction } from 'wagmi'

import { Button } from '@/components/ui/button'

import { notify, hide } from '@/components/Notification'
import { txLink } from '@/components/Utils'

import { chain } from '@/wallet'
import { ethers } from 'ethers'

interface SendTxButtonProps {
  signedTx?: string
  disabled?: boolean
  className?: string
  icon?: React.ReactNode
  text?: string
  onSuccess?: () => void
  onError?: (error: Error) => void
  children?: React.ReactNode
}

export function SendTxButton({
  signedTx,
  disabled = false,
  className = "",
  icon,
  text,
  onSuccess,
  onError,
}: SendTxButtonProps) {
  const txMessageId = `${signedTx}-message`

  const { data: tx, isPending, error, sendTransaction } = useSendTransaction()

  const handleSubmit = () => {
    if (!signedTx) return

    const parsedTx = ethers.utils.parseTransaction(signedTx)

    sendTransaction({
      chainId: chain.id,
      to: parsedTx.to,
      value: parsedTx.value,
      data: parsedTx.data,
    })
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
    notify(<span>{txLink(tx, 'Transaction')} sent</span>, 'success', { id: txMessageId })
  }, [tx, isPending])

  useEffect(() => {
    if (error) {
      notify(`Transaction sending failed: ${error}`, 'error')
    }
  }, [tx, error])

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
    <Button
      variant="outline"
      className={className}
      onClick={handleSubmit}
      disabled={disabled || !signedTx}>
      {icon} {text}
    </Button>
  )
}

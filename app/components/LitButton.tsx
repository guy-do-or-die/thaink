import React, { useState } from 'react'

import { useEthersSigner } from '@/ethers'

import { LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { notify } from '@/components/Notification'

import litService from '@/lit/service'

import { tankAbi } from '@/contracts'
import { RPC_URL } from '@/wallet'


interface LitButtonProps {
  icon: React.ReactNode
  text: string
  action: string
  actionParams?: object
  disabled?: boolean
  variant?: string
}

const agentEndpoint = import.meta.env.VITE_AGENT_ENDPOINT


export default function LitButton({ icon, text, className, action, actionParams = {}, disabled = false, onSuccess, onError, variant = 'default' }: LitButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false)

  const signer = useEthersSigner()

  const handleAction = async () => {
    setIsProcessing(true)

    const params = {
      rpcUrl: RPC_URL,
      contractAbi: tankAbi,
      agentEndpoint,
      ...actionParams
    }

    try {
      const res = await litService.action(signer, action, params)

      if (res?.response) {
        const result = JSON.parse(res.response)

        if (result.error) {
          onError ? onError(result) : notify(`Error: ${result.error}`, 'error')
          return false
        }

        onSuccess ? onSuccess?.(result) : notify(`${result.result}`, 'success')
        return true
      }
    } catch (error) {
      console.error(error)
      notify(error.message || 'Failed to perform action', 'error')
      return false
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Button
      onClick={handleAction}
      disabled={!signer || disabled || isProcessing}
      variant={variant} className={`${className} w-32`}>
      {isProcessing ? <LoaderCircle className="animate-spin" /> : <span>{icon}</span>}
      {text}
    </Button>
  )
}
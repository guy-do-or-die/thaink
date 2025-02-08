import { useEffect } from 'react'
import { useWaitForTransactionReceipt } from 'wagmi'

import { LoaderCircle } from "lucide-react"
import { Button } from '@/components/ui/button'

import { notify, hide, parseError } from '@/components/Notification'
import { txLink } from '@/components/Utils'

import { useAccount } from '@/wallet'


export default function TxButton({ simulateHook, writeHook, params, emoji, text, className }) {
    const account = useAccount()

    const {
        data: simulateData,
        isError: isSimulateError,
        isPending: isSimulatePending,
        isSuccess: isSimulateSuccess,
        error: simulateError,
    } = simulateHook({
        query: { enabled: account.connected && params.enabled },
        ...params
    })

    const {
        writeContract,
        data: writeData,
        error: writeError,
        isError: isWriteError,
        isIdle: isWriteIdle,
        isPending: isWritePending,
        isSuccess: isWriteSuccess,
    } = writeHook({
        query: { enabled: account.connected && params.enabled && isSimulateSuccess },
        ...params
    })

    const {
        data: confirmationData,
        error: confirmationError,
        isError: isConfirmationError,
        isLoading: isConfirmationLoading,
        isSuccess: isConfirmationSuccess,
    } = useWaitForTransactionReceipt({
        confirmations: 1,
        hash: writeData,
        query: { enabled: account.connected && params.enabled && writeData },
        ...params,
    })

    useEffect(() => {
        if (params.enabled && isSimulatePending) {
            notify('Loading', 'loading', { id: 'simulating' })
        } else {
            hide('simulating')
        }
    })

    useEffect(() => {
        if (isSimulateError) {
            params.onSimulateError?.(simulateError) || notify(parseError(simulateError), 'error')
        }
        if (isSimulateSuccess) {
            params.onSimulateSuccess?.(simulateData) || notify(simulateData?.result, 'success')
        }
        if (isSimulateError || isSimulateSuccess) {
            params.simulateCallback?.({ data: simulateData, error: simulateError })
        }
    }, [isSimulateError, isSimulateSuccess])

    useEffect(() => {
        params.pendingCallback?.()
    }, [isWritePending])

    useEffect(() => {
        if (isWriteError) {
            params.onWriteError?.(writeError) || notify(parseError(writeError), 'error')
        }
        if (isWriteSuccess) {
            params.onWriteSuccess?.(writeData) ||
                notify(<span>{txLink(writeData, 'Transaction')} sent</span>, 'success', { id: writeData })
        }
        if (isWriteError || isWriteSuccess) {
            params.writeCallback?.({ data: writeData, error: writeError })
        }
    }, [isWriteError, isWriteSuccess])

    useEffect(() => {
        if (params.enabled && writeData && isConfirmationLoading) {
            notify(<span>Confirming {txLink(writeData, 'Transaction')}</span>, 'loading', { id: 'confirming' })
        } else {
            hide('confirming')
        }
    }, [isConfirmationLoading])

    useEffect(() => {
        if (isConfirmationError) {
            params.onConfirmationError?.(confirmationError) ||
                notify(parseError(confirmationError), 'error')
        }
        if (isConfirmationSuccess) {
            params.onConfirmationSuccess?.(confirmationData) ||
                notify(<span>{txLink(confirmationData?.transactionHash, 'Transaction')} confirmed</span>, 'success')
        }
        if (isConfirmationError || isConfirmationSuccess) {
            params.confirmationCallback?.({ data: confirmationData, error: confirmationError })
        }
    }, [isConfirmationError, isConfirmationSuccess])

    const loading = isWritePending || isConfirmationLoading && !isConfirmationSuccess && !isConfirmationError
    const disabled = !account?.connected || !params?.enabled || !Boolean(simulateData?.request) || loading

    const onClick = () => writeContract({ ...simulateData!.request, account: undefined })

    return (
        <div>
            <Button variant="ghost" disabled={disabled} onClick={onClick} className={className}>
                {loading ? <LoaderCircle className="animate-spin" /> : <span>{emoji}</span>}
                {text}
            </Button>
        </div >
    )
}
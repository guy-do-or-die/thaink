import { useSwitchChain } from 'wagmi'
import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { useAccount, chain } from '@/wallet'

import { notify, hide } from '@/components/Notification'
import { thainkAddress } from '@/contracts'


function SwitchChain({ onSuccess, onError }) {
  const { switchChain } = useSwitchChain()

  const doSwitch = () => switchChain({
    chainId: chain.id,
  }, {
    onSuccess: data => {
      notify(`Successfully switched to ${data.name}`, 'success')
      onSuccess?.()
    },
    onError: error => {
      notify(`Can't switch: ${error}`, 'error')
      onError?.()
    }
  })

  return <div>
    {`Please, `}
    <a href="#" onClick={doSwitch} className="font-bold underline">switch</a>
    {` to ${chain.name}`}
  </div>
}


export default function Connection() {
  const { chain: chainConnected, connected, connect, disconnect } = useAccount()
  const { switchChain } = useSwitchChain()

  useEffect(() => {
    if (connected && chainConnected && chainConnected.id !== chain.id) {
      switchChain({
        chainId: chain.id
      }, {
        onSuccess: data => notify(`Successfully switched to ${data.name}`, 'success'),
        onError: error => {
          const wrongChainNotificationId = 'wrong-chain'

          notify(
            <SwitchChain onSuccess={() => hide(wrongChainNotificationId)} onError={() => hide(wrongChainNotificationId)} />,
            'error',
            { id: wrongChainNotificationId, duration: Infinity }
          )
        }
      })
    }
  }, [connected, chainConnected, switchChain])

  return <>
    {connected ?
      <Button variant="outline" onClick={disconnect}>Log out</Button> :
      <Button onClick={connect}>Log in</Button>
    }
  </>
}

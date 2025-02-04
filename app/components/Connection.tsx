import { useSwitchChain } from 'wagmi'

import { Button } from '@/components/ui/button'
import { useAccount, chain } from '@/wallet'

import { notify, hide } from '@/components/Notification'
import { thainkAddress } from '@/contracts'


const SwitchChain = ({ onSuccess, onError }) => {

  const { switchChain } = useSwitchChain()

  const doSwitch = () => switchChain({
    chainId: chain.id,
  }, {
    onSuccess: data => {
      notify(`Succesfully switched to ${data.name}`, 'success')
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
  const { chain: chainConnected, connected, connect, disconnect } = useAccount();

  if (connected && chainConnected && chainConnected.id !== chain.id) {
    const wrongChainNotificationId = 'wrong-chain'

    notify(<SwitchChain onSuccess={() => hide(wrongChainNotificationId)} />, 'error', { id: wrongChainNotificationId, duration: Infinity })
  }

  return <>
    {connected ? <Button variant="outline" onClick={disconnect}>Log out</Button> : <Button onClick={connect}>Log in</Button>}
  </>;
}

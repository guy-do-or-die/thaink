import { Button } from '@/components/ui/button'
import { useAccount } from '@/wallet'

export default function Connection() {
  const { connected, connect, disconnect } = useAccount();

  return <>
    {connected ? <Button variant="outline" onClick={disconnect}>Log out</Button> : <Button onClick={connect}>Log in</Button>}
  </>;
}

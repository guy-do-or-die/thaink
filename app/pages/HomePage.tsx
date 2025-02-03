import Content from '../components/Content';

import { useAccount } from '@/wallet'

import { TxButton } from '@/components/TxButton'

import { useSimulateThainkMakeTank, useWriteThainkMakeTank } from '@/contracts'


export default function HomePage() {

  const { connected } = useAccount()

  const makeTankParams = {
    args: [],
    enabled: connected,
    onConfirmationSuccess: data => {
      console.log('data', data)
    }
  }

  return (
    <Content>
      <TxButton text="Make Tank" emoji="✨"
        simulateHook={useSimulateThainkMakeTank}
        writeHook={useWriteThainkMakeTank}
        params={makeTankParams} />
    </Content>
  );
}

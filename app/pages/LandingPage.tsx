import { Button } from '@/components/ui/button'

import Content from '@/components/Content'
import Connection from '@/components/Connection'
import Logo from '@/components/Logo'

import { useAccount } from '@/wallet'
import { useNavigation } from '@/hooks/useNavigation'
import { ROUTES } from '@/routes.config'


export default function LandingPage() {

  const { connected } = useAccount()
  const { navigateTo } = useNavigation()

  return (
    <Content>
      <div className="text-center space-y-8">
        <div className="flex justify-center py-4">
          <Logo height={200} />
        </div>
        <h1 className="text-4xl font-bold">Welcome to Thaink Tank</h1>
      </div>
      <div className="text-center space-y-8 mt-8">
        {
          connected ?
            <Button variant="outline" onClick={() => navigateTo(ROUTES.TANKS.path)}>Continue</Button>
            :
            <>
              <p className="text-xl">Connect your wallet to continue</p>
              <Connection />
            </>
        }
      </div>
    </Content>);
}

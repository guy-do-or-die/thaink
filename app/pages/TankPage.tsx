import { useParams } from 'wouter'
import { useAccount } from '@/wallet'
import { useReadThainkBalanceOf } from '@/contracts'

import Content from '@/components/Content'
import Tank from '@/components/Tank'
import Interact from '@/components/Interact'

export default function TankPage() {
  const { id } = useParams()
  const tankId = parseInt(id || '0')
  const { address } = useAccount()
  
  const { data: balance } = useReadThainkBalanceOf({
    args: [address, BigInt(tankId)]
  })

  const hasMinted = Boolean(balance && balance > 0)
  const hasContributed = false // TODO: Implement this check

  return (
    <Content>
      <div className="w-full space-y-8">
        <Tank tankId={tankId} variant="single" />
        <Interact 
          tankId={tankId}
          hasMinted={hasMinted}
          hasContributed={hasContributed}
        />
      </div>
    </Content>
  )
}

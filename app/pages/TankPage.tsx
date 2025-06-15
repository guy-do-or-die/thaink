import { useEffect } from 'react'
import { useParams } from 'wouter'
import { useAccount } from '@/wallet'
import { useReadThainkBalanceOf, useReadThainkTanks } from '@/contracts'
import { useNavigation } from '@/hooks/useNavigation'

import { ROUTES } from '@/routes.config'

import Content from '@/components/Content'
import Tank from '@/components/Tank'
import Engage from '@/components/Engage'

export default function TankPage() {
  const { id } = useParams()
  const { navigateTo } = useNavigation()

  const tankId = parseInt(id || '0')

  const { data: tankAddress, isFetched: isTankAddressFetched } = useReadThainkTanks({
    args: [BigInt(tankId)],
    query: {
      enabled: !!tankId,
    },
  })

  const { address } = useAccount()

  const { data: balance } = useReadThainkBalanceOf({
    args: [address, BigInt(tankId)],
    query: {
      enabled: !!address,
    },
  })

  useEffect(() => {
    if (isTankAddressFetched && !tankAddress) {
      navigateTo(ROUTES.NOT_FOUND.path)
    }
  }, [tankAddress, isTankAddressFetched])

  if (!tankAddress) {
    return null
  }

  const hasMinted = Boolean(balance && balance > 0)
  const hasContributed = false

  return (
    <Content>
      <div className="w-full space-y-8">
        <Tank tankId={tankId} variant="single" />
        <Engage tankId={tankId} tankAddress={tankAddress} hasMinted={hasMinted} hasContributed={hasContributed} />
      </div>
    </Content>
  )
}

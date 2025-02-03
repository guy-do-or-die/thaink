import { useReadThainkTanksNumber } from '@/contracts'

import Content from '@/components/Content';

import Tank from '@/components/Tank'


export default function TanksPage() {

  const { data: tanksNumber } = useReadThainkTanksNumber({})
  const lastTankId = Number(tanksNumber) || 0

  const tanksIds = Array.from({ length: 5 }, (_, i) => lastTankId - i)

  return <Content>
    <h1 className="text-2xl font-bold mb-4">Latest Thaink Tanks</h1>
    <div className="space-y-4">
      {tanksIds.map((tankId, index) => (
        <Tank key={index} tankId={tankId} />
      ))}
    </div>
  </Content>
}

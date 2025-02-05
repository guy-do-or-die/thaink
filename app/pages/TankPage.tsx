import { useParams } from 'wouter'

import Content from '@/components/Content'
import Tank from '@/components/Tank'

export default function TankPage() {
  const params = useParams()
  const tankId = parseInt(params?.id || '0', 10)

  return (
    <Content>
      <div className="flex justify-center p-4 w-full md:w-2/3 lg:w-1/2">
        <Tank tankId={tankId} variant="single" />
      </div>
    </Content>
  )
}

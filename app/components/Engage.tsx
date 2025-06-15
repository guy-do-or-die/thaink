import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ContributeForm } from '@/components/tank/ContributeForm'
import { PromptForm } from '@/components/tank/PromptForm'

interface EngageProps {
  tankId: number
  hasMinted: boolean
  hasContributed: boolean
  tankAddress: string
}

export default function Engage({ tankId, hasMinted, hasContributed, tankAddress }: EngageProps) {
  if (!hasMinted && !hasContributed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contribute</CardTitle>
          <CardDescription>Join the idea development</CardDescription>
        </CardHeader>
        <CardContent>
          <ContributeForm tankId={tankId} tankAddress={tankAddress} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <Tabs defaultValue="contribute" className="w-full">
        <CardHeader className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contribute">Contribute</TabsTrigger>
            <TabsTrigger value="prompt">Interact</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <TabsContent value="contribute" className="mt-0">
            <ContributeForm tankId={tankId} tankAddress={tankAddress} />
          </TabsContent>
          <TabsContent value="prompt" className="mt-0">
            <PromptForm tankId={tankId} tankAddress={tankAddress} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}

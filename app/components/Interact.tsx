import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ContributeForm } from '@/components/tank/ContributeForm'
import { PromptForm } from '@/components/tank/PromptForm'


interface InteractProps {
  tankId: number
  hasMinted: boolean
  hasContributed: boolean
  address: string
}

export default function Interact({ tankId, hasMinted, hasContributed, address }: InteractProps) {
  if (!hasMinted && !hasContributed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contribute</CardTitle>
          <CardDescription>Join the idea development</CardDescription>
        </CardHeader>
        <CardContent>
          <ContributeForm tankId={tankId} address={address} />
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
            <TabsTrigger value="prompt">AI Prompt</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent>
          <TabsContent value="contribute" className="mt-0">
            <ContributeForm tankId={tankId} address={address} />
          </TabsContent>
          <TabsContent value="prompt" className="mt-0">
            <PromptForm tankId={tankId} />
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}

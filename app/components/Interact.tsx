import { useState } from 'react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

interface InteractProps {
  tankId: number
  hasMinted: boolean
  hasContributed: boolean
}

export default function Interact({ tankId, hasMinted, hasContributed }: InteractProps) {
  const [note, setNote] = useState('')

  const handleContribute = () => {
    // TODO: Implement contribution logic
    console.log('Contributing note:', note)
  }

  const handlePrompt = () => {
    // TODO: Implement prompting logic
    console.log('Prompting for tank:', tankId)
  }

  if (!hasMinted && !hasContributed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contribute</CardTitle>
          <CardDescription>Share your thoughts about this tank</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2 rounded-md border p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground font-medium">AI Hints:</p>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">• Consider mentioning specific aspects of the tank's design</p>
                <p className="text-sm text-muted-foreground">• Share your experience with similar implementations</p>
                <p className="text-sm text-muted-foreground">• Suggest potential improvements or alternative approaches</p>
              </div>
            </div>
            <Textarea
              placeholder="Write your note here..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[120px]"
            />
            <Button onClick={handleContribute}>Submit</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!hasMinted) {
    return null
  }

  const canDoEither = hasMinted && !hasContributed

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interact</CardTitle>
        <CardDescription>Engage with this tank</CardDescription>
      </CardHeader>
      <CardContent>
        {canDoEither ? (
          <Tabs defaultValue="prompt">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="prompt">Prompt</TabsTrigger>
              <TabsTrigger value="contribute">Contribute</TabsTrigger>
            </TabsList>
            <TabsContent value="prompt" className="space-y-4">
              <div className="space-y-2 mt-4">
                <p className="text-sm">Generate new ideas using this tank as inspiration</p>
                <Button onClick={handlePrompt} className="w-full">Generate</Button>
              </div>
            </TabsContent>
            <TabsContent value="contribute" className="space-y-4">
              <div className="space-y-4 mt-4">
                <div className="space-y-2 rounded-md border p-4 bg-muted/50">
                  <p className="text-sm text-muted-foreground font-medium">AI Hints:</p>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">• Consider mentioning specific aspects of the tank's design</p>
                    <p className="text-sm text-muted-foreground">• Share your experience with similar implementations</p>
                    <p className="text-sm text-muted-foreground">• Suggest potential improvements or alternative approaches</p>
                  </div>
                </div>
                <Textarea
                  placeholder="Write your note here..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="min-h-[120px]"
                />
                <Button onClick={handleContribute}>Submit</Button>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <div className="space-y-2">
            <p className="text-sm">Generate new ideas using this tank as inspiration</p>
            <Button onClick={handlePrompt} className="w-full">Generate</Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

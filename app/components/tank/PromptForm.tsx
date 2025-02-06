import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { notify } from '@/components/Notification'
import { Sparkles } from 'lucide-react'

interface PromptFormProps {
  tankId: number
}

export function PromptForm({ tankId }: PromptFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handlePrompt = async () => {
    try {
      setIsLoading(true)
      // TODO: Implement prompting logic with Lit Protocol gating
      notify('Prompting feature coming soon!', 'info')
    } catch (error) {
      console.error('Error prompting:', error)
      notify('Failed to execute prompt', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 space-y-4">
        <div className="space-y-4 rounded-md border p-6 bg-muted/50">
          <div className="space-y-2">
            <h3 className="font-semibold">AI-Powered Insights</h3>
            <p className="text-sm text-muted-foreground">
              Get AI-generated analysis and insights about this tank's contributions. 
              This feature helps you understand:
            </p>
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-4">
            <li>Key themes and patterns across contributions</li>
            <li>Novel approaches and unique perspectives</li>
            <li>Potential areas for further exploration</li>
            <li>Synthesis of different viewpoints</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Note: This feature requires holding tank tokens to access.
          </p>
        </div>
      </div>
      <Button
        onClick={handlePrompt}
        disabled={isLoading}
        className="py-6 text-lg font-semibold mt-4"
      >
        <Sparkles className="mr-2 h-5 w-5" />
        {isLoading ? 'Processing...' : 'Generate Insights'}
      </Button>
    </div>
  )
}

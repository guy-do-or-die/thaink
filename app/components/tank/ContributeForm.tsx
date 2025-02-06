import { useState } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Send } from 'lucide-react'
import { notify } from '@/components/Notification'
import { litService } from '@/lib/lit'
import { useSimulateTankAddNote, useWriteTankAddNote } from '@/contracts'
import TxButton from '@/components/TxButton'

interface ContributeFormProps {
  tankId: number
  address: string
}

export function ContributeForm({ tankId, address }: ContributeFormProps) {
  const [note, setNote] = useState('')
  const [isEncrypting, setIsEncrypting] = useState(false)

  const addNoteParams = {
    args: [tankId, note],
  }

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 space-y-4">
        <AIHints />
        <Textarea
          placeholder="Write your note here..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1 min-h-[180px]"
          disabled={isEncrypting} 
        />
      </div>
      <TxButton
        text={isEncrypting ? 'Encrypting...' : 'Submit'}
        className="py-6 text-lg font-semibold mt-4"
        emoji={<Send className="rgba(0,82,255,0.3)" />}
        simulateHook={useSimulateTankAddNote}
        writeHook={useWriteTankAddNote}
        params={addNoteParams} 
      />
    </div>
  )
}

function AIHints() {
  return (
    <div className="space-y-2 rounded-md border p-4 bg-muted/50">
      <p className="text-sm text-muted-foreground font-medium">AI Hints:</p>
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">• Consider mentioning specific aspects of the tank's design</p>
        <p className="text-sm text-muted-foreground">• Share your experience with similar implementations</p>
        <p className="text-sm text-muted-foreground">• Suggest potential improvements or alternative approaches</p>
      </div>
    </div>
  )
}

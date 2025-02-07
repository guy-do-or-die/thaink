import { useState } from 'react'

import { Send } from 'lucide-react'

import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

import TxButton from '@/components/TxButton'
import { notify } from '@/components/Notification'

import { useSimulateTankAddNote, useWriteTankAddNote } from '@/contracts'
import { useSignMessage } from 'wagmi'

import litService from '@/lit/service'
import { useEthersSigner } from '@/ethers'

interface ContributeFormProps {
  tankId: number
  address: string
}

interface HintResponse {
  hint: string
  evaluation?: number
}

export function ContributeForm({ tankId, address }: ContributeFormProps) {
  const [note, setNote] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [hint, setHint] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [lastAttemptTimestamp, setLastAttemptTimestamp] = useState<number | null>(null)
  const { signMessageAsync } = useSignMessage()

  const ethersSigner = useEthersSigner()

  const addNoteParams = {
    args: [tankId, note],
  }

  const getSignedMessage = async () => {
    const message = `Contributing to tank ${tankId} at ${Date.now()}`
    const signature = await signMessageAsync({ message })
    return { message, signature }
  }

  const requestHint = async () => {
    try {
      const { message, signature } = await getSignedMessage()

      // Execute Lit Action to get hint
      const response = await litService.executeAction('getHint', {
        tankId,
        address,
        message,
        signature,
        previousNote: note, // Only if not first attempt
      })

      const hintResponse = response as HintResponse
      setHint(hintResponse.hint)
      return hintResponse
    } catch (error) {
      console.error('Failed to get hint:', error)
      notify({
        title: 'Error',
        description: 'Failed to get hint. Please try again.',
        type: 'error'
      })
      return null
    }
  }

  const validateNote = async () => {
    if (!note.trim()) {
      notify({ title: 'Error', description: 'Please enter a note', type: 'error' })
      return false
    }

    try {
      const { message, signature } = await getSignedMessage()

      // Execute Lit Action to validate note
      const response = await litService.executeAction('validateNote', {
        tankId,
        address,
        note,
        message,
        signature
      })

      const validationResponse = response as HintResponse

      if (!validationResponse.evaluation || validationResponse.evaluation < 0.7) {
        setAttempts(prev => prev + 1)

        if (attempts >= 2) {
          setLastAttemptTimestamp(Date.now())
          notify({
            title: 'Cooldown Period',
            description: 'You\'ve reached the maximum attempts. Please try again in 24 hours.',
            type: 'error'
          })
          return false
        }

        setHint(validationResponse.hint)
        notify({
          title: 'Note Needs Improvement',
          description: validationResponse.hint,
          type: 'info'
        })
        return false
      }

      // If validation passes, process the final submission
      return await processSubmission()
    } catch (error) {
      console.error('Validation failed:', error)
      notify({
        title: 'Validation Failed',
        description: 'Failed to validate your note. Please try again.',
        type: 'error'
      })
      return false
    }
  }

  const processSubmission = async () => {
    try {
      const { message, signature } = await getSignedMessage()

      // Execute final Lit Action to process submission
      const response = await litService.executeAction('processSubmission', {
        tankId,
        address,
        note,
        message,
        signature
      })

      // The Lit Action should return the encrypted note and digest
      const { encryptedNote, encryptedDigest } = response

      // Update addNoteParams with encrypted data
      addNoteParams.args = [address, encryptedNote, 0, encryptedDigest]
      return true
    } catch (error) {
      console.error('Submission processing failed:', error)
      notify({
        title: 'Submission Failed',
        description: 'Failed to process your submission. Please try again.',
        type: 'error'
      })
      return false
    }
  }

  const checkCooldown = () => {
    if (!lastAttemptTimestamp) return true
    const cooldownPeriod = 24 * 60 * 60 * 1000 // 24 hours in milliseconds
    return Date.now() - lastAttemptTimestamp >= cooldownPeriod
  }

  const handleSubmit = async () => {
    if (!checkCooldown()) {
      notify({
        title: 'Cooldown Period',
        description: 'Please wait 24 hours before trying again.',
        type: 'error'
      })
      return false
    }

    if (!note.trim()) {
      notify({
        title: 'Empty Note',
        description: 'Please enter a note before submitting.',
        type: 'error'
      })
      return false
    }

    setIsProcessing(true)
    try {
      const digestKey = crypto.getRandomValues(new Uint8Array(32))
      const noteKey = crypto.getRandomValues(new Uint8Array(32))

      const res = await litService.test(
        ethersSigner,
        address,
        note,  // Pass plain text note for evaluation
        Array.from(digestKey).map(b => b.toString(16).padStart(2, '0')).join(''),
        Array.from(noteKey).map(b => b.toString(16).padStart(2, '0')).join('')
      )
      
      if (res?.response) {
        const result = JSON.parse(res.response)
        
        if (result.error) {
          setHint(`Error: ${result.error}`)
          return false
        }

        const { evaluation, evaluationSignature, transaction } = result
        
        if (!evaluation.worthy) {
          setHint(`Note not accepted (Score: ${evaluation.score}/100). ${evaluation.reason}`)
          return false
        }

        setHint(`Your note scored ${evaluation.score}/100! ${evaluation.reason}`)
        
        if (transaction) {
          if (transaction.success) {
            setHint(prev => `${prev}\n\nTransaction sent successfully! Hash: ${transaction.hash}`)
            setLastAttemptTimestamp(Date.now())
            return true
          } else {
            setHint(prev => `${prev}\n\nFailed to submit transaction: ${transaction.error}`)
            return false
          }
        } else {
          setHint(prev => `${prev}\n\nNo transaction was created. Please try again.`)
          return false
        }
      }
      return false
    } catch (error) {
      console.error(error)
      notify({
        title: 'Error',
        description: error.message || 'Failed to process your submission',
        type: 'error'
      })
      return false
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 space-y-4">
        {hint && (
          <div className="space-y-2 rounded-md border p-4 bg-blue-50">
            <p className="text-sm text-blue-600 font-medium">AI Hint:</p>
            <p className="text-sm text-blue-800">{hint}</p>
          </div>
        )}
        <Textarea
          placeholder="Write your note here..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="flex-1 min-h-[180px]"
          disabled={isProcessing}
        />
      </div>
      <Button
        onClick={handleSubmit}
        className="py-6 text-lg font-semibold mt-4">
        Get Hint
      </Button>
      <TxButton
        text={isProcessing ? 'Processing...' : attempts === 0 ? 'Get Hint' : 'Submit'}
        className="py-6 text-lg font-semibold mt-4"
        emoji={<Send className="rgba(0,82,255,0.3)" />}
        simulateHook={useSimulateTankAddNote}
        writeHook={useWriteTankAddNote}
        params={addNoteParams}
      />
    </div >
  )
}

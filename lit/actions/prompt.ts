import { createLitAction, getAccessControlConditions, decrypt, getContractData } from './utils'
import { callAgent, getPromptResponse, createPromptingPrompt, callLLM, getContextHeader } from './llm'

declare var Lit: any
declare var rpcUrl: string
declare var contractAddress: string
declare var contractAbi: any[]
declare var prompt: string

export interface promptLitActionParams {
  rpcUrl: string
  prompt: string
  contractAbi: Array<object>
  contractAddress: string
  chainNetwork: string
  chainId: number
}

const _promptLitAction = async () => {
  const { idea, llmUrl, digest, config } = await getContractData(rpcUrl, contractAddress, contractAbi)

  const agentResult = await callAgent({ idea, digest, action: 'prompt', prompt, llmUrl, config })
  Lit.Actions.setResponse({ response: JSON.stringify(agentResult) })
}

export const promptLitAction = createLitAction(_promptLitAction, [
  getContractData,
  getAccessControlConditions,
  decrypt,
  callAgent,
  getPromptResponse,
  createPromptingPrompt,
  callLLM,
  getContextHeader,
])

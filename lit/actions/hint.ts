import { createLitAction, getAccessControlConditions, decrypt, getContractData } from './utils'
import { callAgent, getHint, createHintPrompt, callLLM, getContextHeader } from './llm'

declare var Lit: any
declare var rpcUrl: string
declare var contractAddress: string
declare var contractAbi: Array<object>

export interface hintLitActionParams {
  rpcUrl: string
  contractAbi: Array<object>
  contractAddress: string
  chainNetwork: string
  chainId: number
}

const _hintLitAction = async () => {
  const { idea, llmUrl, digest, config } = await getContractData(rpcUrl, contractAddress, contractAbi)

  const agentResult = await callAgent({
    action: 'hint',
    idea,
    digest,
    llmUrl,
    config,
  })

  Lit.Actions.setResponse({ response: JSON.stringify(agentResult) })
}

export const hintLitAction = createLitAction(_hintLitAction, [
  getContractData,
  getAccessControlConditions,
  decrypt,
  callAgent,
  getHint,
  createHintPrompt,
  callLLM,
  getContextHeader,
])

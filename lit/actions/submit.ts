import { createLitAction } from '../builder'
import {
  getAccessControlConditions,
  encrypt,
  decrypt,
  signMessage,
  buildAndSignTransaction,
  getContractData,
} from './utils'

import {
  callAgent,
  callLLM,
  evaluateAndDigest,
  createEvaluationPrompt,
  getContextHeader,
  createDigestPrompt,
} from './llm'

declare const Lit: any
declare const rpcUrl: string
declare const contractAddress: string
declare const contractAbi: Array<object>
declare const note: string
declare const pkp: string
declare const address: string

export interface submitLitActionParams {
  note: string
  contractAddress: string
  contractAbi: Array<object>
  chainNetwork: string
  chainId: number
}

const _submitLitAction = async () => {
  const { idea, llmUrl, digest, config, ipfsCids, contract } = await getContractData(
    rpcUrl,
    contractAddress,
    contractAbi,
  )

  const agentResult = await callAgent({
    action: 'evaluate_and_digest',
    idea,
    digest,
    note,
    llmUrl,
    config,
  })

  const evaluation = agentResult.evaluation
  const digestResult = agentResult.digest

  const value = Math.round(evaluation.weightedScore)

  let response = agentResult
  if (evaluation.verdict === 'accept') {
    const { ciphertext: encryptedNote, dataToEncryptHash: noteHash } = await encrypt(ipfsCids, note)
    const { ciphertext: encryptedDigest, dataToEncryptHash: newDigestHash } = await encrypt(ipfsCids, digestResult)

    const ideaHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(idea))
    const ideaSignature = await signMessage(ideaHash, pkp)

    const scoreValue = ethers.BigNumber.from(Math.round(value))

    const txData = await buildAndSignTransaction({
      contract,
      pkp,
      address,
      encryptedNote,
      encryptedDigest,
      noteHash,
      newDigestHash,
      scoreValue,
      ideaSignature,
    })

    response = {
      ...response,
      ...txData,
    }
  }

  Lit.Actions.setResponse({ response: JSON.stringify(response) })
}

export const submitLitAction = createLitAction(_submitLitAction, [
  getAccessControlConditions,
  getContractData,
  encrypt,
  decrypt,
  callAgent,
  signMessage,
  buildAndSignTransaction,
  evaluateAndDigest,
  callLLM,
  createEvaluationPrompt,
  createDigestPrompt,
  getContextHeader,
])

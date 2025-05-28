import 'ethers'
import {
  createLitAction,
  getAccessControlConditions,
  encrypt,
  decrypt,
  signMessage,
  buildAndSignTransaction,
  callAgent,
  callAgentForSubmit,
} from './utils'

export interface submitLitActionParams {
  contractAddress: string
  note: string
}

const _submitLitAction = async () => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const contract = new ethers.Contract(contractAddress, contractAbi, provider)

  const idea = await contract.idea()
  const digest = await contract.digest()
  const digestHash = await contract.digestHash()

  const decryptedDigest = digest ? await decrypt(ipfsCid, digest, digestHash) : 'empty'

  const agentResult = await callAgentForSubmit(agentEndpoint, idea, decryptedDigest, note)

  const evaluation = agentResult.evaluation
  const digestResult = agentResult.digest

  const value = Math.round(evaluation.weightedScore)

  let response = agentResult
  if (evaluation.verdict === 'accept') {
    const { ciphertext: encryptedNote, dataToEncryptHash: noteHash } = await encrypt(ipfsCid, note)
    const { ciphertext: encryptedDigest, dataToEncryptHash: newDigestHash } = await encrypt(ipfsCid, digestResult)

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
      ...txData
    }
  }

  Lit.Actions.setResponse({ response: JSON.stringify(response) })
}

export const submitLitAction = createLitAction(_submitLitAction, [
  getAccessControlConditions,
  encrypt,
  callAgent,
  callAgentForSubmit,
  decrypt,
  signMessage,
  buildAndSignTransaction
])

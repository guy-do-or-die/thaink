import { createLitAction, getAccessControlConditions, decrypt, callAgent, callAgentForPrompt } from './utils'

export interface promptLitActionParams {
    rpcUrl: string
    contractAbi: Array<object>
    contractAddress: string
    agentEndpoint: string
    prompt: string
}

const _promptLitAction = async () => {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    const contract = new ethers.Contract(contractAddress, contractAbi, provider)

    const idea = await contract.idea()
    const digest = await contract.digest()
    const digestHash = await contract.digestHash()

    const decryptedDigest = digest ? await decrypt(ipfsCid, digest, digestHash) : 'empty'

    const agentResult = await callAgentForPrompt(agentEndpoint, idea, decryptedDigest, prompt)
    Lit.Actions.setResponse({ response: JSON.stringify(agentResult) })
}

export const promptLitAction = createLitAction(_promptLitAction, [
    getAccessControlConditions,
    decrypt,
    callAgent,
    callAgentForPrompt
])

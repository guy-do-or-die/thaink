import { createLitAction, getAccessControlConditions, decrypt, callAgent, callAgentForHint } from './utils'

export interface hintLitActionParams {
    rpcUrl: string
    contractAbi: Array<object>
    contractAddress: string
    agentEndpoint: string
}

const _hintLitAction = async () => {
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
    const contract = new ethers.Contract(contractAddress, contractAbi, provider)

    const idea = await contract.idea()
    const digest = await contract.digest()
    const digestHash = await contract.digestHash()

    const decryptedDigest = digest ? await decrypt(ipfsCid, digest, digestHash) : 'empty'

    const agentResult = await callAgentForHint(agentEndpoint, idea, decryptedDigest)

    Lit.Actions.setResponse({ response: JSON.stringify(agentResult) })
}

export const hintLitAction = createLitAction(_hintLitAction, [
    getAccessControlConditions,
    decrypt,
    callAgent,
    callAgentForHint,
])
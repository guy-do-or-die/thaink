import 'ethers'

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

    const agentResponse = await fetch(agentEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            action: 'prompt',
            idea,
            digest: digest || 'empty',
            prompt
        })
    })

    if (!agentResponse.ok) {
        throw new Error(`Agent call failed: ${agentResponse.statusText}`)
    }

    Lit.Actions.setResponse({ response: JSON.stringify(await agentResponse.json()) })
}

export const promptLitAction = `(${_promptLitAction.toString()})()`

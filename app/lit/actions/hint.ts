import 'ethers'


export interface hintLitActionParams {
    rpcUrl: string
    contractAbi: Array<object>
    contractAddress: string
    agentEndpoint: string
}

const _hintLitAction = async () => {
    try {
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
                action: 'hint',
                idea,
                digest: digest || 'empty'
            })
        })

        if (!agentResponse.ok) {
            throw new Error(`Agent call failed: ${JSON.stringify(agentEndpoint)}`)
            throw new Error(`Agent call failed: ${agentResponse.statusText}`)
        }

        Lit.Actions.setResponse({ response: JSON.stringify(await agentResponse.json()) })
    } catch (error) {
        console.error('Error creating hintLitAction:', error)
        throw error
    }
}

export const hintLitAction = `(${_hintLitAction.toString()})()`
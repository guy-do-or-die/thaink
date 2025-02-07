import { useMemo } from 'react'

import type { Account, Client, Chain, Transport } from 'viem'
import { Config, useConnectorClient } from 'wagmi'
import { providers } from 'ethers'

import { chain, wagmiConfig } from '@/wallet'

/*
export function clientToProvider(client: Client<Transport, Chain>) {
    const { chain, transport } = client
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    }
    if (transport.type === 'fallback')
        return new providers.FallbackProvider(
            (transport.transports as ReturnType<Transport>[]).map(
                ({ value }) => new providers.JsonRpcProvider(value?.url, network),
            ),
        )
    return new providers.JsonRpcProvider(transport.url, network)
}


export function getEthersProvider() {
    const client = getClient(wagmiConfig, { chainId: chain.id })

    if (!client) return

    return clientToProvider(client)
}
*/


export function clientToSigner(client: Client<Transport, Chain, Account>) {
    const { account, chain, transport } = client
    const network = {
        chainId: chain.id,
        name: chain.name,
        ensAddress: chain.contracts?.ensRegistry?.address,
    }
    const provider = new providers.Web3Provider(transport, network)
    const signer = provider.getSigner(account.address)
    return signer
}


export function useEthersSigner({ chainId }: { chainId?: number } = {}) {
    const { data: client } = useConnectorClient<Config>({ chainId })
    return useMemo(() => (client ? clientToSigner(client) : undefined), [client])
}
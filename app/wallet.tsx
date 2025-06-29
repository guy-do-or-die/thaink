import { PrivyProvider, usePrivy, useIdentityToken } from '@privy-io/react-auth'
import { WagmiProvider, createConfig } from '@privy-io/wagmi'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, useWalletClient } from 'wagmi'

import { chain } from '../config'

export { chain }

export const RPC_URL = import.meta.env.VITE_RPC_URL
export const queryClient = new QueryClient()

export const privyConfig = {
  loginMethods: ['wallet'],
  defaultChain: chain,
  supportedChains: [chain],
  appearance: { theme: 'light' },
  walletChainType: 'ethereum-only',
}

export const wagmiConfig = createConfig({
  chains: [chain],
  transports: { [chain.id]: http(RPC_URL) },
})

export function useAccount() {
  const { user, ready, authenticated, login: connect, logout: disconnect } = usePrivy()
  const { identityToken } = useIdentityToken()

  const address = user?.wallet?.address
  const connected = ready && authenticated

  const { data: client } = useWalletClient({ account: address })

  const chain = client?.chain

  return {
    chain,
    address,
    connect,
    connected,
    disconnect,
    identityToken,
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider appId={import.meta.env.VITE_PRIVY_APP_ID} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  )
}

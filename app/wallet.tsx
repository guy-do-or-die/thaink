import { PrivyProvider, usePrivy } from '@privy-io/react-auth'
import { WagmiProvider, createConfig } from '@privy-io/wagmi'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, useWalletClient } from 'wagmi'

import * as chains from 'viem/chains'

const supportedChains = {
  'main': chains.base,
  'test': chains.baseSepolia,
  'local': chains.foundry,
}

export const chain = supportedChains[import.meta.env.VITE_CHAIN]
export const RPC_URL = import.meta.env.VITE_RPC_URL

export function useAccount() {
  const { user, ready, authenticated, login: connect, logout: disconnect } = usePrivy()

  const address = user?.wallet?.address
  const connected = !ready || (ready && authenticated)

  const { data: client } = useWalletClient({ account: address })

  const chain = client?.chain

  return {
    chain,
    address,
    connect,
    connected,
    disconnect
  };
};

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient();

  const privyConfig = {
    loginMethods: ['wallet'],
    supportedChains: [chain],
    appearance: { theme: 'light' },
  }

  const wagmiConfig = createConfig({
    chains: [chain],
    transports: { [chain.id]: http(RPC_URL) }
  })

  return (
    <PrivyProvider appId={import.meta.env.VITE_PRIVY_APP_ID} config={privyConfig}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}
import { createConfig, http } from 'wagmi'
import { foundry, base, baseSepolia } from 'wagmi/chains'

const anvilChain = {
  ...foundry,
  id: 31337,
  name: 'Anvil',
  network: 'anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  }
}

export const config = createConfig({
  chains: [anvilChain, baseSepolia, base],
  transports: {
    [anvilChain.id]: http(),
    [baseSepolia.id]: http(import.meta.env.VITE_BASE_SEPOLIA_RPC_URL),
    [base.id]: http(import.meta.env.VITE_BASE_RPC_URL),
  },
})
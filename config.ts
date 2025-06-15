import * as chains from 'viem/chains'
import { config } from 'dotenv'

config()

export const supportedChains = {
  main: chains.base,
  test: chains.baseSepolia,
  local: chains.foundry,
}

const chainFromEnv = (process.env.VITE_CHAIN || import.meta.env?.VITE_CHAIN || 'local') as keyof typeof supportedChains

export const chain = supportedChains[chainFromEnv]

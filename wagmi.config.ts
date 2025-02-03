import { config } from 'dotenv'
import { zeroAddress } from 'viem'
import { defineConfig } from "@wagmi/cli"
import { react, foundry } from '@wagmi/cli/plugins'

import * as chains from "viem/chains";

config()

export default defineConfig({
  out: "app/contracts.ts",
  plugins: [
    react(),
    foundry({
      deployments: {
        Thaink: {
          [chains.foundry.id]: process.env.CONTRACT_ANVIL as `0x${string}` || zeroAddress,
          [chains.base.id]: process.env.CONTRACT_BASE as `0x${string}` || zeroAddress,
          [chains.baseSepolia.id]: process.env.CONTRACT_BASE_SEPOLIA as `0x${string}` || zeroAddress,
        },
      },
    }),
  ],
});
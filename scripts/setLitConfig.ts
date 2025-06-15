import { config } from 'dotenv'
import { ethers } from 'ethers'

import { LitNodeClientNodeJs } from '@lit-protocol/lit-node-client'
import { LitAccessControlConditionResource, generateAuthSig, createSiweMessage } from '@lit-protocol/auth-helpers'
import { LIT_ABILITY, LIT_NETWORK } from '@lit-protocol/constants'
import { encryptString } from '@lit-protocol/encryption'

import { getAccessControlConditions } from '../lit/actions/utils.ts'
import { LLMConfig } from '../lit/actions/llm.ts'

import { thainkAddress, thainkAbi } from '../app/contracts'
import { chain } from '../config'

import { kebabToCamel } from './utils'

config()

export async function makeWalletSessionSigs(client, wallet, chainNetwork) {
  return await client.getSessionSigs({
    chain: chainNetwork,
    expiration: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
    //capabilityAuthSigs: [capacityDelegationAuthSig],
    resourceAbilityRequests: [
      {
        resource: new LitAccessControlConditionResource('*'),
        ability: LIT_ABILITY.AccessControlConditionDecryption,
      },
    ],
    authNeededCallback: async ({ uri, expiration, resourceAbilityRequests }) => {
      const toSign = await createSiweMessage({
        uri,
        expiration,
        resources: resourceAbilityRequests,
        walletAddress: wallet.address,
        nonce: await client.getLatestBlockhash(),
        litNodeClient: client,
      })

      return await generateAuthSig({
        signer: wallet,
        toSign,
      })
    },
  })
}

async function main() {
  try {
    const hintIpfsCid = process.env.VITE_HINTLITACTION_IPFS_CID
    const submitIpfsCid = process.env.VITE_SUBMITLITACTION_IPFS_CID
    const promptIpfsCid = process.env.VITE_PROMPTLITACTION_IPFS_CID

    const actionIpfsCids = [hintIpfsCid, submitIpfsCid, promptIpfsCid]

    const llmUrl = process.env.OPENAI_API_URL
    const pkp = process.env.PKP_PUBLIC_KEY

    const configData: LLMConfig = {
      openaiApiKey: process.env.OPENAI_API_KEY,
      openaiModel: process.env.OPENAI_MODEL,
      temperature: parseFloat(process.env.TEMPERATURE || '0.5'),
    }

    const client = new LitNodeClientNodeJs({
      alertWhenUnauthorized: false,
      litNetwork: LIT_NETWORK.DatilDev,
      debug: true,
    })

    await client.connect()

    if (!process.env.DEV_PRIVATE_KEY) {
      throw {
        message: 'Please set DEV_PRIVATE_KEY in your .env file',
        kind: LIT_ERROR_KIND.Configuration,
      }
    }

    // Initialize wallet with Lit's network
    const litProvider = new ethers.providers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com/')
    const litWallet = new ethers.Wallet(process.env.DEV_PRIVATE_KEY, litProvider)
    console.log('Lit wallet initialized with address:', litWallet.address)

    const network = kebabToCamel(chain.network)
    const sessionSigs = await makeWalletSessionSigs(client, litWallet, network)

    const { ciphertext: encryptedConfig, dataToEncryptHash: encryptedConfigHash } = await encryptString(
      {
        accessControlConditions: getAccessControlConditions(actionIpfsCids, network),
        dataToEncrypt: JSON.stringify(configData),
        chain: network,
        sessionSigs,
      },
      client,
    )

    await client.disconnect()

    // Initialize wallet with app network
    const provider = new ethers.providers.JsonRpcProvider(chain.rpcUrls.default.http[0])
    const wallet = new ethers.Wallet(process.env.DEV_PRIVATE_KEY, provider)
    console.log('App wallet initialized with address:', wallet.address)

    const contractAddress = thainkAddress[chain.id]
    const contract = new ethers.Contract(contractAddress, thainkAbi, wallet)

    // Convert data to bytes format for the contract
    const pkpBytes = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(pkp || ''))

    console.log('Making contract calls sequentially...')

    // Get the current nonce for our wallet
    let nonce = await wallet.getTransactionCount()

    // Execute setPkp with explicit nonce
    const pkpTx = await contract.setPkp(pkpBytes, { nonce: nonce++ })
    console.log('PKP transaction hash:', pkpTx.hash)
    await pkpTx.wait()
    console.log('PKP set successfully')

    // Execute setLlmUrl with incremented nonce
    const llmUrlTx = await contract.setLlmUrl(llmUrl, { nonce: nonce++ })
    console.log('LLM URL transaction hash:', llmUrlTx.hash)
    await llmUrlTx.wait()
    console.log('LLM URL set successfully')

    // Execute setConfig with incremented nonce
    const configTx = await contract.setConfig(encryptedConfig, encryptedConfigHash, { nonce: nonce++ })
    console.log('Config transaction hash:', configTx.hash)
    await configTx.wait()
    console.log('Config set successfully')

    // Execute setIpfsIds with incremented nonce
    const ipfsTx = await contract.setIpfsIds(hintIpfsCid, submitIpfsCid, promptIpfsCid, { nonce: nonce++ })
    console.log('IPFS IDs transaction hash:', ipfsTx.hash)
    await ipfsTx.wait()
    console.log('IPFS IDs set successfully')

    console.log('Config set successfully')
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()

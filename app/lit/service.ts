import ethers from 'ethers'

import * as LitJsSdk from "@lit-protocol/lit-node-client"
import { LitContracts } from '@lit-protocol/contracts-sdk'
import { disconnectWeb3 } from "@lit-protocol/auth-browser"
import { LIT_NETWORK, LIT_ABILITY } from "@lit-protocol/constants";
import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitActionResource,
  LitPKPResource,
} from "@lit-protocol/auth-helpers";

import { chain as walletChain } from '@/wallet'


const pkpPublicKey = import.meta.env.VITE_PKP_PUBLIC_KEY


class LitService {
  litNodeClient
  chain

  constructor(chain) {
    this.chain = chain
  }

  async connect() {
    this.litNodeClient = new LitJsSdk.LitNodeClient({
      litNetwork: LIT_NETWORK.DatilDev,
    })

    await this.litNodeClient.connect()
  }

  async disconnect() {
    await this.litNodeClient.disconnect()
  }

  async getClient() {
    console.log("Connecting litNodeClient to network...")
    await this.connect()
    console.log("litNodeClient connected!")
    return this.litNodeClient
  }

  async action(
    signer: ethers.providers.JsonRpcSigner,
    action: LitAction,
    params: Object,
  ) {
    try {
      console.log("Starting note evaluation")
      const litClient = await this.getClient()

      const contributor = await signer.getAddress()
      console.log("Connected account:", contributor)

      const sessionSigs = await getSessionSigs(litClient, signer)
      console.log("Got Session Signatures!")

      const response = await litClient.executeJs({
        sessionSigs,
        code: action,
        jsParams: params,
      })

      console.log("response: ", response)
      return response
    } catch (error) {
      console.error(error)
      throw error
    } finally {
      disconnectWeb3()
    }
  }
}

async function getPkpPublicKey(signer) {
  return pkpPublicKey
  if (
    process.env.PKP_PUBLIC_KEY !== undefined &&
    process.env.PKP_PUBLIC_KEY !== ""
  )
    return process.env.PKP_PUBLIC_KEY

  const pkp = await mintPkp(signer)
  console.log("Minted PKP!", pkp)
  return pkp.publicKey
}

async function mintPkp(signer) {
  console.log("Minting new PKP...")
  const litContracts = new LitContracts({
    signer: signer,
    network: LIT_NETWORK.DatilDev,
  })

  await litContracts.connect()

  return (await litContracts.pkpNftContractUtils.write.mint()).pkp
}

async function getSessionSigs(litNodeClient, signer) {
  console.log("Getting Session Signatures...")

  return litNodeClient.getSessionSigs({
    chain: walletChain.network,
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // 24 hours
    resourceAbilityRequests: [
      {
        resource: new LitActionResource("*"),
        ability: LIT_ABILITY.LitActionExecution,
      },
      {
        resource: new LitPKPResource("*"),
        ability: LIT_ABILITY.PKPSigning,
      },
    ],
    authNeededCallback: getAuthNeededCallback(litNodeClient, signer),
  })

  function getAuthNeededCallback(litNodeClient, signer) {
    return async ({ resourceAbilityRequests, expiration, uri }) => {
      const toSign = await createSiweMessageWithRecaps({
        uri,
        expiration,
        resources: resourceAbilityRequests,
        walletAddress: await signer.getAddress(),
        nonce: await litNodeClient.getLatestBlockhash(),
        litNodeClient,
      })

      const authSig = await generateAuthSig({
        signer: signer,
        toSign,
      })

      return authSig
    }
  }
}

//  async getAuthSig(): Promise < AuthSig > {
//  const authSig = await ethConnect.signAndSaveAuthMessage({
//    chain: this.chain,
//    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week
//  })
//    return authSig
//}
//
//  async encryptContribution(content: string, tankId: number) {
//  const authSig = await this.getAuthSig()
//
//  // Access control condition: must be a contributor to this tank
//  const accessControlConditions = [
//    {
//      contractAddress: '', // Your contract address
//      standardContractType: 'ERC1155',
//      chain: this.chain,
//      method: 'balanceOf',
//      parameters: [':userAddress', tankId.toString()],
//      returnValueTest: {
//        comparator: '>',
//        value: '0'
//      }
//    }
//  ]
//
//  const { encryptedString, encryptedSymmetricKey } = await this.client.encrypt({
//    accessControlConditions,
//    authSig,
//    chain: this.chain,
//    dataToEncrypt: content,
//  })
//
//  return {
//    encryptedContent: encryptedString,
//    encryptedSymmetricKey,
//  }
//}
//
//  async decryptContribution(encryptedContent: string, encryptedSymmetricKey: string, tankId: number) {
//  const authSig = await this.getAuthSig()
//
//  // Same access control conditions as encryption
//  const accessControlConditions = [
//    {
//      contractAddress: '', // Your contract address
//      standardContractType: 'ERC1155',
//      chain: this.chain,
//      method: 'balanceOf',
//      parameters: [':userAddress', tankId.toString()],
//      returnValueTest: {
//        comparator: '>',
//        value: '0'
//      }
//    }
//  ]
//
//  const decryptedString = await this.client.decrypt({
//    accessControlConditions,
//    authSig,
//    chain: this.chain,
//    encryptedString: encryptedContent,
//    encryptedSymmetricKey,
//  })
//
//  return decryptedString
//}
//
//  // For AI-generated summaries with different access conditions
//  async encryptSummary(content: string, tankId: number, requiredTokenAmount: string) {
//  const authSig = await this.getAuthSig()
//
//  const accessControlConditions = [
//    {
//      contractAddress: '', // Your contract address
//      standardContractType: 'ERC1155',
//      chain: this.chain,
//      method: 'balanceOf',
//      parameters: [':userAddress', tankId.toString()],
//      returnValueTest: {
//        comparator: '>=',
//        value: requiredTokenAmount
//      }
//    }
//  ]
//
//  const { encryptedString, encryptedSymmetricKey } = await this.client.encrypt({
//    accessControlConditions,
//    authSig,
//    chain: this.chain,
//    dataToEncrypt: content,
//  })
//
//  return {
//    encryptedContent: encryptedString,
//    encryptedSymmetricKey,
//  }
//}


export default new LitService(walletChain.network)
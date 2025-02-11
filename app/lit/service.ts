import ethers from 'ethers'

import * as LitJsSdk from "@lit-protocol/lit-node-client"
import { disconnectWeb3 } from "@lit-protocol/auth-browser"
import { LIT_NETWORK, LIT_ABILITY, LIT_ERROR_KIND } from "@lit-protocol/constants";
import {
  createSiweMessageWithRecaps,
  generateAuthSig,
  LitActionResource,
  LitPKPResource,
} from "@lit-protocol/auth-helpers";

import { chain as walletChain } from '@/wallet'

interface NodeError {
  success: boolean;
  error: {
    success: boolean;
    error: string;
    logs: string;
  };
}

class LitService {
  litNodeClient
  chain

  constructor(chain) {
    this.chain = chain
  }

  async connect() {
    try {
      this.litNodeClient = new LitJsSdk.LitNodeClient({
        litNetwork: LIT_NETWORK.DatilDev,
        debug: true,
        minNodeCount: 1,
      })
      await this.litNodeClient.connect()
    } catch (error) {
      throw {
        message: 'Failed to connect to Lit network',
        kind: LIT_ERROR_KIND.Network,
        originalError: error
      }
    }
  }

  async disconnect() {
    try {
      await this.litNodeClient.disconnect()
    } catch (error) {
      console.error('Error disconnecting from Lit network:', error)
    }
  }

  async getClient() {
    try {
      console.log("Connecting litNodeClient to network...")
      await this.connect()
      console.log("litNodeClient connected!")
      return this.litNodeClient
    } catch (error) {
      if (error.kind === LIT_ERROR_KIND.Network) {
        throw error
      }
      throw {
        message: 'Failed to get Lit client',
        kind: LIT_ERROR_KIND.Configuration,
        originalError: error
      }
    }
  }

  async action(
    signer: ethers.providers.JsonRpcSigner,
    action: LitAction,
    params: Object,
  ) {
    try {
      console.log("Starting Lit Action...")
      const litClient = await this.getClient()

      const contributor = await signer.getAddress()
      console.log("Connected account:", contributor)

      const sessionSigs = await getSessionSigs(litClient, signer)
      console.log("Got Session Signatures!")
      console.log(sessionSigs)

      const response = await litClient.executeJs({
        sessionSigs,
        code: action,
        jsParams: {
          sessionSigs,
          ...params
        },
      })

      console.log("response: ", response)
      return response
    } catch (error) {
      if (error.kind === LIT_ERROR_KIND.Network || error.kind === LIT_ERROR_KIND.Configuration) {
        throw error
      }
      throw {
        message: 'Failed to execute Lit action',
        kind: LIT_ERROR_KIND.Execution,
        originalError: error
      }
    } finally {
      disconnectWeb3()
    }
  }

  parseError(errorStr: string): string {
    try {
      const jsonMatch = errorStr.match(/Response from the nodes: ({.+?}): \[object Object\]/);

      if (!jsonMatch) {
        return errorStr;
      }

      const jsonStr = jsonMatch[1];
      const parsedError = JSON.parse(jsonStr) as NodeError;
      const errorMessage = parsedError.error.error;

      const cleanedError = errorMessage.replace(/^Uncaught \(in promise\) Error: /, '');
      const [actualError] = cleanedError.split('\n');
      return actualError.trim();
    } catch (e) {
      return errorStr;
    }
  }

}

async function getSessionSigs(litNodeClient, signer) {
  console.log("Getting Session Signatures...")

  return litNodeClient.getSessionSigs({
    chain: walletChain.network,
    expiration: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
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

export default new LitService(walletChain.network)
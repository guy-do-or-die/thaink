import { LitNodeClient } from '@lit-protocol/lit-node-client'
import { AuthSig } from '@lit-protocol/types'
import { ethConnect } from '@lit-protocol/auth-browser'

class LitService {
  private client: LitNodeClient
  private chain = 'base'  // or 'base-sepolia' based on your deployment

  constructor() {
    this.client = new LitNodeClient({
      alertWhenUnauthorized: false,
      debug: false,
    })
  }

  async connect() {
    await this.client.connect()
  }

  async getAuthSig(): Promise<AuthSig> {
    const authSig = await ethConnect.signAndSaveAuthMessage({
      chain: this.chain,
      expiration: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(), // 1 week
    })
    return authSig
  }

  async encryptContribution(content: string, tankId: number) {
    const authSig = await this.getAuthSig()
    
    // Access control condition: must be a contributor to this tank
    const accessControlConditions = [
      {
        contractAddress: '', // Your contract address
        standardContractType: 'ERC1155',
        chain: this.chain,
        method: 'balanceOf',
        parameters: [':userAddress', tankId.toString()],
        returnValueTest: {
          comparator: '>',
          value: '0'
        }
      }
    ]

    const { encryptedString, encryptedSymmetricKey } = await this.client.encrypt({
      accessControlConditions,
      authSig,
      chain: this.chain,
      dataToEncrypt: content,
    })

    return {
      encryptedContent: encryptedString,
      encryptedSymmetricKey,
    }
  }

  async decryptContribution(encryptedContent: string, encryptedSymmetricKey: string, tankId: number) {
    const authSig = await this.getAuthSig()
    
    // Same access control conditions as encryption
    const accessControlConditions = [
      {
        contractAddress: '', // Your contract address
        standardContractType: 'ERC1155',
        chain: this.chain,
        method: 'balanceOf',
        parameters: [':userAddress', tankId.toString()],
        returnValueTest: {
          comparator: '>',
          value: '0'
        }
      }
    ]

    const decryptedString = await this.client.decrypt({
      accessControlConditions,
      authSig,
      chain: this.chain,
      encryptedString: encryptedContent,
      encryptedSymmetricKey,
    })

    return decryptedString
  }

  // For AI-generated summaries with different access conditions
  async encryptSummary(content: string, tankId: number, requiredTokenAmount: string) {
    const authSig = await this.getAuthSig()
    
    const accessControlConditions = [
      {
        contractAddress: '', // Your contract address
        standardContractType: 'ERC1155',
        chain: this.chain,
        method: 'balanceOf',
        parameters: [':userAddress', tankId.toString()],
        returnValueTest: {
          comparator: '>=',
          value: requiredTokenAmount
        }
      }
    ]

    const { encryptedString, encryptedSymmetricKey } = await this.client.encrypt({
      accessControlConditions,
      authSig,
      chain: this.chain,
      dataToEncrypt: content,
    })

    return {
      encryptedContent: encryptedString,
      encryptedSymmetricKey,
    }
  }
}

export const litService = new LitService()

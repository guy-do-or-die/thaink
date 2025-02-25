import { config } from 'dotenv'
import { ethers } from 'ethers'
import { LitContracts } from '@lit-protocol/contracts-sdk'
import { AUTH_METHOD_SCOPE, AUTH_METHOD_TYPE, LIT_ERROR_KIND, LIT_NETWORK } from '@lit-protocol/constants'
import bs58 from 'bs58'

import { updateEnvFile } from './utils'

// Helper function to timeout a promise
async function withTimeout(promise: Promise<any>, ms: number) {
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms)
  })
  return Promise.race([promise, timeout])
}

config() // Load environment variables

async function mintPKP() {
  try {
    if (!process.env.DEV_PRIVATE_KEY) {
      throw {
        message: 'Please set DEV_PRIVATE_KEY in your .env file',
        kind: LIT_ERROR_KIND.Configuration
      }
    }

    // Initialize wallet with Lit's network
    console.log('Using Lit Network:', LIT_NETWORK.Yellowstone)
    const provider = new ethers.providers.JsonRpcProvider('https://yellowstone-rpc.litprotocol.com/')
    const wallet = new ethers.Wallet(process.env.DEV_PRIVATE_KEY, provider)
    console.log('Wallet initialized with address:', wallet.address)

    // Check balance
    const balance = await provider.getBalance(wallet.address)
    console.log('Wallet balance:', ethers.utils.formatEther(balance), 'LIT')

    if (balance.eq(0)) {
      throw {
        message: 'Your wallet needs LIT tokens for gas. Please fund your wallet first.',
        kind: LIT_ERROR_KIND.Configuration
      }
    }

    console.log('Connecting to Lit Contracts...')
    const contractClient = new LitContracts({
      signer: wallet,
      network: LIT_NETWORK.Yellowstone,
      debug: true // Enable debug logging
    })

    try {
      await withTimeout(contractClient.connect(), 15000)
      console.log('Successfully connected to Lit Contracts')
    } catch (error) {
      throw {
        message: error.message.includes('timed out')
          ? 'Connection to Lit Contracts timed out. Please try again.'
          : `Failed to connect to Lit Contracts: ${error.message}`,
        kind: LIT_ERROR_KIND.Network,
        originalError: error
      }
    }

    // Create a basic auth signature
    console.log('Creating auth signature...')
    const authSig = {
      address: wallet.address,
      sig: await wallet.signMessage('I am creating a PKP'),
      derivedVia: 'web3.eth.personal.sign',
      signedMessage: 'I am creating a PKP',
      version: '1',
    }

    const authMethod = {
      authMethodType: AUTH_METHOD_TYPE.EthWallet,
      accessToken: JSON.stringify(authSig),
    }

    console.log('Minting PKP...')
    const mintInfo = await contractClient.mintWithAuth({
      authMethod: authMethod,
      scopes: [
        AUTH_METHOD_SCOPE.SignAnything,
        AUTH_METHOD_SCOPE.PersonalSign
      ],
      // Override gas settings
      txOptions: {
        gasLimit: 20000000, // Increased gas limit
      }
    })

    console.log('PKP Minted Successfully!')
    console.log('Transaction Hash:', mintInfo.tx.transactionHash)
    console.log('PKP Details:')
    console.log('Token ID:', mintInfo.pkp.tokenId)
    console.log('Public Key:', mintInfo.pkp.publicKey)
    console.log('ETH Address:', mintInfo.pkp.ethAddress)

    // Set up permissions for specific Lit Actions
    //console.log('Setting up Lit Action permissions...')
    //const litActionCids = [
    //  process.env.VITE_HINTLITACTION_IPFS_CID,
    //  process.env.VITE_SUBMITLITACTION_IPFS_CID
    //]

    //try {
    //  for (const ipfsCid of litActionCids) {
    //    if (!ipfsCid) continue;
    //    console.log(`Adding permissions for Lit Action: ${ipfsCid}`)
    //    
    //    // Convert token ID to BigNumber
    //    const tokenIdBN = ethers.BigNumber.from(mintInfo.pkp.tokenId)

    //    // Use the IPFS CID directly as bytes32
    //    const ipfsCidBytes = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(ipfsCid))
    //    console.log('IPFS CID as bytes32:', ipfsCidBytes)

    //    const authMethod = {
    //      authMethodType: 2, // 2 for LitAction
    //      accessToken: "0x", // Empty hex string
    //    }
    //    
    //    const tx = await contractClient.pkpPermissionsContract.write.addPermittedAuthMethod(
    //      tokenIdBN,
    //      authMethod,
    //      [ipfsCidBytes],
    //      {
    //        gasLimit: 400000
    //      }
    //    )
    //    await tx.wait()
    //    console.log(`Successfully added permissions for ${ipfsCid}`)
    //  }
    //  console.log('Successfully set up all Lit Action permissions')
    //} catch (error) {
    //  console.error('Failed to set up Lit Action permissions:', error)
    //  // Continue execution since PKP was already minted
    //}

    // Update the .env file with PKP details
    updateEnvFile('VITE_PKP_TOKEN_ID', mintInfo.pkp.tokenId)
    updateEnvFile('VITE_PKP_PUBLIC_KEY', mintInfo.pkp.publicKey)
    updateEnvFile('VITE_PKP_ETH_ADDRESS', mintInfo.pkp.ethAddress)
    console.log('Updated PKP details in .env file')

  } catch (error) {
    if (error.kind === LIT_ERROR_KIND.Configuration) {
      console.error('Configuration Error:', error.message)
    } else if (error.kind === LIT_ERROR_KIND.Network) {
      console.error('Network Error:', error.message)
    } else if (error.kind === LIT_ERROR_KIND.Transaction) {
      console.error('Transaction Error:', error.message)
    } else {
      console.error('Error minting PKP:', error)
    }
    process.exit(1)
  }
}

// Execute the mint function
mintPKP().catch(console.error)

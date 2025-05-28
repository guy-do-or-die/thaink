import { config } from 'dotenv'
import { ethers } from 'ethers'

import { LitContracts } from '@lit-protocol/contracts-sdk'
import { getAuthIdByAuthMethod } from '@lit-protocol/lit-auth-client'

import { AUTH_METHOD_SCOPE, AUTH_METHOD_TYPE, LIT_ERROR_KIND, LIT_NETWORK } from '@lit-protocol/constants'

import { updateEnvFile } from './utils'

config()

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
      network: LIT_NETWORK.DatilDev,
      debug: true // Enable debug logging
    })

    contractClient.connect()
    console.log('Successfully connected to Lit Contracts')

    // Create a basic auth signature
    console.log('Creating auth signature...')
    const authSig = {
      address: wallet.address,
      sig: await wallet.signMessage('I am creating a PKP'),
      derivedVia: 'web3.eth.personal.sign',
      signedMessage: 'I am creating a PKP',
      version: '1',
    }

    const authMethodWallet = {
      authMethodType: AUTH_METHOD_TYPE.EthWallet,
      accessToken: JSON.stringify(authSig),
    }

    const authIdWallet = await getAuthIdByAuthMethod(authMethodWallet)

    const litActionCids = [
      process.env.VITE_HINTLITACTION_IPFS_CID,
      process.env.VITE_SUBMITLITACTION_IPFS_CID,
      process.env.VITE_PROMPTLITACTION_IPFS_CID,
    ].map(cid => contractClient.utils.getBytesFromMultihash(cid))

    console.log('Minting PKP...')
    const mintCost = await contractClient.pkpNftContract.read.mintCost()

    const scope = [AUTH_METHOD_SCOPE.SignAnything, AUTH_METHOD_SCOPE.PersonalSign]
    const scopes = [scope, scope, scope, scope]

    const mintTx = await contractClient.pkpHelperContract.write.mintNextAndAddAuthMethods(
      2,
      [AUTH_METHOD_TYPE.EthWallet, AUTH_METHOD_TYPE.LitAction, AUTH_METHOD_TYPE.LitAction, AUTH_METHOD_TYPE.LitAction],
      [authIdWallet, ...litActionCids],
      ['0x', '0x', '0x', '0x'],
      scopes,
      true,
      true,
      { value: mintCost }
    )

    console.log('Waiting for minting transaction to be confirmed...')
    const receipt = await provider.waitForTransaction(mintTx.hash, 2)
    console.log('Minting transaction confirmed')
    console.log('PKP Minted Successfully!')

    const tokenId = BigInt(
      receipt?.logs
        ? receipt.logs[0].topics[1]
        : receipt?.logs[0].topics[1]
    ).toString()

    const permittedAuthMethods = await contractClient.pkpPermissionsContract.read.getPermittedAuthMethods(tokenId);
    console.log("\nPermitted Auth Methods:");
    permittedAuthMethods.forEach((method, i) => {
      console.log(`\nAuth Method ${i + 1}:`);
      console.log("- Type:", method.authMethodType);
      console.log("- ID:", method.id || "Any ETH address");
      console.log("- User PubKey:", method.userPubkey);
    });

    const pkpPublicKey = (await contractClient.pkpNftContract.read.getPubkey(tokenId)).slice(2)
    console.log('Token ID:', tokenId)
    console.log('Public Key:', pkpPublicKey)

    console.log('Getting current auth methods...')
    const currentAuthMethods = await contractClient.pkpPermissionsContract.read.getPermittedAuthMethods(tokenId)
    console.log('Current auth methods:', currentAuthMethods)

    updateEnvFile('VITE_PKP_TOKEN_ID', tokenId)
    updateEnvFile('VITE_PKP_PUBLIC_KEY', pkpPublicKey)
    console.log('Updated PKP details in .env file')

    const hintLitActionCid = contractClient.utils.getBytesFromMultihash(process.env.VITE_HINTLITACTION_IPFS_CID)
    const submitLitActionCid = contractClient.utils.getBytesFromMultihash(process.env.VITE_SUBMITLITACTION_IPFS_CID)
    const promptLitActionCid = contractClient.utils.getBytesFromMultihash(process.env.VITE_PROMPTLITACTION_IPFS_CID)

    console.log('Hint Lit Action CID:', hintLitActionCid)
    console.log('Submit Lit Action CID:', submitLitActionCid)
    console.log('Prompt Lit Action CID:', promptLitActionCid)

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

mintPKP().catch(console.error)

declare const ethers: any
declare const Lit: any
declare const chainNetwork: string

interface AccessControlConditionItem {
  contractAddress: string
  standardContractType: string
  chain: string
  method: string
  parameters: string[]
  returnValueTest: {
    comparator: string
    value: string
  }
}

interface AccessControlConditionOperator {
  operator: 'or' | 'and'
}

type AccessControlCondition = AccessControlConditionItem | AccessControlConditionOperator

export function getAccessControlConditions(ipfsCids: string[], network?: string): AccessControlCondition[] {
  const accessControlConditions: AccessControlCondition[] = []

  ipfsCids.forEach((cid, index) => {
    index > 0 && accessControlConditions.push({ operator: 'or' })

    accessControlConditions.push({
      contractAddress: '',
      standardContractType: '',
      chain: network || chainNetwork,
      method: '',
      parameters: [':currentActionIpfsId'],
      returnValueTest: {
        comparator: '=',
        value: cid,
      },
    })
  })

  return accessControlConditions
}

export async function encrypt(ipfsCids: string[], data: any) {
  const encoder = new TextEncoder()
  const dataToEncrypt = encoder.encode(JSON.stringify(data))

  const { ciphertext, dataToEncryptHash } = await Lit.Actions.encrypt({
    accessControlConditions: getAccessControlConditions(ipfsCids),
    to_encrypt: dataToEncrypt,
  })

  return { ciphertext, dataToEncryptHash }
}

export async function decrypt(ipfsCids: string[], ciphertext: string, dataToEncryptHash: string): Promise<string> {
  const resp = await Lit.Actions.decryptAndCombine({
    accessControlConditions: getAccessControlConditions(ipfsCids),
    dataToEncryptHash,
    chain: chainNetwork,
    ciphertext,
  })
  return resp
}

export async function signMessage(message: string, pkp: string) {
  const toSign = ethers.utils.arrayify(ethers.utils.hashMessage(ethers.utils.arrayify(message)))

  const sigObjectStr = await Lit.Actions.signAndCombineEcdsa({
    toSign,
    publicKey: pkp,
    sigName: 'pkp',
  })
  const sigObject = typeof sigObjectStr === 'string' ? JSON.parse(sigObjectStr) : sigObjectStr
  return '0x' + sigObject.r + sigObject.s + (sigObject.v === 27 ? '1b' : '1c')
}

export async function buildAndSignTransaction({
  contract,
  pkp,
  address,
  encryptedNote,
  encryptedDigest,
  noteHash,
  newDigestHash,
  scoreValue,
  ideaSignature,
}) {
  const minimalTx = {
    to: contract.address,
    nonce: 0,
    gasLimit: '0x5208',
    gasPrice: '0x0',
    value: '0x0',
    data: contract.interface.getSighash('addNote'),
    chainId: chainId,
  }

  const toSignTx = ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.serializeTransaction(minimalTx)))
  const txSigStr = await Lit.Actions.signAndCombineEcdsa({
    toSign: toSignTx,
    publicKey: pkp,
    sigName: 'tx',
  })
  const txSig = typeof txSigStr === 'string' ? JSON.parse(txSigStr) : txSigStr

  const unsignedTx = {
    to: contract.address,
    nonce: 0,
    gasLimit: '0x7fb8', // Exactly 32696 in hex
    gasPrice: '0x32', // 50 wei minimum required
    value: '0x0',
    data: contract.interface.encodeFunctionData('addNote', [
      address,
      encryptedNote,
      noteHash,
      encryptedDigest,
      newDigestHash,
      ideaSignature,
      scoreValue,
    ]),
    chainId,
  }

  // Get the raw transaction hash
  const serializedUnsigned = ethers.utils.serializeTransaction(unsignedTx)
  const messageHash = ethers.utils.keccak256(serializedUnsigned)

  // Create properly formatted 32-byte hex strings
  const r = ethers.utils.hexZeroPad('0x' + txSig.r.slice(-64), 32)
  const s = ethers.utils.hexZeroPad('0x' + txSig.s, 32)

  // Calculate v with EIP-155
  const standardV = 27 + (txSig.v % 2) // Convert to 27/28
  const eip155V = standardV + chainId * 2 + 8 // EIP-155 calculation

  // Create signature
  const sig = { r, s, v: eip155V }

  // Create the signed transaction
  const signedTx = ethers.utils.serializeTransaction(unsignedTx, sig)

  // Verify the signature
  const parsedTx = ethers.utils.parseTransaction(signedTx)
  const recoveredAddr = ethers.utils.recoverAddress(messageHash, sig)

  // Only throw if addresses don't match
  if (recoveredAddr.toLowerCase() !== parsedTx?.from?.toLowerCase()) {
    throw new Error(`Address mismatch: recovered=${recoveredAddr}, from=${parsedTx?.from}`)
  }

  return {
    signedTx,
    from: recoveredAddr,
    chainId,
    gasLimit: unsignedTx.gasLimit,
    gasPrice: unsignedTx.gasPrice,
  }
}

export async function getContractData(rpcUrl: string, contractAddress: string, contractAbi: any[]): Promise<any> {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const contract = new ethers.Contract(contractAddress, contractAbi, provider)

  const calls = [
    contract.idea(),
    contract.digest(),
    contract.digestHash(),
    contract.llmUrl(),
    contract.config(),
    contract.configHash(),
    contract.hintActionIpfsId(),
    contract.submitActionIpfsId(),
    contract.promptActionIpfsId(),
  ]

  const [
    idea,
    digest,
    digestHash,
    llmUrl,
    config,
    configHash,
    hintActionIpfsId,
    submitActionIpfsId,
    promptActionIpfsId,
  ] = await Promise.all(calls)

  const ipfsCids = [hintActionIpfsId, submitActionIpfsId, promptActionIpfsId]

  const decryptedDigest = digest ? await decrypt(ipfsCids, digest, digestHash) : 'empty'
  const decryptedConfig = config ? await decrypt(ipfsCids, config, configHash) : '{}'

  return {
    contract,
    idea,
    llmUrl,
    digest: decryptedDigest,
    config: JSON.parse(decryptedConfig),
    ipfsCids,
  }
}

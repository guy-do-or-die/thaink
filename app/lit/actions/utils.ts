import 'ethers'

export function getAccessControlConditions(ipfsCids: string[]) {
  const accessControlConditions = []

  ipfsCids.forEach((cid, index) => {
    index > 0 && accessControlConditions.push({ operator: 'or' })

    accessControlConditions.push({
      contractAddress: '',
      standardContractType: '',
      chain: chainNetwork,
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
    to_encrypt: dataToEncrypt
  })

  return { ciphertext, dataToEncryptHash }
}

export async function decrypt(ipfsCid, ciphertext, dataToEncryptHash) {
  //const rpcUrl = await Lit.Actions.getRpcUrl({ chain: chainNetwork })
  //const authSig = sessionSigs[rpcUrl]

  const resp = await Lit.Actions.decryptAndCombine({
    accessControlConditions: getAccessControlConditions(ipfsCid),
    dataToEncryptHash,
    chain: chainNetwork,
    ciphertext,
  })

  return resp
}

export function injectFunctions(targetFn: Function, functionsToInject: Function[]): string {
  const injectedFunctionsCode = functionsToInject
    .map(fn => fn.toString())
    .join('\n\n')

  const targetFnStr = targetFn.toString()
  const firstBraceIndex = targetFnStr.indexOf('{')

  return `${targetFnStr.slice(0, firstBraceIndex + 1)}
    ${injectedFunctionsCode}
    ${targetFnStr.slice(firstBraceIndex + 1)}`
}

export function createLitAction(mainFn: Function, functionsToInject: Function[] = []): string {
  const fnWithInjectedCode = injectFunctions(mainFn, functionsToInject)
  return `(${fnWithInjectedCode})()`
}

export async function callAgent({ agentEndpoint, idea, digest, action, prompt, note }) {
  const res = await Lit.Actions.runOnce({
    waitForResponse: true,
    name: "agentCaller"
  }, async () => {
    const agentResponse = await fetch(agentEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action,
        idea,
        digest,
        ...(prompt && { prompt }),
        ...(note && { note })
      })
    })

    if (!agentResponse.ok) {
      throw new Error(`Agent call failed: ${agentResponse.statusText}`)
    }

    json = await agentResponse.json()
    return JSON.stringify(json)
  })

  if (!res) {
    throw new Error('Agent response is empty')
  }

  return JSON.parse(res)
}

export async function callAgentForHint(agentEndpoint, idea, digest) {
  return await callAgent({ agentEndpoint, idea, digest, action: 'hint' })
}

export async function callAgentForPrompt(agentEndpoint, idea, digest, prompt) {
  return await callAgent({ agentEndpoint, idea, digest, action: 'prompt', prompt })
}

export async function callAgentForSubmit(agentEndpoint, idea, digest, note) {
  return await callAgent({ agentEndpoint, idea, digest, action: 'evaluate_and_digest', note })
}

export async function signMessage(message: string, pkp: string) {
  const toSign = ethers.utils.arrayify(ethers.utils.hashMessage(ethers.utils.arrayify(message)))
  const sigObjectStr = await Lit.Actions.signAndCombineEcdsa({
    toSign,
    publicKey: pkp,
    sigName: 'pkp'
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
  ideaSignature
}) {
  // First create minimal transaction for signing
  const minimalTx = {
    to: contract.address,
    nonce: 0,  // we can use 0 since this is just for signing
    gasLimit: '0x5208',  // basic 21000 gas
    gasPrice: '0x0',
    value: '0x0',
    data: contract.interface.getSighash('addNote'),  // just the function selector
    chainId: 1  // placeholder chainId
  }

  const toSignTx = ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.serializeTransaction(minimalTx)))
  const txSigStr = await Lit.Actions.signAndCombineEcdsa({
    toSign: toSignTx,
    publicKey: pkp,
    sigName: 'tx'
  })
  const txSig = typeof txSigStr === 'string' ? JSON.parse(txSigStr) : txSigStr
  const chainId = 84532 // Base Sepolia

  const unsignedTx = {
    to: contract.address,
    nonce: 0,
    gasLimit: '0x7fb8', // Exactly 32696 in hex
    gasPrice: '0x32', // 50 wei minimum required
    value: '0x0',
    data: contract.interface.encodeFunctionData('addNote', [
      address,
      encryptedNote,
      encryptedDigest,
      noteHash,
      newDigestHash,
      scoreValue,
      ideaSignature
    ]),
    chainId
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
  if (recoveredAddr.toLowerCase() !== parsedTx.from.toLowerCase()) {
    throw new Error(`Address mismatch: recovered=${recoveredAddr}, from=${parsedTx.from}`)
  }

  return {
    signedTx,
    from: recoveredAddr,
    chainId,
    gasLimit: unsignedTx.gasLimit,
    gasPrice: unsignedTx.gasPrice
  }
}

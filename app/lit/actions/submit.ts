import 'ethers'

export interface submitLitActionParams {
  contractAddress: string
  note: string
}

const _submitLitAction = async () => {
  function getAccessControlConditions(ipfsCid: string) {
    return [
      {
        contractAddress: '',
        standardContractType: '',
        chain: chainNetwork,
        method: '',
        parameters: [':currentActionIpfsId'],
        returnValueTest: {
          comparator: '=',
          value: ipfsCid,
        },
      },
    ]
  }

  async function encrypt(ipfsCid, data) {
    const encoder = new TextEncoder();
    const dataToEncrypt = encoder.encode(JSON.stringify(data));

    const { ciphertext, dataToEncryptHash } = await Lit.Actions.encrypt({
      accessControlConditions: getAccessControlConditions(ipfsCid),
      to_encrypt: dataToEncrypt
    });

    return { ciphertext, dataToEncryptHash }
  }

  async function decrypt(ipfsCid, ciphertext, dataToEncryptHash) {
    const authSig = await LitActions.getAuthSig();
    const resp = await Lit.Actions.decryptAndCombine({
      accessControlConditions: getAccessControlConditions(ipfsCid),
      ciphertext,
      dataToEncryptHash,
      chain: chainNetwork,
      authSig,
    });

    return resp
  }

  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const contract = new ethers.Contract(contractAddress, contractAbi, provider)

  const idea = await contract.idea()
  const digest = await contract.digest()
  const digestHash = await contract.digestHash()

  const decryptedDigest = digest ? await decrypt(ipfsCid, digest, digestHash) : 'empty'

  const agentResponse = await fetch(agentEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'evaluate_and_digest',
      idea,
      note,
      digest: decryptedDigest
    })
  })

  if (!agentResponse.ok) {
    throw new Error(`Agent evaluation failed: ${agentResponse.statusText}`)
  }

  const agentResult = await agentResponse.json()
  const evaluation = agentResult.evaluation
  const digestResult = agentResult.digest
  const value = Math.round(evaluation.weightedScore)

  let response = agentResult
  if (evaluation.verdict === 'accept') {
    const toSign = ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(idea)))
    const sigObjectStr = await Lit.Actions.signAndCombineEcdsa({
      toSign,
      publicKey: pkp,
      sigName: 'pkp'
    })
    const sigObject = typeof sigObjectStr === 'string' ? JSON.parse(sigObjectStr) : sigObjectStr
    const ideaSignature = '0x' + sigObject.r + sigObject.s + (sigObject.v === 27 ? '1b' : '1c')

    const { ciphertext: encryptedNote, dataToEncryptHash: noteHash } = await encrypt(ipfsCid, note)
    const { ciphertext: encryptedDigest, dataToEncryptHash: newDigestHash } = await encrypt(ipfsCid, digestResult.digest)

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

    // Convert value to uint256 using ethers.constants as reference
    const scoreValue = ethers.BigNumber.from(Math.round(value))

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
    const sig = {
      r,
      s,
      v: eip155V
    }

    // Create the signed transaction
    const signedTx = ethers.utils.serializeTransaction(unsignedTx, sig)

    // Verify the signature
    const parsedTx = ethers.utils.parseTransaction(signedTx)
    const recoveredAddr = ethers.utils.recoverAddress(messageHash, sig)

    // Only throw if addresses don't match
    if (recoveredAddr.toLowerCase() !== parsedTx.from.toLowerCase()) {
      throw new Error(`Address mismatch: recovered=${recoveredAddr}, from=${parsedTx.from}`)
    }

    // Return the signed transaction and recovered address for the user to handle
    response = {
      ...response,
      signedTx,
      from: recoveredAddr,
      chainId,
      gasLimit: unsignedTx.gasLimit,
      gasPrice: unsignedTx.gasPrice
    }
  }

  Lit.Actions.setResponse({ response: JSON.stringify(response) })
}

export const submitLitAction = `(${_submitLitAction.toString()})()`

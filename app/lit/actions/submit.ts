import 'ethers'


export interface submitLitActionParams {
  contractAddress: string
  note: string
}

function getAccessControlConditions(ipfsCid: string) {
  return [
    {
      contractAddress: '',
      standardContractType: '',
      chain: chain.network,
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
  const { ciphertext, dataToEncryptHash } = Lit.Actions.encrypt({
    accessControlConditions: getAccessControlConditions(ipfsCid),
    to_encrypt: data
  });

  return { ciphertext, dataToEncryptHash }
}

async function decrypt(ipfsCid, ciphertext, dataToEncryptHash) {
  const resp = await Lit.Actions.decryptAndCombine({
    accessControlConditions: getAccessControlConditions(ipfsCid),
    ciphertext,
    dataToEncryptHash,
    authSig: null,
    chain: chain.network,
  });

  return resp
}

const _submitLitAction = async () => {
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl)
  const contract = new ethers.Contract(contractAddress, contractAbi, provider)

  const idea = await contract.idea()
  const digest = await contract.digest()
  const digestHash = await contract.digestHash()

  const decryptedDigest = digest ? await decrypt(ipfsCid, digest, digestHash) : 'empty'

  const evaluationResponse = await fetch(agentEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'evaluation',
      idea,
      note,
      digest: decryptedDigest
    })
  })

  if (!evaluationResponse.ok) {
    throw new Error(`Agent evaluation failed: ${evaluationResponse.statusText}, ${JSON.stringify(agentEndpoint)}`)
  }

  const evaluationResult = await evaluationResponse.json()
  const evaluation = evaluationResult.evaluation

  let response = evaluationResult
  if (evaluation.verdict === 'accept') {
    const digestResponse = await fetch(agentEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'digest',
        idea,
        note,
        digest: decryptedDigest
      })
    })

    if (!digestResponse.ok) {
      throw new Error(`Agent digest failed: ${digestResponse.statusText}`)
    }

    const digestResult = await digestResponse.json()

    const toSign = ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.toUtf8Bytes(idea)))
    const signature = await Lit.Actions.signEcdsa({ toSign, pkp })

    const { ciphertext: encryptedNote, dataToEncryptHash: noteHash } = await encrypt(ipfsCid, note)
    const { ciphertext: encryptedDigest, dataToEncryptHash: newDigestHash } = await encrypt(ipfsCid, digestResult.digest)

    const tx = await contract.addNote(
      address,
      encryptedNote,
      encryptedDigest,
      noteHash,
      newDigestHash,
      evaluation.weightedScore,
      signature
    )

    await tx.wait()
    response.txHash = tx.hash
  }

  Lit.Actions.setResponse({ response: JSON.stringify(response) })
}

export const submitLitAction = `(${_submitLitAction.toString()})()`

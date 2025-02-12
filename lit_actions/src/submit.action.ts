/**
 * NAME: submit
 * 
 * This action handles idea submissions with evaluation and transaction signing
 */

import { 
  decrypt, 
  encrypt, 
  callAgentForSubmit, 
  signMessage,
  buildAndSignTransaction 
} from './utils';

interface SubmitActionParams {
  rpcUrl: string;
  contractAbi: Array<object>;
  contractAddress: string;
  agentEndpoint: string;
  note: string;
  pkp: string;
  address: string;
}

(async () => {
  const { rpcUrl, contractAbi, contractAddress, agentEndpoint, note, pkp, address } = LitActions.parseParam();
  
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, contractAbi, provider);

  const idea = await contract.idea();
  const digest = await contract.digest();
  const digestHash = await contract.digestHash();

  // Decrypt the digest if it exists
  const decryptedDigest = digest ? await decrypt(digest, digestHash) : 'empty';

  // Call the agent for submission evaluation
  const agentResult = await callAgentForSubmit(agentEndpoint, idea, decryptedDigest, note);
  const evaluation = agentResult.evaluation;
  const digestResult = agentResult.digest;
  const value = Math.round(evaluation.weightedScore);

  let result = agentResult;

  if (evaluation.verdict === 'accept') {
    // Sign the idea hash
    const ideaHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(idea));
    const ideaSignature = await signMessage(ideaHash, pkp);

    // Encrypt note and new digest
    const { ciphertext: encryptedNote, dataToEncryptHash: noteHash } = await encrypt([idea], note);
    const { ciphertext: encryptedDigest, dataToEncryptHash: newDigestHash } = await encrypt([idea], digestResult.digest);

    const scoreValue = ethers.BigNumber.from(Math.round(value));

    // Build and sign transaction
    const txData = await buildAndSignTransaction({
      contract,
      pkp,
      address,
      encryptedNote,
      encryptedDigest,
      noteHash,
      newDigestHash,
      scoreValue,
      ideaSignature
    });

    result = {
      ...result,
      ...txData
    };
  }

  LitActions.setResponse({
    response: JSON.stringify(result)
  });
})();

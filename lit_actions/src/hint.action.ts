/**
 * NAME: hint
 * 
 * This action provides hints for ideas based on the current state
 */

import { decrypt, callAgentForHint } from './utils';

interface HintActionParams {
  rpcUrl: string;
  contractAbi: Array<object>;
  contractAddress: string;
  agentEndpoint: string;
}

(async () => {
  const { rpcUrl, contractAbi, contractAddress, agentEndpoint } = LitActions.parseParam();
  
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, contractAbi, provider);

  const idea = await contract.idea();
  const digest = await contract.digest();
  const digestHash = await contract.digestHash();

  // Decrypt the digest if it exists
  const decryptedDigest = digest ? await decrypt(digest, digestHash) : 'empty';

  // Call the agent for hint
  const agentResult = await callAgentForHint(agentEndpoint, idea, decryptedDigest);

  LitActions.setResponse({
    response: JSON.stringify(agentResult)
  });
})();

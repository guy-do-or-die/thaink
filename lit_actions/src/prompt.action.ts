/**
 * NAME: prompt
 * 
 * This action handles custom prompts for ideas
 */

import { decrypt, callAgentForPrompt } from './utils';

interface PromptActionParams {
  rpcUrl: string;
  contractAbi: Array<object>;
  contractAddress: string;
  agentEndpoint: string;
  prompt: string;
}

(async () => {
  const { rpcUrl, contractAbi, contractAddress, agentEndpoint, prompt } = LitActions.parseParam();
  
  const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const contract = new ethers.Contract(contractAddress, contractAbi, provider);

  const idea = await contract.idea();
  const digest = await contract.digest();
  const digestHash = await contract.digestHash();

  // Decrypt the digest if it exists
  const decryptedDigest = digest ? await decrypt(digest, digestHash) : 'empty';

  // Call the agent with custom prompt
  const agentResult = await callAgentForPrompt(agentEndpoint, idea, decryptedDigest, prompt);

  LitActions.setResponse({
    response: JSON.stringify(agentResult)
  });
})();

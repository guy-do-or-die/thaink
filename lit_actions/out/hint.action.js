/**
 *
 * NAME: hint
 *
 */

"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b ||= {})
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // lit_actions/src/utils.ts
  var chainNetwork = "base-sepolia";
  function getAccessControlConditions(ipfsCids) {
    const accessControlConditions = [];
    ipfsCids.forEach((cid, index) => {
      index > 0 && accessControlConditions.push({ operator: "or" });
      accessControlConditions.push({
        contractAddress: "",
        standardContractType: "",
        chain: chainNetwork,
        method: "",
        parameters: [":currentActionIpfsId"],
        returnValueTest: {
          comparator: "=",
          value: cid
        }
      });
    });
    return accessControlConditions;
  }
  function decrypt(ipfsCid, ciphertext, dataToEncryptHash) {
    return __async(this, null, function* () {
      const resp = yield Lit.Actions.decryptAndCombine({
        accessControlConditions: getAccessControlConditions(ipfsCid),
        dataToEncryptHash,
        chain: chainNetwork,
        ciphertext
      });
      return resp;
    });
  }
  function callAgent(_0) {
    return __async(this, arguments, function* ({ agentEndpoint, idea, digest, action, prompt, note }) {
      const agentResponse = yield fetch(agentEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(__spreadValues(__spreadValues({
          action,
          idea,
          digest
        }, prompt && { prompt }), note && { note }))
      });
      if (!agentResponse.ok) {
        throw new Error(`Agent call failed: ${agentResponse.statusText}`);
      }
      return yield agentResponse.json();
    });
  }
  function callAgentForHint(agentEndpoint, idea, digest) {
    return __async(this, null, function* () {
      return yield callAgent({ agentEndpoint, idea, digest, action: "hint" });
    });
  }

  // lit_actions/src/hint.action.ts
  (() => __async(void 0, null, function* () {
    const { rpcUrl, contractAbi, contractAddress, agentEndpoint } = LitActions.parseParam();
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, contractAbi, provider);
    const idea = yield contract.idea();
    const digest = yield contract.digest();
    const digestHash = yield contract.digestHash();
    const decryptedDigest = digest ? yield decrypt(digest, digestHash) : "empty";
    const agentResult = yield callAgentForHint(agentEndpoint, idea, decryptedDigest);
    LitActions.setResponse({
      response: JSON.stringify(agentResult)
    });
  }))();
})();

/**
 *
 * NAME: submit
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
  function encrypt(ipfsCids, data) {
    return __async(this, null, function* () {
      const encoder = new TextEncoder();
      const dataToEncrypt = encoder.encode(JSON.stringify(data));
      const { ciphertext, dataToEncryptHash } = yield Lit.Actions.encrypt({
        accessControlConditions: getAccessControlConditions(ipfsCids),
        to_encrypt: dataToEncrypt
      });
      return { ciphertext, dataToEncryptHash };
    });
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
  function callAgentForSubmit(agentEndpoint, idea, digest, note) {
    return __async(this, null, function* () {
      return yield callAgent({ agentEndpoint, idea, digest, action: "evaluate_and_digest", note });
    });
  }
  function signMessage(message, pkp) {
    return __async(this, null, function* () {
      const toSign = ethers.utils.arrayify(ethers.utils.hashMessage(ethers.utils.arrayify(message)));
      const sigObjectStr = yield Lit.Actions.signAndCombineEcdsa({
        toSign,
        publicKey: pkp,
        sigName: "pkp"
      });
      const sigObject = typeof sigObjectStr === "string" ? JSON.parse(sigObjectStr) : sigObjectStr;
      return "0x" + sigObject.r + sigObject.s + (sigObject.v === 27 ? "1b" : "1c");
    });
  }
  function buildAndSignTransaction(_0) {
    return __async(this, arguments, function* ({
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
      const minimalTx = {
        to: contract.address,
        nonce: 0,
        // we can use 0 since this is just for signing
        gasLimit: "0x5208",
        // basic 21000 gas
        gasPrice: "0x0",
        value: "0x0",
        data: contract.interface.getSighash("addNote"),
        // just the function selector
        chainId: 1
        // placeholder chainId
      };
      const toSignTx = ethers.utils.arrayify(ethers.utils.keccak256(ethers.utils.serializeTransaction(minimalTx)));
      const txSigStr = yield Lit.Actions.signAndCombineEcdsa({
        toSign: toSignTx,
        publicKey: pkp,
        sigName: "tx"
      });
      const txSig = typeof txSigStr === "string" ? JSON.parse(txSigStr) : txSigStr;
      const chainId = 84532;
      const unsignedTx = {
        to: contract.address,
        nonce: 0,
        gasLimit: "0x7fb8",
        // Exactly 32696 in hex
        gasPrice: "0x32",
        // 50 wei minimum required
        value: "0x0",
        data: contract.interface.encodeFunctionData("addNote", [
          address,
          encryptedNote,
          encryptedDigest,
          noteHash,
          newDigestHash,
          scoreValue,
          ideaSignature
        ]),
        chainId
      };
      const serializedUnsigned = ethers.utils.serializeTransaction(unsignedTx);
      const messageHash = ethers.utils.keccak256(serializedUnsigned);
      const r = ethers.utils.hexZeroPad("0x" + txSig.r.slice(-64), 32);
      const s = ethers.utils.hexZeroPad("0x" + txSig.s, 32);
      const standardV = 27 + txSig.v % 2;
      const eip155V = standardV + chainId * 2 + 8;
      const sig = { r, s, v: eip155V };
      const signedTx = ethers.utils.serializeTransaction(unsignedTx, sig);
      const parsedTx = ethers.utils.parseTransaction(signedTx);
      const recoveredAddr = ethers.utils.recoverAddress(messageHash, sig);
      if (recoveredAddr.toLowerCase() !== parsedTx.from.toLowerCase()) {
        throw new Error(`Address mismatch: recovered=${recoveredAddr}, from=${parsedTx.from}`);
      }
      return {
        tx: signedTx,
        hash: messageHash,
        sig
      };
    });
  }

  // lit_actions/src/submit.action.ts
  (() => __async(void 0, null, function* () {
    const { rpcUrl, contractAbi, contractAddress, agentEndpoint, note, pkp, address } = LitActions.parseParam();
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, contractAbi, provider);
    const idea = yield contract.idea();
    const digest = yield contract.digest();
    const digestHash = yield contract.digestHash();
    const decryptedDigest = digest ? yield decrypt(digest, digestHash) : "empty";
    const agentResult = yield callAgentForSubmit(agentEndpoint, idea, decryptedDigest, note);
    const evaluation = agentResult.evaluation;
    const digestResult = agentResult.digest;
    const value = Math.round(evaluation.weightedScore);
    let result = agentResult;
    if (evaluation.verdict === "accept") {
      const ideaHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(idea));
      const ideaSignature = yield signMessage(ideaHash, pkp);
      const { ciphertext: encryptedNote, dataToEncryptHash: noteHash } = yield encrypt([idea], note);
      const { ciphertext: encryptedDigest, dataToEncryptHash: newDigestHash } = yield encrypt([idea], digestResult.digest);
      const scoreValue = ethers.BigNumber.from(Math.round(value));
      const txData = yield buildAndSignTransaction({
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
      result = __spreadValues(__spreadValues({}, result), txData);
    }
    LitActions.setResponse({
      response: JSON.stringify(result)
    });
  }))();
})();

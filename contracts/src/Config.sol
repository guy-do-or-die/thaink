// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;


contract Config {
    bytes public pkp;

    string public llmUrl;

    string public config;
    string public configHash;

    string public hintActionIpfsId;
    string public submitActionIpfsId;
    string public promptActionIpfsId;
}
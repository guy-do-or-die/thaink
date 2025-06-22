// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

import "./Token.sol";
import "./Meta.sol";
import "./Config.sol";
import "./Rewards.sol";

// Note: Interfaces are imported from Token.sol


contract Tank is Token, Rewards, Config, Meta, Initializable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    uint constant MAX_IDEA_LENGTH = 10000;

    error IdeaTooLong(uint length, uint maxLength);

    struct Note {
        string content;
        string contentHash;
        address contributor;
        uint score;
    }

    string public digest;
    string public digestHash;

    mapping(uint => Note) public notes;
    mapping(address => uint) public contributors;

    event NoteAdded(uint index, address contributor);
    event Minted(uint index, address contributor);
 
    constructor() Token() {
        factory = address(msg.sender);
        _disableInitializers();
    }

    function initialize(
        uint _tokenId,
        bytes calldata _pkp,
        string calldata _idea,
        string calldata _llmUrl,
        string calldata _config,
        string calldata _configHash,
        string calldata _hintActionIpfsId,
        string calldata _submitActionIpfsId,
        string calldata _promptActionIpfsId,
        address _poolManagerFactory
    ) public payable initializer {
        require(msg.sender == factory, "Only factory can initialize");

        if (bytes(_idea).length > MAX_IDEA_LENGTH) {
            revert IdeaTooLong(bytes(_idea).length, MAX_IDEA_LENGTH);
        }

        tokenId = _tokenId;

        idea = _idea;

        llmUrl = _llmUrl;

        pkp = _pkp;
        config = _config;
        configHash = _configHash;

        hintActionIpfsId = _hintActionIpfsId;
        submitActionIpfsId = _submitActionIpfsId;
        promptActionIpfsId = _promptActionIpfsId;
        
        // Initialize the token functionality
        string memory tokenName = string(abi.encodePacked("Tank #", Strings.toString(_tokenId)));
        string memory tokenSymbol = string(abi.encodePacked("TANK", Strings.toString(_tokenId)));
        
        // Call the Token's initialization function
        initializeToken(tokenName, tokenSymbol, _poolManagerFactory);    
        // Add liquidity to the pool if ETH was sent with the transaction
        if (msg.value > 0) {
            addLiquidityToPool(msg.value);
        }
        
        // Any remaining ETH after pool initialization goes to the rewards pool
        if (address(this).balance > 0) {
            totalRewards += address(this).balance;
            emit RewardsReceived(address(this).balance);
        }
    }

    function verifySignature(bytes calldata signature) internal view returns (bool) {
        bytes32 messageHash = keccak256(abi.encodePacked(idea));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        (address recovered, ECDSA.RecoverError error, bytes32 err) = ECDSA.tryRecover(ethSignedMessageHash, signature);

        if (error != ECDSA.RecoverError.NoError) {
            revert(string(abi.encodePacked("Signature recovery failed: ", err)));
        }

        require(recovered != address(0), "Zero address recovered");
        return recovered == address(uint160(uint(keccak256(abi.encodePacked(pkp)))));
    }

    error InsufficientTokens(address user, uint256 required, uint256 balance);

    function addNote(
        address _contributor,
        string calldata _content,
        string calldata _contentHash,
        string calldata _digest,
        string calldata _digestHash,
        bytes calldata _signature,
        uint _score
    ) public {
        require(contributors[_contributor] == 0, "Contributor has already added a note");
        require(hasNoteToken(_contributor), "Contributor does not have a token");
        require(verifySignature(_signature), "Invalid signature");
        
        // Burn the token required for adding a note
        burnNoteToken(_contributor);
        
        // Create and store the note
        Note memory note;
        note.contributor = _contributor;
        note.content = _content;
        note.contentHash = _contentHash;
        note.score = _score;
        
        notes[notesCount] = note;
        contributors[_contributor] = notesCount;
        notesCount++;
        
        digest = _digest;
        digestHash = _digestHash;
        
        // Allocate rewards to the contributor based on their score
        _allocateReward(_contributor, _score);

        emit NoteAdded(notesCount - 1, _contributor);
    }

    function incrementMintsCount() external {
        require(msg.sender == factory, "Only factory can increment mints count");
        emit Minted(++mintsCount, tx.origin);
    }
    
}

pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

import "./lib/LibString.sol";

contract Tank is Initializable {
    using Strings for uint256;
    using LibString for string;
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    uint256 constant MAX_IDEA_LENGTH = 10000;

    error IdeaTooLong(uint256 length, uint256 maxLength);

    struct Note {
        string content;
        string contentHash;
        address contributor;
        uint256 timestamp;
        uint256 value;
    }

    uint256 public tokenId;

    string public idea;
    string public digest;
    string public digestHash;

    uint256 public notesCount;
    uint256 public mintsCount;

    mapping(uint256 => Note) public notes;
    mapping(address => uint256) public contributors;

    event NoteAdded(uint256 index, address contributor);
    event Minted(uint256 index, address contributor);

    bytes32 public pkp;
    address public factory;

    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 _tokenId, string calldata _idea, bytes32 _pkp) public initializer {
        if (bytes(_idea).length > MAX_IDEA_LENGTH) {
            revert IdeaTooLong(bytes(_idea).length, MAX_IDEA_LENGTH);
        }

        factory = msg.sender;
        tokenId = _tokenId;
        idea = _idea;
        pkp = _pkp;
    }

    function verifySignature(bytes calldata signature) internal view returns (bool) {
        bytes32 messageHash = keccak256(abi.encodePacked(idea));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        
        (address recovered, ECDSA.RecoverError error, bytes32 err) = ECDSA.tryRecover(ethSignedMessageHash, signature);

        if (error != ECDSA.RecoverError.NoError) {
            revert(string(abi.encodePacked("Signature recovery failed: ", uint256(err).toString())));
        }

        require(recovered != address(0), "Zero address recovered");
        return recovered == address(uint160(uint256(keccak256(abi.encodePacked(pkp)))));
    }

    function addNote(
        address _contributor,
        string calldata _content,
        string calldata _digest,
        string calldata _contentHash,
        string calldata _digestHash,
        uint256 _value,
        bytes calldata signature
    ) public {
        //require(verifySignature(signature), "Invalid signature");
        require(contributors[_contributor] == 0, "Contributor has already added a note");

        Note memory note;
        note.timestamp = block.timestamp;
        note.contributor = _contributor;
        note.content = _content;
        note.contentHash = _contentHash;
        note.value = _value;

        notes[++notesCount] = note;
        contributors[_contributor] = notesCount;

        digest = _digest;
        digestHash = _digestHash;

        emit NoteAdded(notesCount, _contributor);
    }

    function incrementMintsCount() external {
        require(msg.sender == factory, "Only factory can increment mints count");
        emit Minted(++mintsCount, tx.origin);
    }

    function getImage() private view returns (string memory) {
        return string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(
                    bytes(
                        string(
                            abi.encodePacked(
                                '<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">',
                                '<style>',
                                '.title { fill: white; font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; }',
                                '.stats { fill: white; font-family: Arial, sans-serif; font-size: 18px; }',
                                '.idea { fill: white; font-family: Arial, sans-serif; font-size: 16px; }',
                                '</style>',
                                '<rect width="800" height="400" fill="#0052FF"/>',
                                '<text x="40" y="50" class="title">Tank #', 
                                tokenId.toString(),
                                '</text>',
                                '<text x="40" y="90" class="stats">Notes: ',
                                notesCount.toString(),
                                ' | Mints: ',
                                mintsCount.toString(),
                                '</text>',
                                '<foreignObject x="40" y="120" width="720" height="240">',
                                '<div xmlns="http://www.w3.org/1999/xhtml" style="color: white; font-family: Arial, sans-serif; font-size: 16px; overflow-wrap: break-word;">',
                                idea,
                                '</div>',
                                '</foreignObject>',
                                '</svg>'
                            )
                        )
                    )
                )
            )
        );
    }

    function tokenURI() public view returns (string memory) {
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(
                        string(
                            abi.encodePacked(
                                '{"name": "Tank #',
                                tokenId.toString(),
                                '", "description": "',
                                idea.escapeJSON(),
                                '", "image": "',
                                getImage(),
                                '", "attributes": [{"trait_type": "Notes", "value": ',
                                notesCount.toString(),
                                '}, {"trait_type": "Mints", "value": ',
                                mintsCount.toString(),
                                '}]}'
                            )
                        )
                    )
                )
            )
        );
    }

}

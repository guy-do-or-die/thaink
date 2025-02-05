pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

import "./lib/LibString.sol";


contract Tank is Initializable {
    using Strings for uint256;
    using LibString for string;

    uint256 constant MAX_IDEA_LENGTH = 10000;
    
    error IdeaTooLong(uint256 length, uint256 maxLength);

    struct Note {
        uint timestamp;
        address contributor;
        string content;
        uint value;
    }

    uint public tokenId;

    string public idea;
    string public digest;

    uint public notesCount;

    mapping(uint => Note) public notes;
    mapping(address => uint) public contributors;

    event NoteAdded(uint index, address contributor);

    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 _tokenId, string calldata _idea) public initializer {
        if (bytes(_idea).length > MAX_IDEA_LENGTH) {
            revert IdeaTooLong(bytes(_idea).length, MAX_IDEA_LENGTH);
        }
        
        tokenId = _tokenId;
        idea = _idea;
    }

    function addNote(address _contributor, string calldata _content, uint _value, string calldata _digest) public {
        Note memory note;
        note.timestamp = block.timestamp;
        note.contributor = _contributor;
        note.content = _content;
        note.value = _value;

        notes[++notesCount] = note;
        contributors[_contributor] = notesCount;

        digest = _digest;

        emit NoteAdded(notesCount, _contributor);
    }

    function getImage() private view returns (string memory) {
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350">',
                '<style>.base { fill: black; font-family: serif; font-size: 14px; }</style>',
                '<rect width="100%" height="100%" fill="white" />',
                '<text x="10" y="20" class="base">Idea: ', idea, '</text>',
                '<text x="10" y="40" class="base">Notes: ', Strings.toString(notesCount), '</text>',
                '</svg>'
            )
        );
    }

    function tokenURI() external view returns (string memory) {
        return string(
            abi.encodePacked(
                'data:application/json;base64,',
                Base64.encode(
                    bytes(
                        abi.encodePacked(
                            '{"name": "Thaink Tank #', tokenId.toString(),
                            '", "description": "', idea.escapeJSON(),
                            '", "image": "data:image/svg+xml;base64,',
                            Base64.encode(bytes(getImage())), '"}'
                        )
                    )
                )
            )
        );
    }
}

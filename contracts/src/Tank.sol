pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";

contract Tank is Initializable {
    using Strings for uint256;
    
    uint256 public tokenId;

    constructor() {
        _disableInitializers();
    }

    function initialize(uint256 _tokenId) public initializer {
        tokenId = _tokenId;
    }

    function getImage() public view returns (string memory) {
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet" viewBox="0 0 350 350">',
                '<style>.base { fill: black; font-family: serif; font-size: 28px; }</style>',
                '<rect width="100%" height="100%" fill="white" />',
                '<text x="50%" y="50%" class="base" dominant-baseline="middle" text-anchor="middle">',
                'Tank #',
                tokenId.toString(),
                '</text>',
                '</svg>'
            )
        );
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";


contract Meta {
    using Strings for uint;
    using Strings for string;

    string public idea;

    uint public tokenId;
    uint public notesCount;
    uint public mintsCount;

    function getImage() private view returns (string memory) {
        return string(
            abi.encodePacked(
                "data:image/svg+xml;base64,",
                Base64.encode(
                    bytes(
                        string(
                            abi.encodePacked(
                                '<?xml version="1.0" encoding="UTF-8"?>',
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
                "data:application/json;charset=utf-8;base64,",
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
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "./Tank.sol";


contract Thaink is ERC1155Supply, Ownable {
    using Strings for uint;
    using Clones for address;

    Tank public immutable tankImplementation;

    mapping(uint => Tank) public tanks;

    uint public tanksNumber;

    constructor() ERC1155("") Ownable(msg.sender) {
        tankImplementation = new Tank();
    }

    function makeTank() public {
        Tank tank = Tank(address(tankImplementation).clone());

        tank.initialize(++tanksNumber);
        tanks[tanksNumber] = tank;
    }

    function mint(address to, uint id) public {
        require(address(tanks[id]) != address(0), "Tank does not exist");
        require(balanceOf(to, id) == 0, "Tank already minted by this address");
        _mint(to, id, 1, "");
    }

    function uri(uint id) public view override returns (string memory) {
        Tank tank = tanks[id];
        require(address(tank) != address(0), "Tank does not exist");

        string memory img = tank.getImage();
        
        string memory json = string(
            abi.encodePacked(
                '{"name": "Thaink Tank #', id.toString(),
                '", "description": "Thaink Tank", "image": "data:image/svg+xml;base64,',
                Base64.encode(bytes(img)), '"}'
            )
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(bytes(json))
            )
        );
    }

}

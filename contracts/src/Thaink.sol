// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "./Tank.sol";

contract Thaink is ERC1155Supply, Ownable {
    using Strings for uint;
    using Clones for address;

    Tank public immutable tankImplementation;
    mapping(uint => Tank) public tanks;
    uint public tanksNumber;

    bytes32 public immutable pkp;

    event MintEvent(address indexed to, uint indexed id, uint timestamp);

    constructor(bytes32 _pkp) ERC1155("") Ownable(msg.sender) {
        tankImplementation = new Tank();
        pkp = _pkp;
    }

    function makeTank(string calldata _idea) public {
        Tank tank = Tank(address(tankImplementation).clone());
        tank.initialize(++tanksNumber, _idea, pkp);
        tanks[tanksNumber] = tank;
    }

    function mint(address to, uint id) public {
        require(address(tanks[id]) != address(0), "Tank does not exist");
        require(balanceOf(to, id) == 0, "Tank already minted by this address");
        _mint(to, id, 1, "");

        Tank tank = tanks[id];
        tank.incrementMintsCount();

        emit MintEvent(to, id, block.timestamp);
    }

    function uri(uint id) public view override returns (string memory) {
        Tank tank = tanks[id];
        require(address(tank) != address(0), "Tank does not exist");
        return tank.tokenURI();
    }
}

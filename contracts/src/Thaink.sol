// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

import "./Tank.sol";


contract Thaink is Config, ERC1155Supply, Ownable {
    using Strings for uint;
    using Clones for address;

    Tank public immutable tankImplementation;
    mapping(uint => Tank) public tanks;
    uint public tanksNumber;

    event MintEvent(address indexed to, uint indexed id);

    constructor() ERC1155("") Ownable(msg.sender) {
        tankImplementation = new Tank();
    }

    function makeTank(string calldata _idea) public {
        Tank tank = Tank(address(tankImplementation).clone());

        tank.initialize(
            ++tanksNumber,
            pkp,
            _idea,
            llmUrl,
            config,
            configHash,
            hintActionIpfsId,
            submitActionIpfsId,
            promptActionIpfsId
        );

        tanks[tanksNumber] = tank;
    }

    function mint(address to, uint id) public {
        require(address(tanks[id]) != address(0), "Tank does not exist");
        require(balanceOf(to, id) == 0, "Tank already minted by this address");
        _mint(to, id, 1, "");

        Tank tank = tanks[id];
        tank.incrementMintsCount();

        emit MintEvent(to, id);
    }

    function uri(uint id) public view override returns (string memory) {
        Tank tank = tanks[id];
        require(address(tank) != address(0), "Tank does not exist");
        return tank.tokenURI();
    }

    function setPkp(bytes calldata _pkp) public onlyOwner {
        pkp = _pkp;
    }

    function setLlmUrl(string calldata _llmUrl) public onlyOwner {
        llmUrl = _llmUrl;
    }

    function setConfig(string calldata _config, string calldata _configHash) public onlyOwner {
        config = _config;
        configHash = _configHash;
    }

    function setIpfsIds(
        string calldata _hintActionIpfsId,
        string calldata _submitActionIpfsId,
        string calldata _promptActionIpfsId
    ) public onlyOwner {
        hintActionIpfsId = _hintActionIpfsId;
        submitActionIpfsId = _submitActionIpfsId;
        promptActionIpfsId = _promptActionIpfsId;
    }

}

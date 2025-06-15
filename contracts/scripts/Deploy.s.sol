// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {Thaink} from "../src/Thaink.sol";

contract DeployScript is Script {
    Thaink public thaink;
    
    function run() public {
        address deployer = msg.sender;
        console2.log("Deploying Thaink contract with address:", deployer);
        
        vm.startBroadcast();

        thaink = new Thaink();
        
        if (thaink.owner() != deployer) {
            revert("Ownership verification failed");
        }
        
        string memory newOwnerEnv = vm.envOr("DEV_WALLET_ADDRESS", string(""));
        if (bytes(newOwnerEnv).length > 0) {
            address newOwner = vm.parseAddress(newOwnerEnv);
            console2.log("Transferring ownership to:", newOwner);
            thaink.transferOwnership(newOwner);
            console2.log("New owner set to:", thaink.owner());
        }
            
        console2.log("Deployment successful and verified");

        vm.stopBroadcast();
    }
    
    function getDeployedAddress() public view returns (address) {
        return address(thaink);
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {Thaink} from "../src/Thaink.sol";

contract DeployScript is Script {
    Thaink public thaink;
    
    function run() public {
        string memory pkpString = vm.envString("VITE_PKP_PUBLIC_KEY");
        bytes32 pkp = bytes32(abi.encodePacked(pkpString));

        address deployer = msg.sender;
        console2.log("Deploying Thaink contract with address:", deployer);
        
        vm.startBroadcast();

        thaink = new Thaink(pkp);
        
        if (thaink.owner() != deployer) {
            revert("Ownership verification failed");
        }
            
        console2.log("Deployment successful and verified");

        vm.stopBroadcast();
    }
    
    function getDeployedAddress() public view returns (address) {
        return address(thaink);
    }
}

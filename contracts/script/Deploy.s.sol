// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/DataProvenance.sol";
import "../src/OrgRegistry.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envOr("PRIVATE_KEY", uint256(0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80));
        
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy DataProvenance
        DataProvenance dataProvenance = new DataProvenance();
        console.log("DataProvenance deployed to:", address(dataProvenance));

        // 2. Deploy OrgRegistry
        OrgRegistry orgRegistry = new OrgRegistry();
        console.log("OrgRegistry deployed to:", address(orgRegistry));

        vm.stopBroadcast();

        // 3. Write addresses to files (relative to contracts/ directory)
        vm.writeFile("deployed_address.txt", vm.toString(address(dataProvenance)));
        vm.writeFile("deployed_orgregistry_address.txt", vm.toString(address(orgRegistry)));
    }
}

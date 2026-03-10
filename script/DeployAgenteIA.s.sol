// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgenteIA.sol";

contract DeployAgenteIA is Script {
    function run() external returns (address) {
        // Carrega a private key do .env
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);

        console.log("Deployer:", deployerAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy do contrato
        AgenteIA agente = new AgenteIA();

        vm.stopBroadcast();

        console.log("AgenteIA deployed to:", address(agente));
        return address(agente);
    }
}
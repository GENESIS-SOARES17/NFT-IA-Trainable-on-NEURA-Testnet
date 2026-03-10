// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgenteIA.sol";

contract CriarAgente is Script {
    function run(
        string memory nome,
        string memory modeloIA,
        string memory ipfsImagem,
        string memory ipfsPromptBase
    ) external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address contractAddress = vm.envAddress("CONTRACT_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        AgenteIA agente = AgenteIA(contractAddress);
        uint256 tokenId = agente.criarAgente(
            nome,
            modeloIA,
            ipfsImagem,
            ipfsPromptBase
        );

        vm.stopBroadcast();

        console.log("Agente criado com ID:", tokenId);
    }
}
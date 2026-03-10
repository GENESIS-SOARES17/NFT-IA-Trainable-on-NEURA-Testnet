// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract AgenteIA is ERC721URIStorage, Ownable {
    using Strings for uint256;

    uint256 private _tokenIdCounter;

    struct Agente {
        string nome;
        string modeloIA;
        string ipfsImagem;
        string ipfsPromptBase;
        address proprietario;
        uint256 nivelTreinamento;
        uint256 ultimoTreinamento;
    }

    mapping(uint256 => Agente) public agentes;
    mapping(uint256 => address[]) public historicoTreinadores;
    mapping(uint256 => mapping(address => uint256)) public permissoesCompartilhamento;

    event AgenteCriado(uint256 indexed tokenId, string nome, address criador);
    event AgenteTreinado(uint256 indexed tokenId, address treinador, string novoPromptHash, uint256 nivel);
    event AgenteCompartilhado(uint256 indexed tokenId, address usuario, uint256 expiracao);

    constructor() ERC721("AgenteIA", "AIA") Ownable(msg.sender) {}

    function criarAgente(
        string memory nome,
        string memory modeloIA,
        string memory ipfsImagem,
        string memory ipfsPromptBase
    ) public onlyOwner returns (uint256) {
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, ipfsImagem);

        agentes[newTokenId] = Agente({
            nome: nome,
            modeloIA: modeloIA,
            ipfsImagem: ipfsImagem,
            ipfsPromptBase: ipfsPromptBase,
            proprietario: msg.sender,
            nivelTreinamento: 1,
            ultimoTreinamento: block.timestamp
        });

        emit AgenteCriado(newTokenId, nome, msg.sender);
        return newTokenId;
    }

    function treinarAgente(uint256 tokenId, string memory novoPromptHash) public {
        address dono = ownerOf(tokenId); // já verifica existência
        require(dono == msg.sender || permissoesCompartilhamento[tokenId][msg.sender] > block.timestamp,
                "No permission to train");

        Agente storage agente = agentes[tokenId];
        agente.ipfsPromptBase = novoPromptHash;
        agente.nivelTreinamento++;
        agente.ultimoTreinamento = block.timestamp;
        agente.proprietario = dono;

        historicoTreinadores[tokenId].push(msg.sender);
        emit AgenteTreinado(tokenId, msg.sender, novoPromptHash, agente.nivelTreinamento);
    }

    function compartilharAgente(uint256 tokenId, address usuario, uint256 duracaoSegundos) public {
        require(ownerOf(tokenId) == msg.sender, "Only owner can share");
        permissoesCompartilhamento[tokenId][usuario] = block.timestamp + duracaoSegundos;
        emit AgenteCompartilhado(tokenId, usuario, block.timestamp + duracaoSegundos);
    }

    function revogarCompartilhamento(uint256 tokenId, address usuario) public {
        require(ownerOf(tokenId) == msg.sender, "Only owner can revoke");
        delete permissoesCompartilhamento[tokenId][usuario];
    }

    function podeUsarAgente(uint256 tokenId, address usuario) public view returns (bool) {
        address dono = ownerOf(tokenId); // se não existir, ownerOf reverte
        return dono == usuario || permissoesCompartilhamento[tokenId][usuario] > block.timestamp;
    }

    function getInfoAgente(uint256 tokenId) public view returns (Agente memory) {
        ownerOf(tokenId); // garante existência
        return agentes[tokenId];
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        ownerOf(tokenId); // verifica existência
        return agentes[tokenId].ipfsImagem;
    }
}
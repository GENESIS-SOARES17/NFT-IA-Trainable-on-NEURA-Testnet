const { uploadFileToIPFS, uploadPromptToIPFS } = require('./uploadToIPFS');
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);

// Configurações
const CONTRACT_ADDRESS = '0x...'; // Substitua pelo endereço do seu contrato após deploy
const ASSETS_DIR = path.join(__dirname, '../assets');
const IMAGE_FILE = path.join(ASSETS_DIR, 'agente.png'); // sua imagem

// Dados do agente
const AGENTE_NOME = 'Jardineiro Virtual';
const MODELO_IA = 'Llama-3.2-1B';
const PROMPT_BASE = `
Você é um assistente de IA especializado em jardinagem.
Seu nome é Jardineiro Virtual.
Responda perguntas sobre plantas, solo, adubação e pragas.
Seja amigável e use termos simples.
`;

async function main() {
    try {
        console.log('🚀 Iniciando processo de criação do agente...');

        // 1. Upload da imagem
        console.log('📤 Fazendo upload da imagem...');
        const imageIpfs = await uploadFileToIPFS(IMAGE_FILE);
        console.log('✅ Imagem no IPFS:', imageIpfs);

        // 2. Upload do prompt base
        console.log('📤 Fazendo upload do prompt...');
        const promptIpfs = await uploadPromptToIPFS(PROMPT_BASE, 'prompt_jardineiro.txt');
        console.log('✅ Prompt no IPFS:', promptIpfs);

        // 3. Chamar o Foundry para executar o mint
        console.log('⛓️  Enviando transação para a blockchain NEURA...');

        // Comando forge script
        const comando = `forge script script/CriarAgente.s.sol:CriarAgente \
            --rpc-url neura-testnet \
            --broadcast \
            --sig "run(string,string,string,string)" \
            "${AGENTE_NOME}" \
            "${MODELO_IA}" \
            "${imageIpfs}" \
            "${promptIpfs}"`;

        // Executar
        const { stdout, stderr } = await execPromise(comando, { cwd: path.join(__dirname, '..') });

        console.log('📝 Output do Foundry:');
        console.log(stdout);
        if (stderr) console.error('⚠️  Erros:', stderr);

        console.log('🎉 Agente criado com sucesso!');
    } catch (error) {
        console.error('❌ Erro no processo:', error);
    }
}

main();
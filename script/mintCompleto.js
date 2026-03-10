const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const execPromise = util.promisify(exec);
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Hashes obtidos do testUpload.js
const imageIpfs = "ipfs://QmYrTdPPjZu7jFRaFbJeHKaWuRzDppg7VxCr2aFzcYuEnE";
const promptIpfs = "ipfs://QmfAgbrQRuWErfwofutMSHZi5zXzEM1qCCdKawxWMXVtKK";

const AGENTE_NOME = 'Jardineiro Virtual';
const MODELO_IA = 'Llama-3.2-1B';

async function main() {
    try {
        console.log('🚀 Iniciando mint do agente...');

        const comando = `forge script script/CriarAgente.s.sol:CriarAgente \
            --rpc-url neura-testnet \
            --broadcast \
            --sig "run(string,string,string,string)" \
            "${AGENTE_NOME}" \
            "${MODELO_IA}" \
            "${imageIpfs}" \
            "${promptIpfs}"`;

        console.log('Executando comando:', comando);

        const { stdout, stderr } = await execPromise(comando, { cwd: path.join(__dirname, '..') });

        console.log('📝 Output do Foundry:');
        console.log(stdout);
        if (stderr) console.error('⚠️  Erros:', stderr);

        // Extrair o token ID do output
        const match = stdout.match(/Token ID:\s*(\d+)/i);
        if (match) {
            console.log(`🎉 Agente criado com Token ID: ${match[1]}`);
        } else {
            console.log('✅ Mint executado, verifique o explorador para o token ID.');
        }
    } catch (error) {
        console.error('❌ Erro no processo:', error);
    }
}

main();
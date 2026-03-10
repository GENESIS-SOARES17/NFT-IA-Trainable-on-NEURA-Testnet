const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') }); // carrega .env da raiz

const PINATA_JWT = process.env.PINATA_JWT;

if (!PINATA_JWT) {
    console.error('Erro: PINATA_JWT não definido no arquivo .env');
    process.exit(1);
}

/**
 * Faz upload de um arquivo para o IPFS via Pinata
 * @param {string} filePath - Caminho local do arquivo
 * @returns {Promise<string>} - Hash IPFS no formato ipfs://<hash>
 */
async function uploadFileToIPFS(filePath) {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
    }

    const formData = new FormData();
    const fileStream = fs.createReadStream(filePath);
    formData.append('file', fileStream);

    try {
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                    'Authorization': `Bearer ${PINATA_JWT}`
                },
                maxBodyLength: Infinity // permite arquivos grandes
            }
        );

        const ipfsHash = response.data.IpfsHash;
        console.log(`✅ Upload concluído! IPFS Hash: ${ipfsHash}`);
        return `ipfs://${ipfsHash}`;
    } catch (error) {
        console.error('Erro no upload para Pinata:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Faz upload de um texto (prompt) para o IPFS como arquivo .txt
 * @param {string} promptText - Conteúdo do prompt
 * @param {string} filename - Nome do arquivo (opcional)
 * @returns {Promise<string>} - Hash IPFS no formato ipfs://<hash>
 */
async function uploadPromptToIPFS(promptText, filename = 'prompt.txt') {
    // Cria um arquivo temporário em memória
    const buffer = Buffer.from(promptText, 'utf-8');
    const formData = new FormData();
    formData.append('file', buffer, { filename });

    try {
        const response = await axios.post(
            'https://api.pinata.cloud/pinning/pinFileToIPFS',
            formData,
            {
                headers: {
                    'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
                    'Authorization': `Bearer ${PINATA_JWT}`
                }
            }
        );

        const ipfsHash = response.data.IpfsHash;
        console.log(`✅ Upload do prompt concluído! IPFS Hash: ${ipfsHash}`);
        return `ipfs://${ipfsHash}`;
    } catch (error) {
        console.error('Erro no upload do prompt:', error.response?.data || error.message);
        throw error;
    }
}

module.exports = { uploadFileToIPFS, uploadPromptToIPFS };
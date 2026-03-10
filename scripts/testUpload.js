const { uploadFileToIPFS, uploadPromptToIPFS } = require('./uploadToIPFS');

async function test() {
    try {
        // Testar upload de imagem
        const imageHash = await uploadFileToIPFS('./assets/agente.png');
        console.log('Imagem:', imageHash);

        // Testar upload de prompt
        const promptText = 'Você é um assistente amigável.';
        const promptHash = await uploadPromptToIPFS(promptText);
        console.log('Prompt:', promptHash);
    } catch (error) {
        console.error(error);
    }
}

test();
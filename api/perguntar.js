export default function handler(req, res) {
  if (req.method === 'POST') {
    // Aqui você processa a pergunta recebida em req.body
    const { pergunta, tokenId, wallet, nomeAgente } = req.body;
    // ... lógica do seu agente ...
    res.status(200).json({ resposta: "Aqui vai a resposta do agente" });
  } else {
    res.status(405).json({ erro: "Método não permitido" });
  }
}
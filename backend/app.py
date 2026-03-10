import os
import json
import requests
from flask import Flask, request, jsonify, send_from_directory
from web3 import Web3
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# ===== ROTA PARA SERVIR ARQUIVOS DA PASTA 'public' =====
@app.route('/public/<path:filename>')
def public_files(filename):
    return send_from_directory('public', filename)
# ======================================================

# Configurações a partir do .env
RPC_URL = os.getenv('RPC_URL')
CONTRACT_ADDRESS = os.getenv('CONTRACT_ADDRESS')
IPFS_GATEWAY = os.getenv('IPFS_GATEWAY', 'https://ipfs.io/ipfs/')
MODEL_NAME = os.getenv('MODEL_NAME', 'Qwen/Qwen2.5-1.5B')
HF_TOKEN = os.getenv('HF_TOKEN', None)

# Conectar à blockchain NEURA
w3 = Web3(Web3.HTTPProvider(RPC_URL))
if not w3.is_connected():
    raise Exception("Falha ao conectar à NEURA. Verifique RPC_URL.")

# Carregar ABI do contrato (extraindo a chave 'abi')
with open('abi.json', 'r') as f:
    contract_data = json.load(f)
    contract_abi = contract_data['abi']

contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=contract_abi)

# Determinar dispositivo (CPU ou GPU)
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Usando dispositivo: {device}")

# Carregar modelo de IA
print(f"Carregando modelo {MODEL_NAME}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, token=HF_TOKEN)
model = AutoModelForCausalLM.from_pretrained(
    MODEL_NAME,
    torch_dtype=torch.float16 if device == "cuda" else torch.float32,
    token=HF_TOKEN
).to(device)
print("Modelo carregado com sucesso!")

def download_from_ipfs(ipfs_hash):
    """
    Baixa conteúdo textual de um hash IPFS via gateway público.
    Exemplo: ipfs://QmXYZ -> https://ipfs.io/ipfs/QmXYZ
    """
    if ipfs_hash.startswith('ipfs://'):
        ipfs_hash = ipfs_hash[7:]
    url = f"{IPFS_GATEWAY}{ipfs_hash}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.text
    else:
        raise Exception(f"Erro ao baixar do IPFS: status {response.status_code}")

@app.route('/api/agente/<int:token_id>/perguntar', methods=['POST'])
def perguntar(token_id):
    """
    Endpoint para interagir com o agente NFT.
    Espera JSON: { "usuario": "0x...", "pergunta": "texto" }
    """
    data = request.get_json()
    if not data or 'usuario' not in data or 'pergunta' not in data:
        return jsonify({'erro': 'Campos "usuario" e "pergunta" são obrigatórios'}), 400

    usuario = data['usuario']
    pergunta = data['pergunta']

    # 1. Verificar permissão do usuário no contrato
    try:
        pode_usar = contract.functions.podeUsarAgente(token_id, usuario).call()
    except Exception as e:
        return jsonify({'erro': f'Erro ao verificar permissão: {str(e)}'}), 500

    if not pode_usar:
        return jsonify({'erro': 'Usuário não tem permissão para usar este agente'}), 403

    # 2. Buscar informações do agente na blockchain
    try:
        agente_info = contract.functions.getInfoAgente(token_id).call()
        # agente_info: [nome, modeloIA, ipfsImagem, ipfsPromptBase, proprietario, nivel, ultimo]
        nome_agente = agente_info[0]
        ipfs_prompt = agente_info[3]
        nivel = agente_info[5]
    except Exception as e:
        return jsonify({'erro': f'Erro ao buscar agente: {str(e)}'}), 500

    # 3. Baixar o prompt base do IPFS
    try:
        prompt_base = download_from_ipfs(ipfs_prompt)
    except Exception as e:
        return jsonify({'erro': f'Erro ao baixar prompt do IPFS: {str(e)}'}), 500

    # 4. Montar o prompt completo para o modelo
    input_text = f"{prompt_base}\n\nUsuário: {pergunta}\nAssistente:"

    # 5. Gerar resposta com o modelo de linguagem
    inputs = tokenizer(input_text, return_tensors="pt")
    # Mover os inputs para o mesmo dispositivo do modelo
    inputs = {k: v.to(model.device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=200,
            temperature=0.7,
            do_sample=True,
            pad_token_id=tokenizer.eos_token_id
        )

    resposta_completa = tokenizer.decode(outputs[0], skip_special_tokens=True)
    # Extrair apenas a parte após "Assistente:"
    partes = resposta_completa.split("Assistente:")
    resposta = partes[-1].strip() if len(partes) > 1 else resposta_completa

    return jsonify({
        'resposta': resposta,
        'agente': nome_agente,
        'nivel': nivel
    })

@app.route('/api/agente/<int:token_id>/info', methods=['GET'])
def info_agente(token_id):
    """Retorna informações públicas do agente (sem o prompt)."""
    try:
        agente_info = contract.functions.getInfoAgente(token_id).call()
        return jsonify({
            'nome': agente_info[0],
            'modelo': agente_info[1],
            'ipfsImagem': agente_info[2],
            'proprietario': agente_info[4],
            'nivel': agente_info[5]
        })
    except Exception as e:
        return jsonify({'erro': str(e)}), 500

if __name__ == '__main__':
    # Host 0.0.0.0 para permitir acesso externo (opcional)
    app.run(debug=True, host='0.0.0.0', port=5000)
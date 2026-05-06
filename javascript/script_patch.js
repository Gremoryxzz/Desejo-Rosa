// ============================================================
//  PATCH — script.js
//  Adicione estas mudanças no seu javascript/script.js existente
// ============================================================

// 1. No topo do script.js, adicione o ícone de carrinho ao header
//    Localize a função que monta o header ou, no index.html,
//    substitua .nav-right por:
/*
  <div class="nav-right">
    <a href="login.html" class="btn-login">Entrar</a>
    <a href="carrinho.html" class="carrinho-icon" id="carrinho-link">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      <span class="carrinho-badge" id="carrinho-badge" style="display:none">0</span>
    </a>
  </div>
*/

// 2. No index.css adicione:
/*
.carrinho-icon {
  position: relative;
  display: flex;
  align-items: center;
  color: #1a1a1a;
  text-decoration: none;
  margin-left: 16px;
}
.carrinho-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #c8a96e;
  color: #fff;
  font-size: 10px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Jost', sans-serif;
}
*/

// 3. Substitua/atualize a função que cria cards de produto
//    (onde você faz card.innerHTML = `...`) para incluir o botão.
//    Exemplo baseado no padrão Bela Rosa:

function criarCard(produto) {
  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <div class="card-img-wrap" onclick="abrirProduto(${produto.id})">
      <img src="${produto.imagem_url}" alt="${produto.nome}" loading="lazy">
    </div>
    <div class="card-info">
      <h3 onclick="abrirProduto(${produto.id})">${produto.nome}</h3>
      <p class="card-preco">R$ ${Number(produto.preco).toLocaleString('pt-BR',{minimumFractionDigits:2})}</p>
      <button class="btn-adicionar" onclick="adicionarAoCarrinho(event, ${produto.id}, '${produto.nome}', ${produto.preco}, '${produto.imagem_url}')">
        + Adicionar ao carrinho
      </button>
    </div>
  `;
  return card;
}

// 4. Adicione a função adicionarAoCarrinho no script.js
function adicionarAoCarrinho(e, id, nome, preco, imagem) {
  e.stopPropagation(); // Evita abrir a página do produto
  Carrinho.adicionar({ id: String(id), nome, preco: Number(preco), imagem });
}

// 5. Adicione este CSS no seu css/index.css para o botão nos cards:
/*
.btn-adicionar {
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  background: #1a1a1a;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-family: 'Jost', sans-serif;
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: background .2s, transform .1s;
}
.btn-adicionar:hover { background: #333; }
.btn-adicionar:active { transform: scale(.97); }
*/

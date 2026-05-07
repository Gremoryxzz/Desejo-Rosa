const produto = JSON.parse(localStorage.getItem("produtoSelecionado"));

if (produto) {
  document.title = `${produto.nome} — Bela Rosa`;
  document.getElementById("nome").textContent = produto.nome;
  document.getElementById("preco").textContent = "R$ " + Number(produto.preco).toFixed(2);
  document.getElementById("imagemPrincipal").src = produto.imagem;

  const catMap = { lancamento: "Lançamento", novidade: "Novidade", outro: "Produto" };
  document.getElementById("categoria").textContent = catMap[produto.categoria] || "Produto";

  // Estoque
  const estoqueEl = document.getElementById("estoque-info");
  const estN = Number(produto.estoque) || 0;
  if (produto.estoque !== undefined) {
    if (estN === 0) {
      estoqueEl.textContent = "⚠ Fora de estoque";
      estoqueEl.className = "p-estoque sem-estoque";
    } else if (estN <= 3) {
      estoqueEl.textContent = `⚡ Últimas ${estN} peças!`;
      estoqueEl.className = "p-estoque estoque-baixo";
    } else {
      estoqueEl.textContent = `✓ Em estoque`;
      estoqueEl.className = "p-estoque em-estoque";
    }
  }

  const mensagem = encodeURIComponent(`Olá! Tenho interesse no produto: ${produto.nome} — R$ ${Number(produto.preco).toFixed(2)}`);
  document.getElementById("whatsapp").href = `https://wa.me/5521973254935?text=${mensagem}`;

  injetarBotoes(produto);

} else {
  window.location.href = "index.html";
}

function injetarBotoes(produto) {
  const acoes = document.getElementById("p-acoes");
  if (!acoes) return;

  const estN = Number(produto.estoque) || 0;
  const semEstoque = produto.estoque !== undefined && estN === 0;

  const style = document.createElement("style");
  style.textContent = `
    .p-acoes { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }

    .btn-comprar-agora {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; padding: 17px;
      background: var(--rose);
      color: #fff; border: none; border-radius: 10px;
      font-family: 'Jost', sans-serif; font-size: 13px;
      font-weight: 500; letter-spacing: .12em; text-transform: uppercase;
      cursor: pointer; transition: background .2s, transform .1s;
    }
    .btn-comprar-agora:hover:not(:disabled)  { background: var(--rose-dark); transform: translateY(-1px); box-shadow: 0 8px 24px rgba(160,48,80,.2); }
    .btn-comprar-agora:active:not(:disabled) { transform: scale(.98); }
    .btn-comprar-agora:disabled { opacity: .4; cursor: not-allowed; }

    .btn-add-carrinho {
      display: flex; align-items: center; justify-content: center; gap: 10px;
      width: 100%; padding: 15px;
      background: transparent; color: var(--black);
      border: 1.5px solid rgba(26,18,24,.2); border-radius: 10px;
      font-family: 'Jost', sans-serif; font-size: 13px;
      font-weight: 400; letter-spacing: .1em; text-transform: uppercase;
      cursor: pointer; transition: all .2s;
    }
    .btn-add-carrinho:hover:not(:disabled) { border-color: var(--black); background: rgba(26,18,24,.04); }
    .btn-add-carrinho:disabled { opacity: .4; cursor: not-allowed; }

    .link-ver-carrinho {
      display: none; text-align: center;
      font-family: 'Jost', sans-serif; font-size: 12px;
      color: #888; text-decoration: underline;
      cursor: pointer; letter-spacing: .04em;
    }

    .p-estoque { font-size: 13px; font-weight: 400; margin-bottom: 10px; letter-spacing: .3px; }
    .em-estoque  { color: #276749; }
    .estoque-baixo { color: #92400e; }
    .sem-estoque { color: #c53030; }
  `;
  document.head.appendChild(style);

  acoes.innerHTML = `
    <button class="btn-comprar-agora" id="btn-comprar-agora" ${semEstoque ? 'disabled' : ''}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
      </svg>
      ${semEstoque ? 'Sem estoque' : 'Comprar agora'}
    </button>
    <button class="btn-add-carrinho" id="btn-add-carrinho" ${semEstoque ? 'disabled' : ''}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      Adicionar ao carrinho
    </button>
    <span class="link-ver-carrinho" id="link-ver-carrinho">→ Ver carrinho</span>
  `;

  // Comprar agora → vai direto pro checkout
  document.getElementById("btn-comprar-agora")?.addEventListener("click", () => {
    Carrinho.adicionar({
      id:     String(produto.id),
      nome:   produto.nome,
      preco:  Number(produto.preco),
      imagem: produto.imagem
    });
    window.location.href = "checkout.html";
  });

  // Adicionar ao carrinho → permanece na página
  document.getElementById("btn-add-carrinho")?.addEventListener("click", () => {
    Carrinho.adicionar({
      id:     String(produto.id),
      nome:   produto.nome,
      preco:  Number(produto.preco),
      imagem: produto.imagem
    });
    const link = document.getElementById("link-ver-carrinho");
    if (link) link.style.display = "block";
  });

  document.getElementById("link-ver-carrinho")?.addEventListener("click", () => {
    window.location.href = "carrinho.html";
  });
}
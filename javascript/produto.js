const produto = JSON.parse(localStorage.getItem("produtoSelecionado"));

if (produto) {
  document.title = `${produto.nome} — Bela Rosa`;
  document.getElementById("nome").textContent = produto.nome;
  document.getElementById("preco").textContent = "R$ " + Number(produto.preco).toFixed(2);
  document.getElementById("imagemPrincipal").src = produto.imagem;

  const catMap = { lancamento: "Lançamento", novidade: "Novidade", outro: "Produto" };
  document.getElementById("categoria").textContent = catMap[produto.categoria] || "Produto";

  const mensagem = encodeURIComponent(`Olá! Tenho interesse no produto: ${produto.nome} — R$ ${Number(produto.preco).toFixed(2)}`);
  document.getElementById("whatsapp").href = `https://wa.me/5521973254935?text=${mensagem}`;

  // ── Botão Adicionar ao Carrinho ──────────────────────────────
  injetarBotaoCarrinho(produto);

} else {
  window.location.href = "index.html";
}

function injetarBotaoCarrinho(produto) {
  const infoProduto = document.querySelector(".info-produto");
  const divider = document.querySelector(".p-divider");
  if (!infoProduto || document.getElementById("btn-add-produto")) return;

  // Estilos inline para o botão e link "Ver carrinho"
  const style = document.createElement("style");
  style.textContent = `
    #btn-add-produto {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      width: 100%;
      padding: 16px;
      margin-bottom: 12px;
      background: #1a1a1a;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-family: 'Jost', sans-serif;
      font-size: 13px;
      letter-spacing: .1em;
      text-transform: uppercase;
      cursor: pointer;
      transition: background .2s, transform .1s;
    }
    #btn-add-produto:hover { background: #3a3a3a; }
    #btn-add-produto:active { transform: scale(.98); }
    #link-ver-carrinho {
      display: none;
      text-align: center;
      font-family: 'Jost', sans-serif;
      font-size: 12px;
      color: #888;
      text-decoration: underline;
      cursor: pointer;
      margin-bottom: 16px;
      letter-spacing: .04em;
    }
  `;
  document.head.appendChild(style);

  // Cria os elementos
  const btn = document.createElement("button");
  btn.id = "btn-add-produto";
  btn.innerHTML = `
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
    Adicionar ao carrinho
  `;

  const linkCarrinho = document.createElement("span");
  linkCarrinho.id = "link-ver-carrinho";
  linkCarrinho.textContent = "→ Ver carrinho";
  linkCarrinho.onclick = () => window.location.href = "carrinho.html";

  // Insere antes do .p-divider (que está acima da descrição)
  infoProduto.insertBefore(linkCarrinho, divider);
  infoProduto.insertBefore(btn, linkCarrinho);

  // Evento
  btn.addEventListener("click", () => {
    Carrinho.adicionar({
      id:     String(produto.id),
      nome:   produto.nome,
      preco:  Number(produto.preco),
      imagem: produto.imagem
    });
    linkCarrinho.style.display = "block";
  });
}
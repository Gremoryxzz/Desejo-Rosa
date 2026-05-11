// ============================================================
//  Desejo Rosa — carrinho_page.js
//  Lógica da página do carrinho
// ============================================================

function render() {
  const lista  = document.getElementById("lista-itens");
  const vazio  = document.getElementById("c-vazio");
  const resumo = document.getElementById("c-resumo");
  const contEl = document.getElementById("c-contagem");
  const itens  = Carrinho.getItens();

  lista.innerHTML = "";

  if (itens.length === 0) {
    vazio.style.display  = "flex";
    resumo.style.display = "none";
    contEl.textContent   = "";
    return;
  }

  vazio.style.display  = "none";
  resumo.style.display = "block";
  contEl.textContent   = `(${Carrinho.contagem()})`;

  itens.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-img-wrap">
        <img class="item-img" src="${item.imagem || ''}" alt="${item.nome}"
             onerror="this.parentElement.style.background='#e8e0d5'">
      </div>
      <div class="item-info">
        <span class="item-nome">${item.nome}</span>
        <span class="item-preco-unit">R$ ${fmt(item.preco)} / un.</span>
        <div class="item-qtd">
          <button class="qtd-btn" onclick="Carrinho.alterarQtd('${item.id}', -1)">−</button>
          <span class="qtd-num">${item.qtd}</span>
          <button class="qtd-btn" onclick="Carrinho.alterarQtd('${item.id}', 1)">+</button>
        </div>
      </div>
      <div class="item-direita">
        <span class="item-total">R$ ${fmt(item.preco * item.qtd)}</span>
        <button class="item-remover" onclick="Carrinho.remover('${item.id}')">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
          Remover
        </button>
      </div>
    `;
    lista.appendChild(card);
  });

  atualizarResumo(itens);
}

function atualizarResumo(itens) {
  const sub = Carrinho.total();
  document.getElementById("r-subtotal").textContent = `R$ ${fmt(sub)}`;
  document.getElementById("r-total").textContent    = `R$ ${fmt(sub)}`;

  const mini = document.getElementById("resumo-itens-mini");
  mini.innerHTML = itens.map(i => `
    <div class="mini-item">
      <span class="mini-nome">${i.nome} <em>×${i.qtd}</em></span>
      <span class="mini-val">R$ ${fmt(i.preco * i.qtd)}</span>
    </div>
  `).join('');
}

function fmt(v) {
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

document.getElementById("btn-checkout")?.addEventListener("click", () => {
  if (!Carrinho.getItens().length) return;
  window.location.href = "checkout.html";
});

window.addEventListener("carritoAtualizado", render);
document.addEventListener("DOMContentLoaded", render);

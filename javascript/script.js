// Header scroll effect
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header?.classList.toggle('scrolled', window.scrollY > 20);
});

// ─── ÍCONE CARRINHO NO HEADER ───
function injetarCarrinhoHeader() {
  const navRight = document.querySelector(".nav-right");
  if (!navRight || document.getElementById("carrinho-link")) return;

  const link = document.createElement("a");
  link.href = "carrinho.html";
  link.id = "carrinho-link";
  link.style.cssText = "position:relative;display:flex;align-items:center;color:#1a1a1a;text-decoration:none;margin-right:16px;";
  link.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
    <span id="carrinho-badge" style="
      position:absolute;top:-8px;right:-8px;
      background:#c8a96e;color:#fff;font-size:10px;
      width:18px;height:18px;border-radius:50%;
      display:none;align-items:center;justify-content:center;
      font-family:'Jost',sans-serif;font-weight:500;
    ">0</span>
  `;
  navRight.insertBefore(link, navRight.firstChild);
}

// ─── BANNERS ───
async function carregarBanners() {
  const slider = document.getElementById("slider");
  const texto = document.getElementById("bannerTexto");
  const dotsContainer = document.getElementById("sliderDots");
  if (!slider) return;

  const { data, error } = await window.db
    .from("banners")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return;

  slider.innerHTML = "";
  dotsContainer.innerHTML = "";

  data.forEach((b, i) => {
    slider.innerHTML += `<img src="${b.imagem}" class="${i === 0 ? "ativo" : ""}" alt="${b.titulo || ''}">`;
    dotsContainer.innerHTML += `<div class="dot ${i === 0 ? 'ativo' : ''}" data-index="${i}"></div>`;
  });

  const imagens = document.querySelectorAll(".slider img");
  const dots = document.querySelectorAll(".dot");
  let index = 0;

  function goTo(i) {
    imagens.forEach(img => img.classList.remove("ativo"));
    dots.forEach(d => d.classList.remove("ativo"));
    index = (i + data.length) % data.length;
    imagens[index].classList.add("ativo");
    dots[index].classList.add("ativo");
    const atual = data[index];
    texto.querySelector("h2").textContent = atual.titulo || "";
    texto.querySelector("p").textContent = atual.subtitulo || "";
  }

  dots.forEach(d => d.addEventListener("click", () => goTo(Number(d.dataset.index))));

  texto.querySelector("h2").textContent = data[0].titulo || "";
  texto.querySelector("p").textContent = data[0].subtitulo || "";

  setInterval(() => goTo(index + 1), 5000);
}

// ─── PRODUTOS ───
async function carregarProdutos() {
  const lancamentosEl = document.getElementById("lancamentos-grid");
  const novidadesEl = document.getElementById("novidades-grid");
  const produtosEl = document.getElementById("produtos-grid");
  if (!lancamentosEl || !novidadesEl || !produtosEl) return;

  [lancamentosEl, novidadesEl, produtosEl].forEach(el => {
    el.innerHTML = [1,2,3,4].map(() => `<div class="skeleton"></div>`).join('');
  });

  const { data, error } = await window.db
    .from("produtos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) { console.error(error); return; }

  lancamentosEl.innerHTML = "";
  novidadesEl.innerHTML = "";
  produtosEl.innerHTML = "";

  data.forEach((p) => {
    const preco = Number(String(p.preco).replace(",", "."));
    const label = p.categoria === 'lancamento' ? 'Lançamento' : p.categoria === 'novidade' ? 'Novidade' : '';
    const produtoJson = JSON.stringify(p).split('"').join('&quot;');

    const card = `
      <div class="card">
        <div class="card-img-wrap" onclick="abrirProduto(${produtoJson})" style="cursor:pointer">
          ${label ? `<span class="card-badge">${label}</span>` : ''}
          <img src="${p.imagem}" alt="${p.nome}" loading="lazy">
          <div class="card-overlay">
            <span class="card-btn">Ver produto</span>
          </div>
        </div>
        <div class="card-info">
          <p class="nome">${p.nome}</p>
          <p class="preco">R$ ${preco.toFixed(2)}</p>
          <button class="btn-adicionar" onclick="adicionarAoCarrinho(event, '${p.id}', '${p.nome.replace(/'/g, "\\'")}', ${preco}, '${p.imagem}')">
            + Adicionar ao carrinho
          </button>
        </div>
      </div>`;

    if (p.categoria === "lancamento") lancamentosEl.innerHTML += card;
    else if (p.categoria === "novidade") novidadesEl.innerHTML += card;
    else produtosEl.innerHTML += card;
  });
}

function abrirProduto(p) {
  localStorage.setItem("produtoSelecionado", JSON.stringify(p));
  window.location.href = "produto.html";
}

function adicionarAoCarrinho(e, id, nome, preco, imagem) {
  e.stopPropagation();
  Carrinho.adicionar({ id: String(id), nome, preco: Number(preco), imagem });
}

// INIT
injetarCarrinhoHeader();
carregarBanners();
carregarProdutos();
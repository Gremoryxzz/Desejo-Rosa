// ============================================================
//  Desejo Rosa — script.js
//  Lógica da home: scroll, banners, produtos
//  O header (logo + sessão) é gerenciado pelo header.js
// ============================================================

// Header scroll effect
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header?.classList.toggle('scrolled', window.scrollY > 20);
});

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
    const ativo = i === 0 ? "ativo" : "";
    if (b.imagem_mobile) {
      slider.innerHTML += `<img src="${b.imagem}" class="img-desktop ${ativo}" alt="${b.titulo || ''}">`;
      slider.innerHTML += `<img src="${b.imagem_mobile}" class="img-mobile ${ativo}" alt="${b.titulo || ''}">`;
    } else {
      slider.innerHTML += `<img src="${b.imagem}" class="${ativo}" alt="${b.titulo || ''}" style="object-position:center center;">`;
    }
    dotsContainer.innerHTML += `<div class="dot ${ativo}" data-index="${i}"></div>`;
  });

  const dots = document.querySelectorAll(".dot");
  let index = 0;

  function goTo(i) {
    index = (i + data.length) % data.length;
    const atual = data[index];

    slider.querySelectorAll("img").forEach(img => img.classList.remove("ativo"));
    dots.forEach(d => d.classList.remove("ativo"));

    if (atual.imagem_mobile) {
      slider.querySelectorAll(".img-desktop")[index]?.classList.add("ativo");
      slider.querySelectorAll(".img-mobile")[index]?.classList.add("ativo");
    } else {
      slider.querySelectorAll("img")[index]?.classList.add("ativo");
    }

    dots[index]?.classList.add("ativo");
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
    const semEstoque = Number(p.estoque) === 0 && p.estoque !== null && p.estoque !== undefined;

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
          <div class="card-btns">
            <button class="btn-comprar-agora" ${semEstoque ? 'disabled' : ''} onclick="comprarAgora(event, ${produtoJson})">
              ${semEstoque ? 'Sem estoque' : 'Comprar agora'}
            </button>
            <button class="btn-adicionar" ${semEstoque ? 'disabled' : ''} onclick="adicionarAoCarrinho(event, '${p.id}', '${p.nome.replace(/'/g, "\\'")}', ${preco}, '${p.imagem}')">
              + Adicionar ao carrinho
            </button>
          </div>
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

function comprarAgora(e, p) {
  e.stopPropagation();
  Carrinho.adicionar({ id: String(p.id), nome: p.nome, preco: Number(p.preco), imagem: p.imagem });
  window.location.href = "checkout.html";
}

function adicionarAoCarrinho(e, id, nome, preco, imagem) {
  e.stopPropagation();
  Carrinho.adicionar({ id: String(id), nome, preco: Number(preco), imagem });
}

// INIT
carregarBanners();
carregarProdutos();
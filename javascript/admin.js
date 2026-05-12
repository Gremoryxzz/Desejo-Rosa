// ADMIN_EMAIL já declarado em header.js — não redeclarar aqui

// ── Modal de confirmação customizado ─────────────────────
function confirmar(mensagem) {
  return new Promise(resolve => {
    let modal = document.getElementById('modal-confirmar');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-confirmar';
      modal.style.cssText = `
        position:fixed;inset:0;z-index:9999;
        display:flex;align-items:center;justify-content:center;
        background:rgba(26,18,24,.45);backdrop-filter:blur(4px);
        animation:fadeIn .2s ease;
      `;
      document.body.appendChild(modal);
      const s = document.createElement('style');
      s.textContent = `
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes slideUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
        #modal-confirmar .modal-box{
          background:#fff;border-radius:8px;padding:32px 36px;
          max-width:380px;width:90%;text-align:center;
          box-shadow:0 20px 60px rgba(26,18,24,.18);
          animation:slideUp .25s ease;
        }
        #modal-confirmar .modal-msg{
          font-family:'Jost',sans-serif;font-size:15px;font-weight:300;
          color:var(--black);margin-bottom:24px;line-height:1.5;
        }
        #modal-confirmar .modal-btns{display:flex;gap:10px;justify-content:center;}
        #modal-confirmar .modal-ok{
          background:var(--rose);color:#fff;border:none;
          padding:10px 28px;border-radius:4px;
          font-family:'Jost',sans-serif;font-size:12px;
          font-weight:500;letter-spacing:1.5px;text-transform:uppercase;
          cursor:pointer;transition:background .2s;
        }
        #modal-confirmar .modal-ok:hover{background:var(--rose-dark);}
        #modal-confirmar .modal-cancel{
          background:transparent;color:var(--gray);
          border:1px solid rgba(200,80,110,.2);
          padding:10px 28px;border-radius:4px;
          font-family:'Jost',sans-serif;font-size:12px;
          font-weight:400;letter-spacing:1px;text-transform:uppercase;
          cursor:pointer;transition:all .2s;
        }
        #modal-confirmar .modal-cancel:hover{border-color:var(--gray);color:var(--black);}
      `;
      document.head.appendChild(s);
    }
    modal.innerHTML = `
      <div class="modal-box">
        <p class="modal-msg">${mensagem}</p>
        <div class="modal-btns">
          <button class="modal-cancel" id="modal-nao">Cancelar</button>
          <button class="modal-ok" id="modal-sim">Confirmar</button>
        </div>
      </div>`;
    modal.style.display = 'flex';
    document.getElementById('modal-sim').onclick  = () => { modal.style.display='none'; resolve(true); };
    document.getElementById('modal-nao').onclick  = () => { modal.style.display='none'; resolve(false); };
    modal.onclick = (e) => { if (e.target === modal) { modal.style.display='none'; resolve(false); } };
  });
}

async function verificarLogin() {
  const { data } = await window.db.auth.getUser();
  const user = data.user;
  if (!user) { window.location.href = "login.html"; return; }
  if (user.email !== ADMIN_EMAIL) {
    await window.db.auth.signOut();
    window.location.href = "login.html";
    return;
  }
  carregarProdutos();
  carregarPedidos();
  carregarBannersAdmin();
}
verificarLogin();

document.getElementById("logout")?.addEventListener("click", async () => {
  await window.db.auth.signOut();
  window.location.href = "index.html";
});

// ── Drop zones ────────────────────────────────────────────
const dropZona = document.getElementById("dropZona");
const inputImagem = document.getElementById("imagem");
const preview = document.getElementById("preview");
const dropInner = document.getElementById("dropInner");

dropZona?.addEventListener("click", () => inputImagem.click());
inputImagem?.addEventListener("change", () => mostrarPreview(inputImagem.files[0], preview, dropInner));
dropZona?.addEventListener("dragover", e => { e.preventDefault(); dropZona.style.borderColor = 'var(--rose)'; });
dropZona?.addEventListener("dragleave", () => { dropZona.style.borderColor = ''; });
dropZona?.addEventListener("drop", e => {
  e.preventDefault(); dropZona.style.borderColor = '';
  const file = e.dataTransfer.files[0];
  if (file) { inputImagem.files = e.dataTransfer.files; mostrarPreview(file, preview, dropInner); }
});

const dropBanner = document.getElementById("dropBanner");
const inputBanner = document.getElementById("bannerImagem");
const bannerPreview = document.getElementById("bannerPreview");
const dropBannerInner = document.getElementById("dropBannerInner");

const dropBannerMobile = document.getElementById("dropBannerMobile");
const inputBannerMobile = document.getElementById("bannerImagemMobile");
const bannerPreviewMobile = document.getElementById("bannerPreviewMobile");
const dropBannerMobileInner = document.getElementById("dropBannerMobileInner");

dropBanner?.addEventListener("click", () => inputBanner.click());
inputBanner?.addEventListener("change", () => mostrarPreview(inputBanner.files[0], bannerPreview, dropBannerInner));

dropBannerMobile?.addEventListener("click", () => inputBannerMobile.click());
inputBannerMobile?.addEventListener("change", () => mostrarPreview(inputBannerMobile.files[0], bannerPreviewMobile, dropBannerMobileInner));

function mostrarPreview(file, imgEl, innerEl) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    imgEl.src = e.target.result;
    imgEl.style.display = 'block';
    innerEl.style.display = 'none';
  };
  reader.readAsDataURL(file);
}

// ── Navegação sidebar ─────────────────────────────────────
function mostrarSecao(id) {
  document.querySelectorAll('.a-section').forEach(s => s.classList.remove('ativa'));
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  document.getElementById(id)?.classList.add('ativa');
  document.querySelector(`.nav-item[data-target="${id}"]`)?.classList.add('active');
}

// Mostra a primeira seção ao carregar (compatível com script carregado após DOM)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mostrarSecao('section-produto'));
} else {
  mostrarSecao('section-produto');
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    mostrarSecao(item.dataset.target);
  });
});

// ── Upload Cloudinary ─────────────────────────────────────
async function uploadImagem(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "unsigned_preset");
  const res = await fetch("https://api.cloudinary.com/v1_1/Dazsfbixz/image/upload", { method: "POST", body: formData });
  const data = await res.json();
  return data.secure_url;
}

function setMsg(id, texto, tipo) {
  const el = document.getElementById(id);
  el.textContent = texto;
  el.className = `msg ${tipo}`;
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 4000);
}

// ── Adicionar produto ─────────────────────────────────────
document.getElementById("add")?.addEventListener("click", async () => {
  const nome = document.getElementById("nome").value.trim();
  const precoInput = document.getElementById("preco").value.trim();
  const categoria = document.getElementById("categoria").value;
  const estoqueVal = document.getElementById("estoque").value.trim();
  const file = document.getElementById("imagem").files[0];
  const preco = Number(precoInput.replace(",", "."));
  const estoque = Number(estoqueVal) || 0;

  if (!nome || !preco || !file) {
    setMsg('addMsg', 'Preencha todos os campos e selecione uma imagem.', 'error'); return;
  }

  const btn = document.getElementById("add");
  const txt = document.getElementById("addTexto");
  btn.disabled = true; txt.textContent = "Enviando...";

  try {
    const imagem = await uploadImagem(file);
    await window.db.from("produtos").insert([{ nome, preco, imagem, categoria, estoque }]);
    setMsg('addMsg', '✓ Produto adicionado com sucesso!', 'success');
    document.getElementById("nome").value = '';
    document.getElementById("preco").value = '';
    document.getElementById("estoque").value = '';
    preview.style.display = 'none';
    dropInner.style.display = 'block';
    carregarProdutos();
  } catch (err) {
    console.error(err);
    setMsg('addMsg', 'Erro ao cadastrar produto. Tente novamente.', 'error');
  }
  btn.disabled = false; txt.textContent = "Adicionar Produto";
});

// ── Adicionar banner ──────────────────────────────────────
document.getElementById("addBanner")?.addEventListener("click", async () => {
  const file = document.getElementById("bannerImagem").files[0];
  const fileMobile = document.getElementById("bannerImagemMobile")?.files[0];
  const titulo = document.getElementById("bannerTitulo").value;
  const subtitulo = document.getElementById("bannerSubtitulo").value;

  if (!file) { setMsg('bannerMsg', 'Selecione uma imagem desktop para o banner.', 'error'); return; }

  const btn = document.getElementById("addBanner");
  const txt = document.getElementById("bannerTexto");
  btn.disabled = true; txt.textContent = "Enviando...";

  try {
    const imagem = await uploadImagem(file);
    let imagem_mobile = null;
    if (fileMobile) imagem_mobile = await uploadImagem(fileMobile);

    const { data: existentes } = await window.db.from("banners").select("ordem").order("ordem", { ascending: false }).limit(1);
    const proxOrdem = existentes && existentes.length > 0 ? (existentes[0].ordem || 0) + 1 : 0;

    await window.db.from("banners").insert([{ imagem, imagem_mobile, titulo, subtitulo, ordem: proxOrdem }]);
    setMsg('bannerMsg', '✓ Banner adicionado com sucesso!', 'success');

    document.getElementById("bannerTitulo").value = '';
    document.getElementById("bannerSubtitulo").value = '';
    document.getElementById("bannerImagem").value = '';
    if (document.getElementById("bannerImagemMobile")) document.getElementById("bannerImagemMobile").value = '';

    bannerPreview.style.display = 'none';
    dropBannerInner.style.display = 'block';
    if (bannerPreviewMobile) { bannerPreviewMobile.style.display = 'none'; dropBannerMobileInner.style.display = 'block'; }

    carregarBannersAdmin();
  } catch (err) {
    console.error(err);
    setMsg('bannerMsg', 'Erro ao enviar banner. Tente novamente.', 'error');
  }
  btn.disabled = false; txt.textContent = "Adicionar Banner";
});

// ── Carregar banners (com gestão) ─────────────────────────
async function carregarBannersAdmin() {
  // Garante que a lista de banners do admin existe no HTML
  let listaEl = document.getElementById("listaBannersAdmin");
  if (!listaEl) {
    // Insere a seção de lista de banners abaixo do form de banner
    const sectionBanner = document.getElementById("section-banner");
    if (!sectionBanner) return;

    const div = document.createElement("div");
    div.id = "listaBannersAdmin";
    div.style.marginTop = "32px";
    sectionBanner.appendChild(div);
    listaEl = div;
  }

  listaEl.innerHTML = '<div style="font-size:13px;color:var(--gray);margin-bottom:12px;letter-spacing:.5px;">Carregando banners…</div>';

  const { data } = await window.db.from("banners").select("*").order("ordem", { ascending: true }).order("created_at", { ascending: false });
  const banners = data || [];

  if (banners.length === 0) {
    listaEl.innerHTML = '<div class="empty-state"><p>Nenhum banner cadastrado ainda.</p></div>';
    return;
  }

  // Injeta estilos para os cards de banner se ainda não injetados
  if (!document.getElementById('banner-admin-style')) {
    const s = document.createElement('style');
    s.id = 'banner-admin-style';
    s.textContent = `
      .banner-admin-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }
      .banner-admin-titulo {
        font-family: var(--serif);
        font-size: 20px;
        font-weight: 300;
        font-style: italic;
        color: var(--black);
      }
      .banner-card {
        display: flex;
        gap: 16px;
        align-items: center;
        padding: 14px;
        border: 1px solid var(--border);
        border-radius: 4px;
        background: white;
        margin-bottom: 10px;
        transition: all .2s;
        cursor: grab;
        user-select: none;
      }
      .banner-card:active { cursor: grabbing; }
      .banner-card.drag-over { border-color: var(--rose); background: var(--rose-pale); }
      .banner-card.dragging { opacity: .4; }
      .banner-card img {
        width: 120px;
        height: 56px;
        object-fit: cover;
        border-radius: 2px;
        flex-shrink: 0;
        background: var(--rose-pale);
        pointer-events: none;
      }
      .banner-card-info {
        flex: 1;
        min-width: 0;
      }
      .banner-card-titulo {
        font-size: 14px;
        font-weight: 400;
        color: var(--black);
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .banner-card-sub {
        font-size: 12px;
        color: var(--gray);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .banner-card-acoes {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .drag-handle {
        cursor: grab;
        color: var(--gray);
        font-size: 18px;
        opacity: .5;
        padding: 0 4px;
        user-select: none;
      }
      .drag-handle:hover { opacity: 1; }
      .btn-banner-del {
        background: transparent;
        border: 1px solid rgba(229,62,62,.3);
        color: #e53e3e;
        padding: 6px 12px;
        border-radius: 2px;
        font-family: var(--sans);
        font-size: 11px;
        font-weight: 500;
        letter-spacing: .5px;
        cursor: pointer;
        transition: all .2s;
        white-space: nowrap;
      }
      .btn-banner-del:hover { background: #e53e3e; color: white; border-color: #e53e3e; }
      .banner-ordem-badge {
        background: var(--rose-pale);
        color: var(--rose);
        border: 1px solid var(--border);
        border-radius: 2px;
        font-size: 11px;
        font-weight: 500;
        padding: 2px 8px;
        letter-spacing: .5px;
        white-space: nowrap;
      }
    `;
    document.head.appendChild(s);
  }

  listaEl.innerHTML = `
    <div class="banner-admin-header">
      <span class="banner-admin-titulo">${banners.length} banner(s) cadastrado(s)</span>
      <span style="font-size:12px;color:var(--gray);letter-spacing:.3px;">⠿ Arraste para reordenar</span>
    </div>
    ${banners.map((b, idx) => `
      <div class="banner-card"
           draggable="true"
           data-id="${b.id}"
           data-idx="${idx}">
        <span class="drag-handle" title="Arrastar">⠿</span>
        <span class="banner-ordem-badge">#${idx + 1}</span>
        <img src="${b.imagem}" alt="${b.titulo || 'Banner'}">
        <div class="banner-card-info">
          <p class="banner-card-titulo">${b.titulo || '(sem título)'}</p>
          <p class="banner-card-sub">${b.subtitulo || '(sem subtítulo)'}</p>
        </div>
        <div class="banner-card-acoes">
          <button class="btn-banner-del" onclick="deletarBanner('${b.id}', this)">Remover</button>
        </div>
      </div>
    `).join('')}
  `;

  // Drag & drop para reordenar
  ativarDragBanners(listaEl, banners);
}

function ativarDragBanners(container, banners) {
  let draggingEl = null;

  container.querySelectorAll('.banner-card').forEach(card => {
    card.addEventListener('dragstart', e => {
      draggingEl = card;
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', async () => {
      card.classList.remove('dragging');
      container.querySelectorAll('.banner-card').forEach(c => c.classList.remove('drag-over'));

      // Salva nova ordem no Supabase
      const cards = [...container.querySelectorAll('.banner-card')];
      for (let i = 0; i < cards.length; i++) {
        const id = cards[i].dataset.id;
        await window.db.from("banners").update({ ordem: i }).eq("id", id);
      }
      carregarBannersAdmin();
    });

    card.addEventListener('dragover', e => {
      e.preventDefault();
      if (!draggingEl || draggingEl === card) return;
      const rect = card.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      container.querySelectorAll('.banner-card').forEach(c => c.classList.remove('drag-over'));
      card.classList.add('drag-over');
      if (e.clientY < midY) {
        container.insertBefore(draggingEl, card);
      } else {
        card.after(draggingEl);
      }
    });
  });
}

async function deletarBanner(id, btn) {
  const ok = await confirmar("Remover este banner?");
  if (!ok) return;
  btn.textContent = '...'; btn.disabled = true;
  await window.db.from("banners").delete().eq("id", id);
  carregarBannersAdmin();
}

// ── Produtos ──────────────────────────────────────────────
async function carregarProdutos() {
  const lista = document.getElementById("listaAdmin");
  const total = document.getElementById("totalProdutos");
  if (!lista) return;

  lista.innerHTML = '<div class="skeleton" style="height:80px;border-radius:4px;margin-bottom:12px;background:var(--rose-pale);animation:shimmer 1.5s infinite;"></div>'.repeat(3);

  const { data } = await window.db.from("produtos").select("*").order("created_at", { ascending: false });

  if (total) total.textContent = `${data?.length || 0} produto(s) cadastrado(s)`;

  if (!data || data.length === 0) {
    lista.innerHTML = '<div class="empty-state"><p>Nenhum produto cadastrado ainda.</p></div>'; return;
  }

  lista.innerHTML = data.map(p => {
    const catLabel = { lancamento: 'Lançamento', novidade: 'Novidade', outro: 'Produto' };
    const estoqueN = Number(p.estoque) || 0;
    const estClass = estoqueN === 0 ? 'estoque-zero' : estoqueN <= 3 ? 'estoque-baixo' : 'estoque-ok';
    const estLabel = estoqueN === 0 ? '⚠ Sem estoque' : estoqueN <= 3 ? `⚡ ${estoqueN} peça(s)` : `✓ ${estoqueN} em estoque`;
    return `
      <div class="admin-card">
        <img src="${p.imagem}" alt="${p.nome}">
        <div class="admin-info">
          <p class="p-nome">${p.nome}</p>
          <p class="p-preco">R$ ${Number(p.preco).toFixed(2)}</p>
        </div>
        <span class="admin-cat">${catLabel[p.categoria] || p.categoria}</span>
        <div class="estoque-controle">
          <span class="estoque-badge ${estClass}">${estLabel}</span>
          <div class="estoque-editar">
            <input type="number" class="estoque-input" value="${estoqueN}" min="0" id="est-${p.id}">
            <button class="btn-estoque-salvar" onclick="salvarEstoque('${p.id}')">Salvar</button>
          </div>
        </div>
        <button class="btn-delete" onclick="deletarProduto('${p.id}', this)">Remover</button>
      </div>`;
  }).join('');
}

async function salvarEstoque(id) {
  const input = document.getElementById('est-' + id);
  const valor = Number(input.value);
  if (isNaN(valor) || valor < 0) return;
  await window.db.from("produtos").update({ estoque: valor }).eq("id", id);
  carregarProdutos();
}

async function deletarProduto(id, btn) {
  const ok = await confirmar("Remover este produto?");
  if (!ok) return;
  btn.textContent = '...'; btn.disabled = true;
  await window.db.from("produtos").delete().eq("id", id);
  carregarProdutos();
}

// ── Pedidos ───────────────────────────────────────────────
async function carregarPedidos() {
  const lista = document.getElementById("listaPedidos");
  const totalEl = document.getElementById("totalPedidos");
  const pendEl = document.getElementById("pedidosPendentes");
  if (!lista) return;

  lista.innerHTML = '<div class="skeleton" style="height:100px;border-radius:4px;margin-bottom:12px;background:var(--rose-pale);animation:shimmer 1.5s infinite;"></div>'.repeat(3);

  const filtro = document.getElementById("filtroPedidos")?.value || 'todos';
  let query = window.db.from("pedidos").select("*").order("created_at", { ascending: false });
  if (filtro !== 'todos') query = query.eq("status", filtro);

  const { data } = await query;
  const pedidos = data || [];

  if (totalEl) totalEl.textContent = `${pedidos.length} pedido(s)`;
  const pendentes = pedidos.filter(p => p.status === 'pendente' || p.status === 'pago');
  if (pendEl) {
    pendEl.textContent = pendentes.length > 0 ? `${pendentes.length} aguardando envio` : '';
    pendEl.style.display = pendentes.length > 0 ? 'inline-block' : 'none';
  }

  if (pedidos.length === 0) {
    lista.innerHTML = '<div class="empty-state"><p>Nenhum pedido encontrado.</p></div>'; return;
  }

  lista.innerHTML = pedidos.map(p => {
    let itens = [];
    try { itens = typeof p.itens === 'string' ? JSON.parse(p.itens) : (p.itens || []); } catch(e) {}
    const data_fmt = new Date(p.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const statusMap = {
      pendente:  { label: 'Pendente',   cls: 'status-pendente' },
      pago:      { label: 'Pago ✓',     cls: 'status-pago' },
      enviado:   { label: 'Enviado ✈',  cls: 'status-enviado' },
      entregue:  { label: 'Entregue',   cls: 'status-entregue' },
      cancelado: { label: 'Cancelado',  cls: 'status-cancelado' },
    };
    const st = statusMap[p.status] || { label: p.status || 'Pendente', cls: 'status-pendente' };

    return '<div class="pedido-card" id="pedido-' + p.id + '">' +
      '<div class="pedido-header">' +
        '<div class="pedido-id">' +
          '<span class="pedido-num">#' + String(p.id).slice(0, 8).toUpperCase() + '</span>' +
          '<span class="pedido-data">' + data_fmt + '</span>' +
        '</div>' +
        '<span class="status-badge ' + st.cls + '">' + st.label + '</span>' +
      '</div>' +
      '<div class="pedido-body">' +
        '<div class="pedido-comprador">' +
          '<p class="ped-nome">' + (p.nome || '—') + '</p>' +
          '<p class="ped-info">✉ ' + (p.email || '—') + '</p>' +
          '<p class="ped-info">📱 ' + (p.telefone || '—') + '</p>' +
          '<p class="ped-info">🪪 ' + (p.cpf || '—') + '</p>' +
          (p.cep ? '<p class="ped-info">📍 ' + [p.rua, p.numero, p.complemento, p.bairro].filter(Boolean).join(', ') + (p.cidade ? ' — ' + p.cidade + '/' + p.uf : '') + '</p>' : '') +
          (p.referencia ? '<p class="ped-info">🗺 Ref: ' + p.referencia + '</p>' : '') +
          '<p class="ped-info" style="font-size:11px;color:#bbb">CEP: ' + (p.cep || '—') + '</p>' +
        '</div>' +
        '<div class="pedido-itens">' +
          itens.map(function(i) {
            return '<div class="ped-item">' +
              (i.imagem ? '<img src="' + i.imagem + '" alt="' + i.nome + '">' : '') +
              '<div><p>' + i.nome + '</p><p class="ped-qtd">' + i.qtd + '× R$ ' + Number(i.preco).toFixed(2) + '</p></div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div class="pedido-valores">' +
          '<p class="ped-total-label">Total</p>' +
          '<p class="ped-total-val">R$ ' + Number(p.total || 0).toFixed(2) + '</p>' +
          '<p class="ped-metodo">' + (p.metodo === 'pix' ? '🔳 PIX' : '💳 Cartão') + '</p>' +
        '</div>' +
      '</div>' +
      '<div class="pedido-footer">' +
        '<select class="status-select" onchange="atualizarStatus(\'' + p.id + '\', this.value)">' +
          '<option value="pendente"'  + (p.status === 'pendente'  ? ' selected' : '') + '>Pendente</option>' +
          '<option value="pago"'      + (p.status === 'pago'      ? ' selected' : '') + '>Pago</option>' +
          '<option value="enviado"'   + (p.status === 'enviado'   ? ' selected' : '') + '>Enviado</option>' +
          '<option value="entregue"'  + (p.status === 'entregue'  ? ' selected' : '') + '>Entregue</option>' +
          '<option value="cancelado"' + (p.status === 'cancelado' ? ' selected' : '') + '>Cancelado</option>' +
        '</select>' +
        (p.telefone ? '<a class="btn-wpp" href="https://wa.me/55' + p.telefone.replace(/\D/g, '') + '" target="_blank">WhatsApp</a>' : '') +
        '<button class="btn-delete" style="margin-left:auto" onclick="deletarPedido(\'' + p.id + '\', this)">Excluir pedido</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

async function atualizarStatus(id, status) {
  await window.db.from("pedidos").update({ status }).eq("id", id);
  carregarPedidos();
}

async function deletarPedido(id, btn) {
  const ok = await confirmar("Excluir este pedido permanentemente?");
  if (!ok) return;
  btn.textContent = '...'; btn.disabled = true;
  await window.db.from("pedidos").delete().eq("id", id);
  carregarPedidos();
}

document.getElementById("filtroPedidos")?.addEventListener("change", () => carregarPedidos());

// ── Banner do Login ───────────────────────────────────────
const dropBannerLogin      = document.getElementById("dropBannerLogin");
const inputBannerLogin     = document.getElementById("bannerLoginImagem");
const bannerLoginPreview   = document.getElementById("bannerLoginPreview");
const dropBannerLoginInner = document.getElementById("dropBannerLoginInner");

dropBannerLogin?.addEventListener("click", () => inputBannerLogin.click());
inputBannerLogin?.addEventListener("change", () => mostrarPreview(inputBannerLogin.files[0], bannerLoginPreview, dropBannerLoginInner));

async function carregarBannerLogin() {
  const el = document.getElementById("banner-login-atual");
  if (!el) return;
  try {
    const { data } = await window.db
      .from("banner_login")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data?.imagem) {
      el.innerHTML = `
        <img src="${data.imagem}" alt="Banner atual"
             style="width:100%;max-width:320px;border-radius:4px;display:block;">
        <p style="font-size:11px;color:var(--gray);margin-top:8px;letter-spacing:.3px;">
          Adicionado em ${new Date(data.created_at).toLocaleDateString('pt-BR')}
        </p>`;
      return;
    }
  } catch(e) {}
  el.innerHTML = `<span style="font-size:13px;color:var(--gray);padding:20px;display:block;">
    Nenhum banner definido ainda. O fundo rosa padrão será exibido.
  </span>`;
}

document.querySelector('.nav-item[data-target="section-banner-login"]')?.addEventListener("click", () => {
  carregarBannerLogin();
});

document.getElementById("addBannerLogin")?.addEventListener("click", async () => {
  const file  = inputBannerLogin?.files[0];
  const btn   = document.getElementById("addBannerLogin");
  const texto = document.getElementById("bannerLoginTexto");

  if (!file) {
    setMsg("bannerLoginMsg", "Selecione uma imagem primeiro.", "error"); return;
  }

  btn.disabled = true; texto.textContent = "Enviando...";

  try {
    const imagem = await uploadImagem(file);

    await window.db.from("banner_login").insert([{ imagem }]);

    setMsg("bannerLoginMsg", "✓ Banner do login atualizado com sucesso!", "success");
    carregarBannerLogin();

    inputBannerLogin.value = "";
    bannerLoginPreview.style.display = "none";
    dropBannerLoginInner.style.display = "block";

  } catch(err) {
    console.error(err);
    setMsg("bannerLoginMsg", "Erro ao salvar banner. Tente novamente.", "error");
  }

  btn.disabled = false; texto.textContent = "Salvar banner do login";
});

const style = document.createElement('style');
style.textContent = '@keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:0.8} }';
document.head.appendChild(style);
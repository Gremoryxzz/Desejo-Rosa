const ADMIN_EMAIL = "wallacegremory@gmail.com";

async function verificarLogin() {
  const { data } = await window.db.auth.getUser();
  const user = data.user;
  if (!user) { window.location.href = "login.html"; return; }
  if (user.email !== ADMIN_EMAIL) {
    alert("Acesso restrito ao administrador.");
    await window.db.auth.signOut();
    window.location.href = "login.html";
    return;
  }
  carregarProdutos();
  carregarPedidos();
}
verificarLogin();

document.getElementById("logout")?.addEventListener("click", async () => {
  await window.db.auth.signOut();
  window.location.href = "login.html";
});

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

dropBanner?.addEventListener("click", () => inputBanner.click());
inputBanner?.addEventListener("change", () => mostrarPreview(inputBanner.files[0], bannerPreview, dropBannerInner));

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

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    const target = item.dataset.target;
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

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

document.getElementById("addBanner")?.addEventListener("click", async () => {
  const file = document.getElementById("bannerImagem").files[0];
  const titulo = document.getElementById("bannerTitulo").value;
  const subtitulo = document.getElementById("bannerSubtitulo").value;

  if (!file) { setMsg('bannerMsg', 'Selecione uma imagem para o banner.', 'error'); return; }

  const btn = document.getElementById("addBanner");
  const txt = document.getElementById("bannerTexto");
  btn.disabled = true; txt.textContent = "Enviando...";

  try {
    const imagem = await uploadImagem(file);
    await window.db.from("banners").insert([{ imagem, titulo, subtitulo }]);
    setMsg('bannerMsg', '✓ Banner adicionado com sucesso!', 'success');
    document.getElementById("bannerTitulo").value = '';
    document.getElementById("bannerSubtitulo").value = '';
    bannerPreview.style.display = 'none';
    dropBannerInner.style.display = 'block';
  } catch (err) {
    console.error(err);
    setMsg('bannerMsg', 'Erro ao enviar banner. Tente novamente.', 'error');
  }
  btn.disabled = false; txt.textContent = "Adicionar Banner";
});

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
  if (!confirm("Remover este produto?")) return;
  btn.textContent = '...'; btn.disabled = true;
  await window.db.from("produtos").delete().eq("id", id);
  carregarProdutos();
}

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
      '</div>' +
    '</div>';
  }).join('');
}

async function atualizarStatus(id, status) {
  await window.db.from("pedidos").update({ status }).eq("id", id);
  carregarPedidos();
}

document.getElementById("filtroPedidos")?.addEventListener("change", () => carregarPedidos());

const style = document.createElement('style');
style.textContent = '@keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:0.8} }';
document.head.appendChild(style);
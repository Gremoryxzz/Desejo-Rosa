const ADMIN_EMAIL = "wallacegremory@gmail.com";

// ─── PROTEÇÃO ───
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
}

verificarLogin();

// ─── LOGOUT ───
document.getElementById("logout")?.addEventListener("click", async () => {
  await window.db.auth.signOut();
  window.location.href = "login.html";
});

// ─── FILE DROP — PRODUTO ───
const dropZona = document.getElementById("dropZona");
const inputImagem = document.getElementById("imagem");
const preview = document.getElementById("preview");
const dropInner = document.getElementById("dropInner");

dropZona?.addEventListener("click", () => inputImagem.click());
inputImagem?.addEventListener("change", () => mostrarPreview(inputImagem.files[0], preview, dropInner));

dropZona?.addEventListener("dragover", e => { e.preventDefault(); dropZona.style.borderColor = 'var(--rose)'; });
dropZona?.addEventListener("dragleave", () => { dropZona.style.borderColor = ''; });
dropZona?.addEventListener("drop", e => {
  e.preventDefault();
  dropZona.style.borderColor = '';
  const file = e.dataTransfer.files[0];
  if (file) { inputImagem.files = e.dataTransfer.files; mostrarPreview(file, preview, dropInner); }
});

// ─── FILE DROP — BANNER ───
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

// ─── SIDEBAR NAV ───
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    const target = item.dataset.target;
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// ─── UPLOAD CLOUDINARY ───
async function uploadImagem(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "unsigned_preset");
  const res = await fetch("https://api.cloudinary.com/v1_1/Dazsfbixz/image/upload", {
    method: "POST", body: formData
  });
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

// ─── ADICIONAR PRODUTO ───
document.getElementById("add")?.addEventListener("click", async () => {
  const nome = document.getElementById("nome").value.trim();
  const precoInput = document.getElementById("preco").value.trim();
  const categoria = document.getElementById("categoria").value;
  const file = document.getElementById("imagem").files[0];
  const preco = Number(precoInput.replace(",", "."));

  if (!nome || !preco || !file) {
    setMsg('addMsg', 'Preencha todos os campos e selecione uma imagem.', 'error'); return;
  }

  const btn = document.getElementById("add");
  const txt = document.getElementById("addTexto");
  btn.disabled = true; txt.textContent = "Enviando...";

  try {
    const imagem = await uploadImagem(file);
    await window.db.from("produtos").insert([{ nome, preco, imagem, categoria }]);
    setMsg('addMsg', '✓ Produto adicionado com sucesso!', 'success');
    // Reset
    document.getElementById("nome").value = '';
    document.getElementById("preco").value = '';
    preview.style.display = 'none';
    dropInner.style.display = 'block';
    carregarProdutos();
  } catch (err) {
    console.error(err);
    setMsg('addMsg', 'Erro ao cadastrar produto. Tente novamente.', 'error');
  }

  btn.disabled = false; txt.textContent = "Adicionar Produto";
});

// ─── ADICIONAR BANNER ───
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

// ─── LISTAR PRODUTOS ───
async function carregarProdutos() {
  const lista = document.getElementById("listaAdmin");
  const total = document.getElementById("totalProdutos");
  if (!lista) return;

  lista.innerHTML = `<div class="skeleton" style="height:80px;border-radius:4px;margin-bottom:12px;background:var(--rose-pale);animation:shimmer 1.5s infinite;"></div>`.repeat(3);

  const { data } = await window.db
    .from("produtos")
    .select("*")
    .order("created_at", { ascending: false });

  if (total) total.textContent = `${data?.length || 0} produto(s) cadastrado(s)`;

  if (!data || data.length === 0) {
    lista.innerHTML = `<div class="empty-state"><p>Nenhum produto cadastrado ainda.</p></div>`;
    return;
  }

  lista.innerHTML = data.map(p => {
    const catLabel = { lancamento: 'Lançamento', novidade: 'Novidade', outro: 'Produto' };
    return `
      <div class="admin-card">
        <img src="${p.imagem}" alt="${p.nome}">
        <div class="admin-info">
          <p class="p-nome">${p.nome}</p>
          <p class="p-preco">R$ ${Number(p.preco).toFixed(2)}</p>
        </div>
        <span class="admin-cat">${catLabel[p.categoria] || p.categoria}</span>
        <button class="btn-delete" onclick="deletarProduto('${p.id}', this)">Remover</button>
      </div>`;
  }).join('');
}

async function deletarProduto(id, btn) {
  if (!confirm("Remover este produto?")) return;
  btn.textContent = '...';
  btn.disabled = true;
  await window.db.from("produtos").delete().eq("id", id);
  carregarProdutos();
}

// shimmer animation
const style = document.createElement('style');
style.textContent = `@keyframes shimmer { 0%,100%{opacity:0.4} 50%{opacity:0.8} }`;
document.head.appendChild(style);

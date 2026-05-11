// ============================================================
//  Desejo Rosa — minha-conta.js
// ============================================================

const ADMIN_EMAIL = "wallacegremory@gmail.com";
let usuarioAtual = null;

async function init() {
  const { data } = await window.db.auth.getSession();
  if (!data.session) { window.location.href = "cliente-login.html"; return; }
  usuarioAtual = data.session.user;
  if (usuarioAtual.email === ADMIN_EMAIL) { window.location.href = "admin.html"; return; }
  carregarPerfil();
  carregarPedidos();
}
init();

function carregarPerfil() {
  const nome  = usuarioAtual.user_metadata?.nome || usuarioAtual.email.split("@")[0];
  const email = usuarioAtual.email;
  document.getElementById("mc-avatar").textContent = nome.charAt(0).toUpperCase();
  document.getElementById("mc-nome").textContent   = nome;
  document.getElementById("mc-email").textContent  = email;
  document.getElementById("dados-nome").value      = nome;
  document.getElementById("dados-email").value     = email;
}

async function carregarPedidos() {
  const lista   = document.getElementById("lista-pedidos");
  const totalEl = document.getElementById("total-pedidos");
  const extEl   = document.getElementById("extrato-valor");

  lista.innerHTML = '<div class="skeleton"></div>'.repeat(3);

  const { data: pedidos } = await window.db
    .from("pedidos").select("*")
    .eq("email", usuarioAtual.email)
    .order("created_at", { ascending: false });

  const p = pedidos || [];
  const totalGasto = p.reduce((acc, ped) => acc + Number(ped.total || 0), 0);
  if (extEl) extEl.textContent = `R$ ${fmt(totalGasto)}`;
  if (totalEl) totalEl.textContent = `${p.length} pedido(s)`;

  if (p.length === 0) {
    lista.innerHTML = `
      <div class="mc-vazio">
        <span class="mc-vazio-icon">◌</span>
        <p>Você ainda não fez nenhum pedido.</p>
        <a href="index.html">Ver produtos</a>
      </div>`;
    return;
  }

  const statusMap = {
    pendente:  { label: 'Aguardando pagamento', cls: 'status-pendente',  icon: '⏳' },
    pago:      { label: 'Pagamento confirmado', cls: 'status-pago',      icon: '✅' },
    enviado:   { label: 'Enviado / Em trânsito',cls: 'status-enviado',   icon: '✈️' },
    entregue:  { label: 'Entregue',             cls: 'status-entregue',  icon: '🎉' },
    cancelado: { label: 'Cancelado',            cls: 'status-cancelado', icon: '✕'  },
  };

  lista.innerHTML = p.map(ped => {
    let itens = [];
    try { itens = typeof ped.itens === 'string' ? JSON.parse(ped.itens) : (ped.itens || []); } catch(e) {}
    const st = statusMap[ped.status] || statusMap.pendente;
    const data_fmt = new Date(ped.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    const etapas = ['pendente','pago','enviado','entregue'];
    const idx    = etapas.indexOf(ped.status);
    const progressBar = ped.status !== 'cancelado' ? `
      <div class="ped-progresso">
        <div class="progresso-etapas">
          ${['Pedido','Pago','Enviado','Entregue'].map((label, i) => `
            ${i > 0 ? `<div class="etapa-linha ${idx >= i ? 'ativa' : ''}"></div>` : ''}
            <div class="etapa ${idx >= i ? 'ativa' : ''}">
              <span class="etapa-dot"></span>
              <span class="etapa-label">${label}</span>
            </div>
          `).join('')}
        </div>
      </div>` : '';

    return `
      <div class="pedido-cliente">
        <div class="ped-cliente-header">
          <div>
            <p class="ped-cliente-num">#${String(ped.id).slice(0,8).toUpperCase()}</p>
            <p class="ped-cliente-data">${data_fmt}</p>
          </div>
          <span class="status-badge ${st.cls}">${st.icon} ${st.label}</span>
        </div>
        ${progressBar}
        <div class="ped-cliente-body">
          <div class="ped-cliente-itens">
            ${itens.map(i => `
              <div class="ped-item-linha">
                ${i.imagem ? `<img src="${i.imagem}" alt="${i.nome}">` : ''}
                <div><p>${i.nome}</p><small>${i.qtd}× R$ ${Number(i.preco).toFixed(2)}</small></div>
              </div>`).join('')}
          </div>
          <div class="ped-cliente-total">
            <p class="ped-total-label">Total</p>
            <p class="ped-total-val">R$ ${fmt(ped.total || 0)}</p>
            <p class="ped-metodo">${ped.metodo === 'pix' ? '🔳 PIX' : '💳 Cartão'}</p>
            ${ped.cep ? `<p class="ped-endereco">📍 ${[ped.rua, ped.numero].filter(Boolean).join(', ')}<br>${ped.cidade}/${ped.uf}</p>` : ''}
          </div>
        </div>
      </div>`;
  }).join('');
}

document.getElementById("btn-salvar-dados")?.addEventListener("click", async () => {
  const nome  = document.getElementById("dados-nome").value.trim();
  const senha = document.getElementById("dados-senha").value;
  const msgEl = document.getElementById("dados-msg");
  const btn   = document.getElementById("btn-salvar-dados");
  btn.disabled = true; btn.textContent = "Salvando...";
  try {
    const updates = { data: { nome } };
    if (senha) {
      if (senha.length < 6) {
        msgEl.textContent = "A senha precisa ter pelo menos 6 caracteres.";
        msgEl.style.color = "#c53030"; msgEl.style.display = "block";
        btn.disabled = false; btn.textContent = "Salvar alterações"; return;
      }
      updates.password = senha;
    }
    await window.db.auth.updateUser(updates);
    document.getElementById("mc-nome").textContent   = nome;
    document.getElementById("mc-avatar").textContent = nome.charAt(0).toUpperCase();
    msgEl.textContent = "✓ Dados atualizados!";
    msgEl.style.color = "#276749"; msgEl.style.display = "block";
    document.getElementById("dados-senha").value = "";
    setTimeout(() => msgEl.style.display = "none", 3000);
  } catch(e) {
    msgEl.textContent = "Erro ao salvar."; msgEl.style.color = "#c53030"; msgEl.style.display = "block";
  }
  btn.disabled = false; btn.textContent = "Salvar alterações";
});

document.getElementById("btnSair")?.addEventListener("click", async () => {
  await window.db.auth.signOut();
  window.location.href = "index.html";
});

document.querySelectorAll(".mc-menu-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".mc-menu-item").forEach(i => i.classList.remove("ativo"));
    document.querySelectorAll(".mc-tab").forEach(t => t.classList.remove("ativo"));
    item.classList.add("ativo");
    document.getElementById(`tab-${item.dataset.tab}`)?.classList.add("ativo");
  });
});

function fmt(v) {
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
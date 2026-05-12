// ============================================================
//  Desejo Rosa — header.js
//  Topo global: logo clicável + sessão persistente
//  Inclua DEPOIS do supabase.js em todas as páginas
// ============================================================

const ADMIN_EMAIL = "wallacegremory@gmail.com";

// ── Insere o header dinamicamente em qualquer página ─────────
// Chame injetarHeader(tipo) onde tipo pode ser:
//   "home"    → header fixo translúcido (index.html)
//   "loja"    → header branco simples (carrinho, produto, etc.)
//   "admin"   → header do painel admin
//   "login"   → sem header (páginas de login/cadastro)

function injetarHeader(tipo = "loja") {
  if (tipo === "login") return; // páginas de login não têm header

  const LOGO_SRC = "topo.png"; // caminho relativo — ajuste se necessário

  if (tipo === "home") {
    // O index.html já tem o header no HTML; apenas injeta o carrinho + atualiza sessão
    _injetarCarrinhoHome();
    _verificarSessaoHome();
    return;
  }

  if (tipo === "admin") {
    // O admin.html tem header próprio; apenas configura o logout
    _configurarLogoutAdmin();
    return;
  }

  // ── header "loja" (carrinho, produto, minha-conta) ──────────
  // Cria um header branco padronizado no topo da página
  const existente = document.getElementById("dr-header-global");
  if (existente) { _verificarSessaoLoja(); return; }

  const h = document.createElement("header");
  h.id = "dr-header-global";
  h.style.cssText = `
    display:flex; align-items:center; justify-content:space-between;
    padding:0 48px; height:68px;
    background:#fff; border-bottom:1px solid rgba(200,80,110,.12);
    position:sticky; top:0; z-index:100;
  `;
  h.innerHTML = `
    <a href="index.html" style="display:flex;align-items:center;text-decoration:none;">
      <img src="${LOGO_SRC}" alt="Desejo Rosa" style="height:36px;border-radius:4px;display:block;">
    </a>
    <div id="dr-nav-right" style="display:flex;align-items:center;gap:16px;"></div>
  `;
  document.body.insertBefore(h, document.body.firstChild);
  _verificarSessaoLoja();
}

// ── Sessão: home (index.html) ────────────────────────────────
function _injetarCarrinhoHome() {
  const navRight = document.querySelector(".nav-right");
  if (!navRight || document.getElementById("carrinho-link")) return;

  const link = document.createElement("a");
  link.href = "carrinho.html";
  link.id = "carrinho-link";
  link.style.cssText = "position:relative;display:flex;align-items:center;color:#1a1218;text-decoration:none;";
  link.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
    <span id="carrinho-badge" style="
      position:absolute;top:-8px;right:-8px;
      background:#c8506e;color:#fff;font-size:10px;
      width:18px;height:18px;border-radius:50%;
      display:none;align-items:center;justify-content:center;
      font-family:'Jost',sans-serif;font-weight:500;
    ">0</span>
  `;
  navRight.insertBefore(link, navRight.firstChild);
}

async function _verificarSessaoHome() {
  try {
    const { data } = await window.db.auth.getSession();
    const btn = document.getElementById("btn-login-header");
    if (!btn) return;

    if (data.session) {
      const user  = data.session.user;
      const email = user.email;
      if (email === ADMIN_EMAIL) {
        // Admin: botão "Painel"
        btn.textContent = "Painel";
        btn.href = "admin.html";
        btn.title = "Ir para o painel administrativo";
        return;
      }
      const nome = user.user_metadata?.nome || email.split("@")[0];
      btn.textContent = nome.split(" ")[0];
      btn.href = "minha-conta.html";
      btn.title = "Minha conta";

      const navRight = btn.parentElement;
      if (!document.getElementById("btn-sair-header")) {
        const sair = document.createElement("button");
        sair.id = "btn-sair-header";
        sair.textContent = "Sair";
        sair.style.cssText = `
          background:transparent;border:1px solid rgba(200,80,110,.4);
          color:var(--rose,#c8506e);font-family:'Jost',sans-serif;
          font-size:11px;font-weight:500;letter-spacing:1.2px;
          text-transform:uppercase;padding:7px 14px;
          border-radius:2px;cursor:pointer;transition:all .2s;
        `;
        sair.onmouseenter = () => { sair.style.background="var(--rose,#c8506e)"; sair.style.color="#fff"; };
        sair.onmouseleave = () => { sair.style.background="transparent"; sair.style.color="var(--rose,#c8506e)"; };
        sair.addEventListener("click", async () => {
          await window.db.auth.signOut();
          window.location.href = "index.html";
        });
        navRight.appendChild(sair);
      }
    }
  } catch(e) { console.warn("header.js sessão:", e); }
}

// ── Sessão: páginas de loja (carrinho, produto, etc.) ────────
async function _verificarSessaoLoja() {
  const nav = document.getElementById("dr-nav-right");
  if (!nav) return;

  // Ícone carrinho
  const carrinhoLink = document.createElement("a");
  carrinhoLink.href = "carrinho.html";
  carrinhoLink.id = "carrinho-link";
  carrinhoLink.style.cssText = "position:relative;display:flex;align-items:center;color:#1a1218;text-decoration:none;";
  carrinhoLink.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 01-8 0"/>
    </svg>
    <span id="carrinho-badge" style="
      position:absolute;top:-8px;right:-8px;
      background:#c8506e;color:#fff;font-size:10px;
      width:18px;height:18px;border-radius:50%;
      display:none;align-items:center;justify-content:center;
      font-family:'Jost',sans-serif;font-weight:500;
    ">0</span>
  `;
  nav.appendChild(carrinhoLink);

  try {
    const { data } = await window.db.auth.getSession();
    if (data.session) {
      const user  = data.session.user;
      const email = user.email;

      if (email === ADMIN_EMAIL) {
        const btnAdmin = document.createElement("a");
        btnAdmin.href = "admin.html";
        btnAdmin.textContent = "Painel";
        btnAdmin.style.cssText = _estiloBtn();
        nav.appendChild(btnAdmin);
      } else {
        const nome = user.user_metadata?.nome || email.split("@")[0];
        const btnConta = document.createElement("a");
        btnConta.href = "minha-conta.html";
        btnConta.textContent = nome.split(" ")[0];
        btnConta.title = "Minha conta";
        btnConta.style.cssText = _estiloBtn();
        nav.appendChild(btnConta);
      }

      const btnSair = document.createElement("button");
      btnSair.textContent = "Sair";
      btnSair.style.cssText = `
        background:transparent;border:1px solid rgba(200,80,110,.4);
        color:#c8506e;font-family:'Jost',sans-serif;
        font-size:11px;font-weight:500;letter-spacing:1.2px;
        text-transform:uppercase;padding:7px 14px;
        border-radius:2px;cursor:pointer;transition:all .2s;
      `;
      btnSair.onmouseenter = () => { btnSair.style.background="#c8506e"; btnSair.style.color="#fff"; };
      btnSair.onmouseleave = () => { btnSair.style.background="transparent"; btnSair.style.color="#c8506e"; };
      btnSair.addEventListener("click", async () => {
        await window.db.auth.signOut();
        window.location.href = "index.html";
      });
      nav.appendChild(btnSair);
    } else {
      const btnLogin = document.createElement("a");
      btnLogin.href = "cliente-login.html";
      btnLogin.textContent = "Entrar";
      btnLogin.style.cssText = _estiloBtn();
      nav.appendChild(btnLogin);
    }
  } catch(e) { console.warn("header.js sessão loja:", e); }
}

// ── Admin: apenas mantém logout funcionando ──────────────────
function _configurarLogoutAdmin() {
  // O admin.html já tem botão logout; nada extra necessário
  // Mas garantimos que o clique funcione
  document.getElementById("logout")?.addEventListener("click", async () => {
    await window.db.auth.signOut();
    window.location.href = "index.html";
  });
}

function _estiloBtn() {
  return `
    font-family:'Jost',sans-serif;font-size:12px;font-weight:500;
    letter-spacing:1.5px;text-transform:uppercase;
    color:#c8506e;text-decoration:none;
    border:1px solid #c8506e;padding:8px 20px;border-radius:2px;
    transition:all .3s;cursor:pointer;background:transparent;
  `;
}

// ── Persistência de sessão: redireciona se já logado ─────────
// Chame verificarSessaoAtiva(paginaAtual) nas páginas de login/cadastro
async function verificarSessaoAtiva(paginaAtual) {
  try {
    const { data } = await window.db.auth.getSession();
    if (!data.session) return;
    const email = data.session.user.email;
    if (paginaAtual === "login-admin") {
      if (email === ADMIN_EMAIL) window.location.href = "admin.html";
      return;
    }
    // login cliente / cadastro
    if (email === ADMIN_EMAIL) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "minha-conta.html";
    }
  } catch(e) {}
}

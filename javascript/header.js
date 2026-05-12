// ============================================================
//  Desejo Rosa — header.js
//  Topo global: logo clicável + sessão persistente
//  Inclua DEPOIS do supabase.js em todas as páginas
// ============================================================

const ADMIN_EMAIL = "wallacegremory@gmail.com";

// ── Insere o header dinamicamente em qualquer página ─────────
// Tipos:
//   "home"  → index.html (header já existe no HTML)
//   "loja"  → carrinho, produto, minha-conta
//   "admin" → painel admin (header já existe no HTML)
//   "login" → login, cadastro (injeta header minimalista)

function injetarHeader(tipo) {
  tipo = tipo || "loja";
  var LOGO_SRC = "topo.png";

  // ── home ──────────────────────────────────────────────────
  if (tipo === "home") {
    _injetarCarrinhoHome();
    _verificarSessaoHome();
    return;
  }

  // ── admin ─────────────────────────────────────────────────
  if (tipo === "admin") {
    _configurarLogoutAdmin();
    return;
  }

  // ── login / cadastro ──────────────────────────────────────
  if (tipo === "login") {
    if (document.getElementById("dr-header-global")) return;
    var hLogin = document.createElement("header");
    hLogin.id = "dr-header-global";
    hLogin.style.cssText =
      "display:flex;align-items:center;justify-content:space-between;" +
      "padding:0 48px;height:68px;background:#fff;" +
      "border-bottom:1px solid rgba(200,80,110,.12);" +
      "position:fixed;top:0;left:0;right:0;z-index:100;";
    hLogin.innerHTML =
      '<a href="index.html" style="display:flex;align-items:center;text-decoration:none;">' +
        '<img src="' + LOGO_SRC + '" alt="Desejo Rosa" style="height:36px;border-radius:4px;display:block;">' +
      '</a>' +
      '<a href="index.html" style="font-family:\'Jost\',sans-serif;font-size:12px;' +
        'color:#6b5c62;text-decoration:none;letter-spacing:.06em;" ' +
        'onmouseenter="this.style.color=\'#c8506e\'" onmouseleave="this.style.color=\'#6b5c62\'">' +
        '&larr; Voltar &agrave; loja' +
      '</a>';
    document.body.insertBefore(hLogin, document.body.firstChild);
    return;
  }

  // ── loja (carrinho, produto, minha-conta) ─────────────────
  if (document.getElementById("dr-header-global")) {
    _verificarSessaoLoja();
    return;
  }
  var hLoja = document.createElement("header");
  hLoja.id = "dr-header-global";
  hLoja.style.cssText =
    "display:flex;align-items:center;justify-content:space-between;" +
    "padding:0 48px;height:68px;background:#fff;" +
    "border-bottom:1px solid rgba(200,80,110,.12);" +
    "position:sticky;top:0;z-index:100;";
  hLoja.innerHTML =
    '<a href="index.html" style="display:flex;align-items:center;text-decoration:none;">' +
      '<img src="' + LOGO_SRC + '" alt="Desejo Rosa" style="height:36px;border-radius:4px;display:block;">' +
    '</a>' +
    '<div id="dr-nav-right" style="display:flex;align-items:center;gap:16px;"></div>';
  document.body.insertBefore(hLoja, document.body.firstChild);
  _verificarSessaoLoja();
}

// ── Carrinho na home ──────────────────────────────────────────
function _injetarCarrinhoHome() {
  var navRight = document.querySelector(".nav-right");
  if (!navRight || document.getElementById("carrinho-link")) return;

  var link = document.createElement("a");
  link.href = "carrinho.html";
  link.id = "carrinho-link";
  link.style.cssText = "position:relative;display:flex;align-items:center;color:#1a1218;text-decoration:none;";
  link.innerHTML =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"' +
      ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>' +
      '<line x1="3" y1="6" x2="21" y2="6"/>' +
      '<path d="M16 10a4 4 0 01-8 0"/>' +
    '</svg>' +
    '<span id="carrinho-badge" style="' +
      'position:absolute;top:-8px;right:-8px;' +
      'background:#c8506e;color:#fff;font-size:10px;' +
      'width:18px;height:18px;border-radius:50%;' +
      'display:none;align-items:center;justify-content:center;' +
      'font-family:Jost,sans-serif;font-weight:500;">0</span>';
  navRight.insertBefore(link, navRight.firstChild);
}

async function _verificarSessaoHome() {
  try {
    var res = await window.db.auth.getSession();
    var btn = document.getElementById("btn-login-header");
    if (!btn) return;

    if (res.data.session) {
      var user  = res.data.session.user;
      var email = user.email;

      if (email === ADMIN_EMAIL) {
        btn.textContent = "Painel";
        btn.href = "admin.html";
        btn.title = "Ir para o painel administrativo";
        return;
      }

      var nome = (user.user_metadata && user.user_metadata.nome) || email.split("@")[0];
      btn.textContent = nome.split(" ")[0];
      btn.href = "minha-conta.html";
      btn.title = "Minha conta";

      var navRight = btn.parentElement;
      if (!document.getElementById("btn-sair-header")) {
        var sair = document.createElement("button");
        sair.id = "btn-sair-header";
        sair.textContent = "Sair";
        sair.style.cssText =
          "background:transparent;border:1px solid rgba(200,80,110,.4);" +
          "color:var(--rose,#c8506e);font-family:Jost,sans-serif;" +
          "font-size:11px;font-weight:500;letter-spacing:1.2px;" +
          "text-transform:uppercase;padding:7px 14px;" +
          "border-radius:2px;cursor:pointer;transition:all .2s;";
        sair.onmouseenter = function() {
          sair.style.background = "var(--rose,#c8506e)";
          sair.style.color = "#fff";
        };
        sair.onmouseleave = function() {
          sair.style.background = "transparent";
          sair.style.color = "var(--rose,#c8506e)";
        };
        sair.addEventListener("click", async function() {
          await window.db.auth.signOut();
          window.location.href = "index.html";
        });
        navRight.appendChild(sair);
      }
    }
  } catch(e) { console.warn("header.js sessão home:", e); }
}

// ── Sessão nas páginas de loja ────────────────────────────────
async function _verificarSessaoLoja() {
  var nav = document.getElementById("dr-nav-right");
  if (!nav) return;

  var carrinhoLink = document.createElement("a");
  carrinhoLink.href = "carrinho.html";
  carrinhoLink.id = "carrinho-link";
  carrinhoLink.style.cssText = "position:relative;display:flex;align-items:center;color:#1a1218;text-decoration:none;";
  carrinhoLink.innerHTML =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"' +
      ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>' +
      '<line x1="3" y1="6" x2="21" y2="6"/>' +
      '<path d="M16 10a4 4 0 01-8 0"/>' +
    '</svg>' +
    '<span id="carrinho-badge" style="' +
      'position:absolute;top:-8px;right:-8px;' +
      'background:#c8506e;color:#fff;font-size:10px;' +
      'width:18px;height:18px;border-radius:50%;' +
      'display:none;align-items:center;justify-content:center;' +
      'font-family:Jost,sans-serif;font-weight:500;">0</span>';
  nav.appendChild(carrinhoLink);

  try {
    var res = await window.db.auth.getSession();
    if (res.data.session) {
      var user  = res.data.session.user;
      var email = user.email;

      if (email === ADMIN_EMAIL) {
        var btnAdmin = document.createElement("a");
        btnAdmin.href = "admin.html";
        btnAdmin.textContent = "Painel";
        btnAdmin.style.cssText = _estiloBtn();
        nav.appendChild(btnAdmin);
      } else {
        var nome = (user.user_metadata && user.user_metadata.nome) || email.split("@")[0];
        var btnConta = document.createElement("a");
        btnConta.href = "minha-conta.html";
        btnConta.textContent = nome.split(" ")[0];
        btnConta.title = "Minha conta";
        btnConta.style.cssText = _estiloBtn();
        nav.appendChild(btnConta);
      }

      var btnSair = document.createElement("button");
      btnSair.textContent = "Sair";
      btnSair.style.cssText =
        "background:transparent;border:1px solid rgba(200,80,110,.4);" +
        "color:#c8506e;font-family:Jost,sans-serif;" +
        "font-size:11px;font-weight:500;letter-spacing:1.2px;" +
        "text-transform:uppercase;padding:7px 14px;" +
        "border-radius:2px;cursor:pointer;transition:all .2s;";
      btnSair.onmouseenter = function() {
        btnSair.style.background = "#c8506e";
        btnSair.style.color = "#fff";
      };
      btnSair.onmouseleave = function() {
        btnSair.style.background = "transparent";
        btnSair.style.color = "#c8506e";
      };
      btnSair.addEventListener("click", async function() {
        await window.db.auth.signOut();
        window.location.href = "index.html";
      });
      nav.appendChild(btnSair);

    } else {
      var btnLogin = document.createElement("a");
      btnLogin.href = "cliente-login.html";
      btnLogin.textContent = "Entrar";
      btnLogin.style.cssText = _estiloBtn();
      nav.appendChild(btnLogin);
    }
  } catch(e) { console.warn("header.js sessão loja:", e); }
}

// ── Admin: configura logout ───────────────────────────────────
function _configurarLogoutAdmin() {
  var btnLogout = document.getElementById("logout");
  if (btnLogout) {
    btnLogout.addEventListener("click", async function() {
      await window.db.auth.signOut();
      window.location.href = "index.html";
    });
  }
}

function _estiloBtn() {
  return (
    "font-family:Jost,sans-serif;font-size:12px;font-weight:500;" +
    "letter-spacing:1.5px;text-transform:uppercase;" +
    "color:#c8506e;text-decoration:none;" +
    "border:1px solid #c8506e;padding:8px 20px;border-radius:2px;" +
    "transition:all .3s;cursor:pointer;background:transparent;"
  );
}

// ── Redireciona se já logado (usar nas páginas de login) ──────
async function verificarSessaoAtiva(paginaAtual) {
  try {
    var res = await window.db.auth.getSession();
    if (!res.data.session) return;
    var email = res.data.session.user.email;
    if (paginaAtual === "login-admin") {
      if (email === ADMIN_EMAIL) window.location.href = "admin.html";
      return;
    }
    window.location.href = email === ADMIN_EMAIL ? "admin.html" : "minha-conta.html";
  } catch(e) {}
}
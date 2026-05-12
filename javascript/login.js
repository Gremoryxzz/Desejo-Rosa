// ============================================================
//  Desejo Rosa — login.js
//  Login do painel administrativo
//  Apenas o e-mail admin tem acesso
// ============================================================

// ADMIN_EMAIL já declarado em header.js — não redeclarar aqui

const btnLogin = document.getElementById("btnLogin");
const btnTexto = document.getElementById("btnTexto");
const erroEl   = document.getElementById("erro");

// Se já está logado como admin, vai direto para o painel
window.db.auth.getSession().then(({ data }) => {
  if (data.session && data.session.user.email === ADMIN_EMAIL) {
    window.location.href = "admin.html";
  }
});

btnLogin?.addEventListener("click", fazerLogin);

document.getElementById("senha")?.addEventListener("keydown", e => {
  if (e.key === "Enter") fazerLogin();
});

async function fazerLogin() {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

  erroEl.style.display = "none";

  if (!email || !senha) {
    mostrarErro("Preencha e-mail e senha."); return;
  }

  btnLogin.disabled    = true;
  btnTexto.textContent = "Entrando...";

  try {
    const { data, error } = await window.db.auth.signInWithPassword({
      email,
      password: senha
    });

    if (error) {
      mostrarErro("E-mail ou senha incorretos."); return;
    }

    // Bloqueia acesso se não for o admin
    if (data.user.email !== ADMIN_EMAIL) {
      await window.db.auth.signOut();
      mostrarErro("Acesso restrito. Esta área é exclusiva para administradores.");
      return;
    }

    window.location.href = "admin.html";

  } catch (e) {
    mostrarErro("Erro inesperado. Tente novamente.");
    console.error(e);
  } finally {
    btnLogin.disabled    = false;
    btnTexto.textContent = "Entrar";
  }
}

function mostrarErro(msg) {
  erroEl.textContent   = msg;
  erroEl.style.display = "block";
}
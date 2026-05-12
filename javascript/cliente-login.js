// ============================================================
//  Desejo Rosa — cliente-login.js
//  Login de cliente (usuário comum)
// ============================================================

// ADMIN_EMAIL já declarado em header.js — não redeclarar aqui

const btnLogin  = document.getElementById("btnLogin");
const btnTexto  = document.getElementById("btnTexto");
const erroEl    = document.getElementById("erro");
const sucessoEl = document.getElementById("sucesso");

// ── Se já está logado, redireciona ───────────────────────────
window.db.auth.getSession().then(({ data }) => {
  if (!data.session) return;
  const email = data.session.user.email;
  window.location.href = email === ADMIN_EMAIL ? "admin.html" : "index.html";
});

// ── Google OAuth ─────────────────────────────────────────────
document.getElementById("btnGoogle")?.addEventListener("click", async () => {
  await window.db.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/index.html" }
  });
});

// ── Login por e-mail ──────────────────────────────────────────
btnLogin?.addEventListener("click", fazerLogin);

document.getElementById("senha")?.addEventListener("keydown", e => {
  if (e.key === "Enter") fazerLogin();
});

async function fazerLogin() {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

  erroEl.style.display    = "none";
  sucessoEl.style.display = "none";

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
      if (error.message.includes("Email not confirmed")) {
        mostrarErro("Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.");
      } else if (error.message.includes("Invalid login")) {
        mostrarErro("E-mail ou senha incorretos.");
      } else {
        mostrarErro("Erro ao entrar. Tente novamente.");
      }
      return;
    }

    // Admin vai para o painel, cliente vai para a home
    if (data.user.email === ADMIN_EMAIL) {
      window.location.href = "admin.html";
    } else {
      window.location.href = "index.html";
    }

  } catch (e) {
    mostrarErro("Erro inesperado. Tente novamente.");
    console.error(e);
  } finally {
    btnLogin.disabled    = false;
    btnTexto.textContent = "Entrar";
  }
}

// ── Esqueceu a senha ──────────────────────────────────────────
document.getElementById("esqueceuSenha")?.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();

  erroEl.style.display    = "none";
  sucessoEl.style.display = "none";

  if (!email) {
    mostrarErro("Digite seu e-mail acima primeiro."); return;
  }

  try {
    const { error } = await window.db.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/index.html"
    });

    if (error) {
      mostrarErro("Não foi possível enviar o e-mail de recuperação.");
      return;
    }

    sucessoEl.textContent  = "✓ E-mail de recuperação enviado! Verifique sua caixa de entrada.";
    sucessoEl.style.display = "block";

  } catch (e) {
    mostrarErro("Erro inesperado. Tente novamente.");
  }
});

function mostrarErro(msg) {
  erroEl.textContent   = msg;
  erroEl.style.display = "block";
}
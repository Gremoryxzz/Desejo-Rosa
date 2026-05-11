// ============================================================
//  Desejo Rosa — cliente-login.js
// ============================================================

const btnLogin  = document.getElementById("btnLogin");
const btnTexto  = document.getElementById("btnTexto");
const erroEl    = document.getElementById("erro");
const sucessoEl = document.getElementById("sucesso");

// Se já está logado, vai para minha conta
window.db.auth.getSession().then(({ data }) => {
  if (data.session) window.location.href = "minha-conta.html";
});

btnLogin.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const senha  = document.getElementById("senha").value;

  erroEl.style.display = "none";

  if (!email || !senha) {
    mostrarErro("Preencha e-mail e senha."); return;
  }

  btnLogin.disabled    = true;
  btnTexto.textContent = "Entrando...";

  const { data, error } = await window.db.auth.signInWithPassword({ email, password: senha });

  if (error) {
    btnLogin.disabled    = false;
    btnTexto.textContent = "Entrar";
    mostrarErro("E-mail ou senha incorretos.");
    return;
  }

  // Verifica se é admin — se for, manda para admin
  const ADMIN_EMAIL = "wallacegremory@gmail.com";
  if (data.user.email === ADMIN_EMAIL) {
    window.location.href = "admin.html";
  } else {
    window.location.href = "minha-conta.html";
  }
});

// Esqueceu a senha
document.getElementById("esqueceuSenha")?.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  if (!email) { mostrarErro("Digite seu e-mail primeiro."); return; }

  await window.db.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + "/minha-conta.html"
  });

  sucessoEl.textContent  = "✓ E-mail de recuperação enviado! Verifique sua caixa de entrada.";
  sucessoEl.style.display = "block";
  erroEl.style.display   = "none";
});

// Enter
document.getElementById("senha").addEventListener("keydown", e => {
  if (e.key === "Enter") btnLogin.click();
});

function mostrarErro(msg) {
  erroEl.textContent   = msg;
  erroEl.style.display = "block";
}

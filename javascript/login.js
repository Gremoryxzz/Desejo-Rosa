const btnLogin = document.getElementById("btnLogin");
const btnTexto = document.getElementById("btnTexto");
const erroEl = document.getElementById("erro");

btnLogin.addEventListener("click", async () => {
  const email = document.getElementById("email").value.trim();
  const senha = document.getElementById("senha").value;

  if (!email || !senha) {
    mostrarErro("Preencha e-mail e senha.");
    return;
  }

  btnLogin.disabled = true;
  btnTexto.textContent = "Entrando...";
  erroEl.style.display = "none";

  const { data, error } = await window.db.auth.signInWithPassword({
    email,
    password: senha
  });

  if (error) {
    btnLogin.disabled = false;
    btnTexto.textContent = "Entrar";
    mostrarErro("E-mail ou senha incorretos.");
    return;
  }

  window.location.href = "admin.html";
});

// Enter key
document.getElementById("senha").addEventListener("keydown", (e) => {
  if (e.key === "Enter") btnLogin.click();
});

function mostrarErro(msg) {
  erroEl.textContent = msg;
  erroEl.style.display = "block";
}

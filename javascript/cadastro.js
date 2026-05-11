// ============================================================
//  Desejo Rosa — cadastro.js
// ============================================================

const btnCadastro = document.getElementById("btnCadastro");
const btnTexto    = document.getElementById("btnTexto");
const erroEl      = document.getElementById("erro");
const sucessoEl   = document.getElementById("sucesso");

btnCadastro.addEventListener("click", async () => {
  const nome     = document.getElementById("nome").value.trim();
  const email    = document.getElementById("email").value.trim();
  const senha    = document.getElementById("senha").value;
  const confirmar = document.getElementById("confirmar").value;

  erroEl.style.display    = "none";
  sucessoEl.style.display = "none";

  if (!nome || !email || !senha) {
    mostrarErro("Preencha todos os campos."); return;
  }
  if (senha.length < 6) {
    mostrarErro("A senha precisa ter pelo menos 6 caracteres."); return;
  }
  if (senha !== confirmar) {
    mostrarErro("As senhas não coincidem."); return;
  }

  btnCadastro.disabled = true;
  btnTexto.textContent = "Criando conta...";

  const { data, error } = await window.db.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome }
    }
  });

  if (error) {
    btnCadastro.disabled = false;
    btnTexto.textContent = "Criar conta";
    if (error.message.includes("already registered")) {
      mostrarErro("Este e-mail já está cadastrado. Faça login.");
    } else {
      mostrarErro("Erro ao criar conta. Tente novamente.");
    }
    return;
  }

  // Sucesso
  sucessoEl.textContent  = "✓ Conta criada! Verifique seu e-mail para confirmar o cadastro.";
  sucessoEl.style.display = "block";
  btnCadastro.disabled   = false;
  btnTexto.textContent   = "Criar conta";

  // Redireciona para login após 2s
  setTimeout(() => window.location.href = "cliente-login.html", 2500);
});

// Enter
document.getElementById("confirmar").addEventListener("keydown", e => {
  if (e.key === "Enter") btnCadastro.click();
});

function mostrarErro(msg) {
  erroEl.textContent   = msg;
  erroEl.style.display = "block";
}

// ============================================================
//  Desejo Rosa — cadastro.js
//  Criação de conta de cliente
// ============================================================

// ADMIN_EMAIL já declarado em header.js — não redeclarar aqui

// ── Google OAuth ─────────────────────────────────────────────
document.getElementById("btnGoogle")?.addEventListener("click", async () => {
  await window.db.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin + "/minha-conta.html" }
  });
});

// ── Se já está logado, redireciona ───────────────────────────
window.db.auth.getSession().then(({ data }) => {
  if (data.session) {
    const email = data.session.user.email;
    window.location.href = email === ADMIN_EMAIL ? "admin.html" : "minha-conta.html";
  }
});

// ── Máscaras ─────────────────────────────────────────────────
function msk(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", () => { el.value = fn(el.value); });
}

msk("cpf", v => {
  v = v.replace(/\D/g, "").slice(0, 11);
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})?/, (_, a, b, c, d) =>
    d ? `${a}.${b}.${c}-${d}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a);
});

msk("telefone", v => {
  v = v.replace(/\D/g, "").slice(0, 11);
  return v.replace(/(\d{2})(\d{5})(\d{4})?/, (_, a, b, c) =>
    c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a.length ? `(${a}` : "");
});

// ── Cadastro por e-mail ───────────────────────────────────────
const btnCadastro = document.getElementById("btnCadastro");
const btnTexto    = document.getElementById("btnTexto");
const erroEl      = document.getElementById("erro");
const confirBox   = document.getElementById("confirmacao-box");
const formEl      = document.getElementById("form-cadastro");

btnCadastro?.addEventListener("click", async () => {
  const nome      = document.getElementById("nome").value.trim();
  const sobrenome = document.getElementById("sobrenome").value.trim();
  const email     = document.getElementById("email").value.trim();
  const cpf       = document.getElementById("cpf").value.replace(/\D/g, "");
  const telefone  = document.getElementById("telefone").value;
  const nascimento= document.getElementById("nascimento").value;
  const senha     = document.getElementById("senha").value;
  const confirmar = document.getElementById("confirmar").value;

  erroEl.style.display = "none";

  // Validações
  if (!nome || !email || !senha) {
    mostrarErro("Preencha pelo menos nome, e-mail e senha."); return;
  }
  if (senha.length < 6) {
    mostrarErro("A senha precisa ter pelo menos 6 caracteres."); return;
  }
  if (senha !== confirmar) {
    mostrarErro("As senhas não coincidem."); return;
  }
  if (cpf && cpf.length !== 11) {
    mostrarErro("CPF inválido. Digite os 11 dígitos."); return;
  }

  btnCadastro.disabled = true;
  btnTexto.textContent = "Criando conta...";

  try {
    const { data, error } = await window.db.auth.signUp({
      email,
      password: senha,
      options: {
        data: {
          nome: sobrenome ? `${nome} ${sobrenome}` : nome,
          cpf,
          telefone,
          nascimento
        }
      }
    });

    if (error) {
      if (error.message.includes("already registered") || error.message.includes("already been registered")) {
        mostrarErro("Este e-mail já está cadastrado. Faça login.");
      } else if (error.message.includes("Password")) {
        mostrarErro("Senha muito fraca. Use pelo menos 6 caracteres.");
      } else {
        mostrarErro("Erro ao criar conta: " + error.message);
      }
      return;
    }

    // Supabase pode logar direto (sem confirmação de e-mail) ou exigir confirmação
    if (data.session) {
      // Logado direto — vai para minha conta
      window.location.href = "minha-conta.html";
    } else {
      // Precisa confirmar e-mail
      if (formEl) formEl.style.display = "none";
      if (confirBox) confirBox.style.display = "block";
    }

  } catch (e) {
    mostrarErro("Erro inesperado. Tente novamente.");
    console.error(e);
  } finally {
    btnCadastro.disabled = false;
    btnTexto.textContent = "Criar conta";
  }
});

// Enter no último campo
document.getElementById("confirmar")?.addEventListener("keydown", e => {
  if (e.key === "Enter") btnCadastro?.click();
});

function mostrarErro(msg) {
  erroEl.textContent   = msg;
  erroEl.style.display = "block";
}
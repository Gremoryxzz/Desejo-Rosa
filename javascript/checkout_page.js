// ============================================================
//  Bela Rosa — checkout_page.js
//  Lógica da página de checkout separada
// ============================================================

const BACKEND_URL = "https://fqsqkwcqqmfbpemftotj.supabase.co/functions/v1/criar-pagamento";

let _frete = -1;

document.addEventListener("DOMContentLoaded", () => {
  renderizarResumo();
  configurarCEP();
  configurarMetodos();
  configurarMascaras();
  document.getElementById("ck-btn-pagar").addEventListener("click", finalizarPedido);
});

// ── Resumo lateral ────────────────────────────────────────
function renderizarResumo() {
  const lista = document.getElementById("ck-itens-lista");
  const itens = Carrinho.getItens();

  if (itens.length === 0) {
    window.location.href = "carrinho.html";
    return;
  }

  lista.innerHTML = itens.map(i => `
    <div class="ck-item-resumo">
      <img src="${i.imagem || ''}" alt="${i.nome}" onerror="this.style.background='#e8e0d5'">
      <div class="ck-item-info">
        <p>${i.nome}</p>
        <small>${i.qtd}× R$ ${fmt(i.preco)}</small>
      </div>
      <span class="ck-item-preco">R$ ${fmt(i.preco * i.qtd)}</span>
    </div>`).join('');

  atualizarTotais();
}

function atualizarTotais() {
  const sub   = Carrinho.total();
  const frete = calcFrete(sub);

  document.getElementById("ck-subtotal").textContent = `R$ ${fmt(sub)}`;
  document.getElementById("ck-total").textContent    = `R$ ${fmt(sub + (frete > 0 ? frete : 0))}`;

  const freteEl = document.getElementById("ck-frete");
  if (frete === 0)       { freteEl.textContent = "Grátis ✓"; freteEl.style.color = "#2e7d32"; freteEl.className = ""; }
  else if (frete === -1) { freteEl.textContent = "Calcule abaixo"; freteEl.className = "frete-calc"; }
  else                   { freteEl.textContent = `R$ ${fmt(frete)}`; freteEl.style.color = ""; freteEl.className = ""; }
}

function calcFrete(sub) {
  if (sub >= 150) return 0;
  return _frete;
}

// ── CEP ───────────────────────────────────────────────────
function configurarCEP() {
  const input  = document.getElementById("ck-cep");
  const btn    = document.getElementById("ck-cep-btn");
  const info   = document.getElementById("ck-cep-info");
  const campos = document.getElementById("ck-endereco-campos");

  input.addEventListener("input", () => {
    let v = input.value.replace(/\D/g, "");
    if (v.length > 5) v = v.slice(0,5) + "-" + v.slice(5,8);
    input.value = v;
  });

  // Também dispara ao apertar Enter no campo
  input.addEventListener("keydown", e => { if (e.key === "Enter") btn.click(); });

  btn.addEventListener("click", async () => {
    const cep = input.value.replace(/\D/g, "");
    if (cep.length !== 8) { info.textContent = "CEP inválido. Digite os 8 dígitos."; return; }

    info.textContent = "Buscando endereço…";
    btn.disabled = true;
    btn.textContent = "…";

    try {
      const r    = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await r.json();

      if (data.erro) {
        info.textContent = "CEP não encontrado. Verifique e tente novamente.";
        campos.classList.remove("visivel");
        btn.disabled = false; btn.textContent = "Calcular";
        return;
      }

      // Preenche campos automaticamente
      document.getElementById("ck-rua").value    = data.logradouro || "";
      document.getElementById("ck-bairro").value = data.bairro     || "";
      document.getElementById("ck-cidade").value = data.localidade || "";
      document.getElementById("ck-uf").value     = data.uf         || "";

      // Mostra frete calculado
      _frete = 18.90;
      const sub = Carrinho.total();
      const freteTexto = sub >= 150 ? "✓ Frete grátis!" : `R$ ${fmt(_frete)} — Entrega via Correios`;
      info.innerHTML = `<strong>📍 ${data.logradouro ? data.logradouro + ', ' : ''}${data.bairro ? data.bairro + ' — ' : ''}${data.localidade}/${data.uf}</strong><br><span style="color:${sub>=150?'#2e7d32':'inherit'}">${freteTexto}</span>`;

      // Exibe os campos de endereço
      campos.classList.add("visivel");

      // Foca no número se rua veio preenchida
      setTimeout(() => document.getElementById("ck-numero").focus(), 100);

      atualizarTotais();
    } catch {
      info.textContent = "Erro ao buscar CEP. Verifique sua conexão.";
    }

    btn.disabled = false; btn.textContent = "Calcular";
  });
}

// ── Métodos ───────────────────────────────────────────────
function configurarMetodos() {
  document.querySelectorAll('input[name="pagamento"]').forEach(r => {
    r.addEventListener("change", () => {
      document.getElementById("campos-cartao").style.display =
        r.value === "cartao" ? "grid" : "none";
    });
  });
}

// ── Máscaras ──────────────────────────────────────────────
function configurarMascaras() {
  msk("ck-cpf", v => {
    v = v.replace(/\D/g,"").slice(0,11);
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})?/, (_,a,b,c,d) =>
      d ? `${a}.${b}.${c}-${d}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a);
  });
  msk("ck-tel", v => {
    v = v.replace(/\D/g,"").slice(0,11);
    return v.replace(/(\d{2})(\d{5})(\d{4})?/, (_,a,b,c) =>
      c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a.length ? `(${a}` : "");
  });
  msk("cc-num", v => v.replace(/\D/g,"").slice(0,16).replace(/(\d{4})/g,"$1 ").trim());
  msk("cc-val", v => { v=v.replace(/\D/g,"").slice(0,4); return v.length>2?v.slice(0,2)+"/"+v.slice(2):v; });
}
function msk(id, fn) {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", () => el.value = fn(el.value));
}

// ── Finalizar ─────────────────────────────────────────────
async function finalizarPedido() {
  const btn    = document.getElementById("ck-btn-pagar");
  const texto  = document.getElementById("ck-btn-texto");
  const metodo = document.querySelector('input[name="pagamento"]:checked').value;

  const nome  = document.getElementById("ck-nome").value.trim();
  const email = document.getElementById("ck-email").value.trim();
  const cpf   = document.getElementById("ck-cpf").value.replace(/\D/g,"");
  const tel   = document.getElementById("ck-tel").value.replace(/\D/g,"");
  const cep   = document.getElementById("ck-cep").value.replace(/\D/g,"");
  const cepInfo = document.getElementById("ck-cep-info").textContent;

  if (!nome || !email || cpf.length !== 11 || tel.length < 10) {
    Carrinho.mostrarToast("Preencha todos os dados corretamente."); return;
  }

  // Valida endereço
  const numero = document.getElementById("ck-numero")?.value.trim();
  const camposEnd = document.getElementById("ck-endereco-campos");
  if (camposEnd?.classList.contains("visivel") && !numero) {
    Carrinho.mostrarToast("Informe o número do endereço."); return;
  }

  const itens = Carrinho.getItens();
  if (!itens.length) return;

  const subtotal = Carrinho.total();
  const frete    = calcFrete(subtotal);
  const total    = subtotal + (frete > 0 ? frete : 0);

  btn.disabled = true;
  texto.innerHTML = '<span class="spinner"></span>';

  // Salvar pedido no Supabase
  try {
    const cidadeUF = cepInfo.split('—');
    const cidade   = cidadeUF[0]?.trim().split(', ').pop() || '';
    const uf       = cidadeUF[1]?.trim() || '';

    await window.db.from("pedidos").insert([{
      nome,
      email,
      cpf: document.getElementById("ck-cpf").value,
      telefone: document.getElementById("ck-tel").value,
      cep: document.getElementById("ck-cep").value,
      rua: document.getElementById("ck-rua")?.value || '',
      numero: document.getElementById("ck-numero")?.value || '',
      complemento: document.getElementById("ck-complemento")?.value || '',
      bairro: document.getElementById("ck-bairro")?.value || '',
      referencia: document.getElementById("ck-referencia")?.value || '',
      cidade: document.getElementById("ck-cidade")?.value || '',
      uf: document.getElementById("ck-uf")?.value || '',
      itens: JSON.stringify(itens),
      total,
      metodo,
      status: "pendente"
    }]);
  } catch(e) {
    console.warn("Erro ao salvar pedido:", e);
  }

  // Pagamento
  try {
    if (BACKEND_URL.includes("sua-funcao")) {
      await simularPagamento(metodo, total);
      return;
    }

    let body = { itens, total, comprador: { nome, email, cpf, tel }, metodo };

    if (metodo === "cartao") {
      const mp = new MercadoPago("APP_USR-f25455ff-d4d9-4038-82cc-df21f240c353", { locale: "pt-BR" });
      const cardToken = await mp.createCardToken({
        cardNumber: document.getElementById("cc-num").value.replace(/\s/g,""),
        cardholderName: document.getElementById("cc-nome").value,
        cardExpirationMonth: document.getElementById("cc-val").value.split("/")[0],
        cardExpirationYear: "20" + document.getElementById("cc-val").value.split("/")[1],
        securityCode: document.getElementById("cc-cvv").value
      });
      body.cardToken = cardToken.id;
      body.parcelas  = document.getElementById("cc-parcelas").value;
    }

    const res  = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${window.db.supabaseKey || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxc3Frd2NxcW1mYnBlbWZ0b3RqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4OTI4MDAsImV4cCI6MjA2MTQ2ODgwMH0.YoqDmooOrQKK2TohHd6kuA_pk68MTcW"}`
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (data.tipo === "pix") exibirPix(data);
    else exibirResultadoCartao(data);

  } catch(e) {
    Carrinho.mostrarToast("Erro ao processar. Tente novamente.");
    console.error(e);
  } finally {
    btn.disabled = false;
    texto.textContent = "Finalizar pedido";
  }
}

async function simularPagamento(metodo, total) {
  await new Promise(r => setTimeout(r, 1800));
  if (metodo === "pix") {
    exibirPix({
      qr_code_base64: null,
      codigo_copia_cola: "00020126580014br.gov.bcb.pix0136BELAROSA-DEMO-PIX5204000053039865802BR5925Bela Rosa Lingerie6008Sao Paulo62070503***6304DEMO",
      expiracao: new Date(Date.now() + 30*60*1000).toISOString()
    });
  } else {
    exibirResultadoCartao({ status: "approved", mensagem: "Pagamento aprovado! ✓ (simulação)" });
  }
  document.getElementById("ck-btn-pagar").disabled = false;
  document.getElementById("ck-btn-texto").textContent = "Finalizar pedido";
}

function exibirPix(data) {
  const res = document.getElementById("ck-pix-resultado");
  res.style.display = "block";

  const qrWrap = document.getElementById("ck-qr-code");
  if (data.qr_code_base64) {
    qrWrap.innerHTML = `<img src="data:image/png;base64,${data.qr_code_base64}" width="180" height="180" alt="QR PIX" style="border-radius:8px">`;
  } else {
    qrWrap.innerHTML = `<div style="width:180px;height:180px;background:#f8f5f0;border:2px dashed #c8a96e;display:flex;align-items:center;justify-content:center;border-radius:8px;font-size:11px;color:#888;text-align:center;padding:16px;line-height:1.5">QR Code aparece em produção</div>`;
  }

  document.getElementById("ck-pix-codigo").value = data.codigo_copia_cola || "";

  if (data.expiracao) {
    const exp = new Date(data.expiracao);
    document.getElementById("ck-pix-validade").textContent =
      `Válido até ${exp.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" })}`;
  }

  res.scrollIntoView({ behavior: "smooth", block: "nearest" });

  document.getElementById("ck-btn-copiar").onclick = () => {
    navigator.clipboard.writeText(document.getElementById("ck-pix-codigo").value)
      .then(() => Carrinho.mostrarToast("Código copiado!"));
  };
}

function exibirResultadoCartao(data) {
  if (data.status === "approved") {
    Carrinho.limpar();
    Carrinho.mostrarToast(data.mensagem || "Pagamento aprovado! 🎉");
    setTimeout(() => window.location.href = "index.html", 3000);
  } else {
    Carrinho.mostrarToast(data.mensagem || "Pagamento não aprovado.");
  }
}

function fmt(v) {
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits:2, maximumFractionDigits:2 });
}
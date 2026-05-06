// ============================================================
//  Bela Rosa — checkout.js
//  Integração Mercado Pago (PIX + Cartão) via Preference API
// ============================================================
//
//  COMO CONFIGURAR:
//  1. Crie uma conta no Mercado Pago Developers
//     https://www.mercadopago.com.br/developers
//  2. Em "Suas integrações" > "Credenciais", copie seu:
//     - Access Token (SERVER)  → usado no seu backend/função
//     - Public Key             → coloque em MP_PUBLIC_KEY abaixo
//  3. Suba a função de backend (ver comentário BACKEND abaixo)
//  4. Coloque a URL da sua função em BACKEND_URL abaixo
//
// ============================================================

const MP_PUBLIC_KEY = "SEU_PUBLIC_KEY_AQUI"; // 🔑 Substitua aqui
const BACKEND_URL   = "https://sua-funcao.supabase.co/functions/v1/criar-pagamento"; // 🌐 Substitua aqui

/* ── BACKEND ESPERADO (Supabase Edge Function) ──────────────────
   POST /criar-pagamento
   Body: { itens, comprador, metodo, total, cardToken? }
   Retorna:
     PIX:    { tipo: "pix", qr_code, qr_code_base64, codigo_copia_cola, expiracao }
     Cartão: { tipo: "cartao", status, mensagem }

   Exemplo de Supabase Edge Function (Deno):
   ─────────────────────────────────────────
   import { serve } from "https://deno.land/std/http/server.ts";

   const MP_ACCESS_TOKEN = Deno.env.get("MP_ACCESS_TOKEN");

   serve(async (req) => {
     const body = await req.json();
     const { itens, comprador, metodo, total, cardToken, parcelas } = body;

     const items = itens.map(i => ({
       id: String(i.id),
       title: i.nome,
       quantity: i.qtd,
       unit_price: Number(i.preco),
       currency_id: "BRL"
     }));

     const payer = {
       name: comprador.nome.split(" ")[0],
       surname: comprador.nome.split(" ").slice(1).join(" "),
       email: comprador.email,
       identification: { type: "CPF", number: comprador.cpf.replace(/\D/g,"") },
       phone: { area_code: comprador.tel.substring(1,3), number: comprador.tel.slice(5) }
     };

     // ── PIX ──────────────────────────────────────────────────
     if (metodo === "pix") {
       const res = await fetch("https://api.mercadopago.com/v1/payments", {
         method: "POST",
         headers: {
           "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
           "Content-Type": "application/json",
           "X-Idempotency-Key": crypto.randomUUID()
         },
         body: JSON.stringify({
           transaction_amount: total,
           description: "Bela Rosa Lingerie",
           payment_method_id: "pix",
           payer,
           notification_url: "https://seu-site.com/webhook"
         })
       });
       const data = await res.json();
       return new Response(JSON.stringify({
         tipo: "pix",
         qr_code: data.point_of_interaction?.transaction_data?.qr_code,
         qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
         codigo_copia_cola: data.point_of_interaction?.transaction_data?.qr_code,
         expiracao: data.date_of_expiration
       }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
     }

     // ── Cartão ───────────────────────────────────────────────
     if (metodo === "cartao") {
       const res = await fetch("https://api.mercadopago.com/v1/payments", {
         method: "POST",
         headers: {
           "Authorization": `Bearer ${MP_ACCESS_TOKEN}`,
           "Content-Type": "application/json",
           "X-Idempotency-Key": crypto.randomUUID()
         },
         body: JSON.stringify({
           transaction_amount: total,
           token: cardToken,
           description: "Bela Rosa Lingerie",
           installments: Number(parcelas),
           payment_method_id: "visa", // será detectado pelo token
           payer,
           notification_url: "https://seu-site.com/webhook"
         })
       });
       const data = await res.json();
       return new Response(JSON.stringify({
         tipo: "cartao",
         status: data.status,
         mensagem: data.status === "approved" ? "Pagamento aprovado! ✓" : (data.status_detail || "Pagamento não aprovado")
       }), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
     }
   });
   ─────────────────────────────────────────────────────────── */

// ============================================================
//  FRONTEND — lógica do checkout
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  renderizarItens();
  atualizarResumo();
  configurarMetodos();
  configurarCEP();
  configurarMascaras();

  window.addEventListener("carritoAtualizado", () => {
    renderizarItens();
    atualizarResumo();
  });

  document.getElementById("btn-pagar").addEventListener("click", iniciarPagamento);
});

// ── Renderizar lista de itens ──────────────────────────────
function renderizarItens() {
  const lista   = document.getElementById("lista-itens");
  const vazio   = document.getElementById("c-vazio");
  const resumo  = document.getElementById("c-resumo");
  const itens   = Carrinho.getItens();

  lista.innerHTML = "";

  if (itens.length === 0) {
    vazio.style.display  = "block";
    resumo.style.display = "none";
    return;
  }

  vazio.style.display  = "none";
  resumo.style.display = "block";

  itens.forEach(item => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <img class="item-img" src="${item.imagem || ''}" alt="${item.nome}"
           onerror="this.style.background='#e8e0d5'">
      <div class="item-info">
        <span class="item-nome">${item.nome}</span>
        <span class="item-preco-unit">R$ ${formatarPreco(item.preco)} / un.</span>
        <div class="item-qtd">
          <button class="qtd-btn" onclick="Carrinho.alterarQtd('${item.id}', -1)">−</button>
          <span class="qtd-num">${item.qtd}</span>
          <button class="qtd-btn" onclick="Carrinho.alterarQtd('${item.id}', 1)">+</button>
        </div>
      </div>
      <div class="item-direita">
        <span class="item-total">R$ ${formatarPreco(item.preco * item.qtd)}</span>
        <button class="item-remover" onclick="Carrinho.remover('${item.id}')">remover</button>
      </div>
    `;
    lista.appendChild(card);
  });
}

// ── Resumo ─────────────────────────────────────────────────
function atualizarResumo() {
  const sub   = Carrinho.total();
  const frete = calcularFrete(sub);

  document.getElementById("r-subtotal").textContent = `R$ ${formatarPreco(sub)}`;
  document.getElementById("r-total").textContent    = `R$ ${formatarPreco(sub + frete)}`;

  const freteEl = document.getElementById("r-frete");
  if (frete === 0) {
    freteEl.textContent  = "Grátis";
    freteEl.style.color  = "#2e7d32";
  } else if (frete === -1) {
    freteEl.textContent = "Calcule pelo CEP";
    freteEl.style.color = "";
  } else {
    freteEl.textContent = `R$ ${formatarPreco(frete)}`;
    freteEl.style.color = "";
  }
}

let _frete = -1;
function calcularFrete(subtotal) {
  if (subtotal >= 150) return 0;
  return _frete;
}

// ── CEP ───────────────────────────────────────────────────
function configurarCEP() {
  const input = document.getElementById("cep-input");
  const btn   = document.getElementById("cep-btn");
  const info  = document.getElementById("cep-info");

  input.addEventListener("input", () => {
    let v = input.value.replace(/\D/g, "");
    if (v.length > 5) v = v.slice(0,5) + "-" + v.slice(5,8);
    input.value = v;
  });

  btn.addEventListener("click", async () => {
    const cep = input.value.replace(/\D/g, "");
    if (cep.length !== 8) { info.textContent = "CEP inválido."; return; }
    info.textContent = "Buscando…";
    try {
      const r    = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await r.json();
      if (data.erro) { info.textContent = "CEP não encontrado."; return; }
      info.textContent = `${data.localidade} — ${data.uf}`;
      // Frete fixo simulado (integre com Correios/Melhor Envio se quiser)
      _frete = 18.90;
      atualizarResumo();
    } catch {
      info.textContent = "Erro ao buscar CEP.";
    }
  });
}

// ── Métodos de pagamento ───────────────────────────────────
function configurarMetodos() {
  const radios      = document.querySelectorAll('input[name="pagamento"]');
  const camposCart  = document.getElementById("campos-cartao");

  radios.forEach(radio => {
    radio.addEventListener("change", () => {
      camposCart.style.display = radio.value === "cartao" ? "block" : "none";
    });
  });
}

// ── Máscaras ──────────────────────────────────────────────
function configurarMascaras() {
  mascara("c-cpf",   v => {
    v = v.replace(/\D/g, "").slice(0,11);
    return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})?/, (_, a,b,c,d) =>
      d ? `${a}.${b}.${c}-${d}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a);
  });
  mascara("c-tel",   v => {
    v = v.replace(/\D/g,"").slice(0,11);
    return v.replace(/(\d{2})(\d{5})(\d{4})?/, (_,a,b,c) =>
      c ? `(${a}) ${b}-${c}` : b ? `(${a}) ${b}` : a.length ? `(${a}` : "");
  });
  mascara("cc-num",  v => v.replace(/\D/g,"").slice(0,16).replace(/(\d{4})/g,"$1 ").trim());
  mascara("cc-val",  v => {
    v = v.replace(/\D/g,"").slice(0,4);
    return v.length > 2 ? v.slice(0,2)+"/"+v.slice(2) : v;
  });
}

function mascara(id, fn) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => { el.value = fn(el.value); });
}

// ── Iniciar pagamento ─────────────────────────────────────
async function iniciarPagamento() {
  const btn    = document.getElementById("btn-pagar");
  const texto  = document.getElementById("btn-pagar-texto");
  const metodo = document.querySelector('input[name="pagamento"]:checked').value;

  // Validações básicas
  const nome  = document.getElementById("c-nome").value.trim();
  const email = document.getElementById("c-email").value.trim();
  const cpf   = document.getElementById("c-cpf").value.replace(/\D/g,"");
  const tel   = document.getElementById("c-tel").value.replace(/\D/g,"");

  if (!nome || !email || cpf.length !== 11 || tel.length < 10) {
    Carrinho.mostrarToast("Preencha todos os dados corretamente.");
    return;
  }

  const itens = Carrinho.getItens();
  if (!itens.length) return;

  const subtotal = Carrinho.total();
  const frete    = calcularFrete(subtotal);
  const total    = subtotal + (frete > 0 ? frete : 0);

  btn.disabled   = true;
  texto.innerHTML = '<span class="spinner"></span>';

  try {
    // ── MODO DEMONSTRAÇÃO ──────────────────────────────────────
    // Se BACKEND_URL não está configurado, simula a resposta
    if (BACKEND_URL.includes("sua-funcao")) {
      await simularPagamento(metodo, total);
      return;
    }

    // ── MODO PRODUÇÃO ──────────────────────────────────────────
    let body = {
      itens, total,
      comprador: { nome, email, cpf, tel },
      metodo
    };

    // Tokenizar cartão com Mercado Pago SDK
    if (metodo === "cartao") {
      const mp        = new MercadoPago(MP_PUBLIC_KEY, { locale: "pt-BR" });
      const cardToken = await mp.createCardToken({
        cardNumber:      document.getElementById("cc-num").value.replace(/\s/g,""),
        cardholderName:  document.getElementById("cc-nome").value,
        cardExpirationMonth: document.getElementById("cc-val").value.split("/")[0],
        cardExpirationYear:  "20" + document.getElementById("cc-val").value.split("/")[1],
        securityCode:    document.getElementById("cc-cvv").value
      });
      body.cardToken = cardToken.id;
      body.parcelas  = document.getElementById("cc-parcelas").value;
    }

    const res  = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (data.tipo === "pix") {
      exibirPix(data);
    } else {
      exibirResultadoCartao(data);
    }

  } catch (e) {
    Carrinho.mostrarToast("Erro ao processar pagamento. Tente novamente.");
    console.error(e);
  } finally {
    btn.disabled   = false;
    texto.textContent = "Finalizar pedido";
  }
}

// ── Simulação (dev/demo) ──────────────────────────────────
async function simularPagamento(metodo, total) {
  await new Promise(r => setTimeout(r, 1800));

  if (metodo === "pix") {
    exibirPix({
      qr_code_base64: null,
      codigo_copia_cola: "00020126580014br.gov.bcb.pix0136DEMONSTRACAO-BELAROSA-PIX-COPIA-COLA5204000053039865802BR5925Bela Rosa Lingerie6008Sao Paulo62070503***630452B2",
      expiracao: new Date(Date.now() + 30*60*1000).toISOString()
    });
  } else {
    exibirResultadoCartao({ status: "approved", mensagem: "Pagamento aprovado! ✓ (simulação)" });
  }

  document.getElementById("btn-pagar").disabled   = false;
  document.getElementById("btn-pagar-texto").textContent = "Finalizar pedido";
}

// ── Exibir QR PIX ─────────────────────────────────────────
function exibirPix(data) {
  const resultado = document.getElementById("pix-resultado");
  const qrWrap    = document.getElementById("qr-code");
  const codInput  = document.getElementById("pix-codigo");
  const validade  = document.getElementById("pix-validade");

  resultado.style.display = "block";

  // QR Code image (base64 do MP) ou placeholder
  if (data.qr_code_base64) {
    qrWrap.innerHTML = `<img src="data:image/png;base64,${data.qr_code_base64}" width="180" height="180" alt="QR PIX">`;
  } else {
    // Placeholder visual quando em modo demo
    qrWrap.innerHTML = `
      <div style="width:180px;height:180px;background:#f8f5f0;border:2px dashed #c8a96e;
                  display:flex;align-items:center;justify-content:center;border-radius:8px;
                  font-size:12px;color:#888;text-align:center;padding:16px;line-height:1.4">
        QR Code aparece aqui em produção
      </div>`;
  }

  codInput.value = data.codigo_copia_cola || "";

  if (data.expiracao) {
    const exp = new Date(data.expiracao);
    validade.textContent = `Válido até ${exp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
  }

  resultado.scrollIntoView({ behavior: "smooth", block: "nearest" });

  // Copiar código
  document.getElementById("btn-copiar").onclick = () => {
    navigator.clipboard.writeText(codInput.value).then(() => {
      Carrinho.mostrarToast("Código copiado!");
    });
  };
}

// ── Resultado cartão ──────────────────────────────────────
function exibirResultadoCartao(data) {
  if (data.status === "approved") {
    Carrinho.limpar();
    Carrinho.mostrarToast(data.mensagem || "Pagamento aprovado! 🎉");
    setTimeout(() => { window.location.href = "index.html"; }, 3000);
  } else {
    Carrinho.mostrarToast(data.mensagem || "Pagamento não aprovado. Verifique os dados.");
  }
}

// ── Util ──────────────────────────────────────────────────
function formatarPreco(v) {
  return Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

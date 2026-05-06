// ============================================================
//  Bela Rosa — Carrinho de Compras
// ============================================================

const Carrinho = (() => {
  const STORAGE_KEY = "belarosa_carrinho";

  function getItens() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function salvar(itens) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
    _dispararEvento();
  }

  function adicionar(produto) {
    const itens = getItens();
    const idx = itens.findIndex(i => i.id === produto.id);
    if (idx >= 0) {
      itens[idx].qtd += 1;
    } else {
      itens.push({ ...produto, qtd: 1 });
    }
    salvar(itens);
    mostrarToast(`"${produto.nome}" adicionado ao carrinho`);
  }

  function remover(id) {
    salvar(getItens().filter(i => i.id !== id));
  }

  function alterarQtd(id, delta) {
    const itens = getItens().map(i => {
      if (i.id === id) {
        const nova = i.qtd + delta;
        return nova < 1 ? null : { ...i, qtd: nova };
      }
      return i;
    }).filter(Boolean);
    salvar(itens);
  }

  function limpar() {
    localStorage.removeItem(STORAGE_KEY);
    _dispararEvento();
  }

  function total() {
    return getItens().reduce((acc, i) => acc + i.preco * i.qtd, 0);
  }

  function contagem() {
    return getItens().reduce((acc, i) => acc + i.qtd, 0);
  }

  function _dispararEvento() {
    window.dispatchEvent(new CustomEvent("carritoAtualizado"));
  }

  // ── Toast notification ──────────────────────────────────────
  function mostrarToast(msg) {
    let toast = document.getElementById("br-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "br-toast";
      toast.style.cssText = `
        position:fixed; bottom:32px; left:50%; transform:translateX(-50%) translateY(20px);
        background:#1a1a1a; color:#fff; padding:14px 24px; border-radius:999px;
        font-family:'Jost',sans-serif; font-size:13px; letter-spacing:.04em;
        opacity:0; transition:opacity .3s,transform .3s; z-index:9999;
        white-space:nowrap; pointer-events:none;
        border: 1px solid rgba(255,255,255,.1);
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = "1";
    toast.style.transform = "translateX(-50%) translateY(0)";
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
    }, 2800);
  }

  return { getItens, adicionar, remover, alterarQtd, limpar, total, contagem, mostrarToast };
})();

// ── Ícone de carrinho no header (badge) ─────────────────────
function _atualizarBadge() {
  const badge = document.getElementById("carrinho-badge");
  const n = Carrinho.contagem();
  if (badge) {
    badge.textContent = n;
    badge.style.display = n > 0 ? "flex" : "none";
  }
}
window.addEventListener("carritoAtualizado", _atualizarBadge);
document.addEventListener("DOMContentLoaded", _atualizarBadge);

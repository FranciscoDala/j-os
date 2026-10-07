"use client";
import type { Empresa } from "@/lib/types";

type ItemRecibo = {
    nome: string;
    qtd: number;
    preco_unit: number;
    total: number;
};

type ReciboProps = {
    empresa: Empresa | null;
    venda: {
        numero?: string | number;
        total: number;
        forma_pagamento?: string;
        dinheiro_recebido?: number;
        troco?: number;
        created_at?: string;
        mesa_numero?: string | number | null;
    };
    itens: ItemRecibo[];
    cliente?: { nome?: string; nif?: string } | null;
};

export function gerarReciboHTML({ empresa, venda, itens, cliente }: ReciboProps) {
    const data = new Date(venda.created_at || Date.now()).toLocaleString("pt-AO");
    const totalFmt = (n: number) => Number(n).toLocaleString("de-DE", { minimumFractionDigits: 2 });

    const itensHtml = itens.map(i => `
    <tr>
      <td style="text-align:left; padding:4px 0">
        <div style="font-weight:700">${i.nome}</div>
        <div style="font-size:10px; color:#666">${i.qtd} x Kz ${totalFmt(i.preco_unit)}</div>
      </td>
      <td style="text-align:right; vertical-align:top; padding:4px 0">Kz ${totalFmt(i.total)}</td>
    </tr>
  `).join("");

    return `
<html>
<head>
<meta charset="utf-8" />
<style>
  @page { size: 80mm auto; margin: 0; }
  body { font-family: 'Courier New', monospace; width: 80mm; margin:0; padding:12px; font-size:12px; color:#000; background:#fff }
 .center{text-align:center}
 .bold{font-weight:900}
 .line{border-top:1px dashed #000; margin:10px 0}
 .small{font-size:10px; color:#444}
  table{width:100%; border-collapse:collapse}
 .logo{width:60px; height:60px; object-fit:contain; margin:0 auto 6px; display:block; border-radius:8px}
 .empresa-nome{font-size:14px; font-weight:900; text-transform:uppercase}
 .total-box{background:#000; color:#fff; padding:8px 10px; border-radius:8px; margin-top:8px}
</style>
</head>
<body>
  <div class="center">
    ${empresa?.logo_url ? `<img src="${empresa.logo_url}" class="logo" />` : `<div style="font-size:28px; font-weight:900">J</div>`}
    <div class="empresa-nome">${empresa?.nome_fantasia || "Empresa"}</div>
    <div class="small">
      ${empresa?.address ? `${empresa.address}<br/>` : ""}
      ${empresa?.city || ""} ${empresa?.province ? `- ${empresa.province}` : ""}<br/>
      ${empresa?.phone ? `Tel: ${empresa.phone}<br/>` : ""}
      NIF: ${empresa?.nif || "N/A"}<br/>
      ${empresa?.email || ""}
    </div>
  </div>

  <div class="line"></div>

  <div style="display:flex; justify-content:space-between" class="small">
    <span>FACTURA: <b>#${venda.numero || "----"}</b></span>
    <span>${data}</span>
  </div>
  ${venda.mesa_numero ? `<div class="small">Mesa: <b>${venda.mesa_numero}</b> • Balcão: Restaurante</div>` : `<div class="small">Canal: Balcão</div>`}
  ${cliente?.nome ? `<div class="small">Cliente: ${cliente.nome} ${cliente.nif ? `(${cliente.nif})` : ""}</div>` : ""}

  <div class="line"></div>

  <table>${itensHtml}</table>

  <div class="line"></div>

  <table>
    <tr><td class="small">Subtotal</td><td style="text-align:right" class="small">Kz ${totalFmt(venda.total)}</td></tr>
    <tr><td class="bold">TOTAL</td><td style="text-align:right" class="bold">Kz ${totalFmt(venda.total)}</td></tr>
    ${venda.forma_pagamento ? `<tr><td class="small">Pagamento</td><td style="text-align:right" class="small">${venda.forma_pagamento}</td></tr>` : ""}
    ${venda.dinheiro_recebido && venda.dinheiro_recebido > venda.total ? `
      <tr><td class="small">Recebido</td><td style="text-align:right" class="small">Kz ${totalFmt(venda.dinheiro_recebido)}</td></tr>
      <tr><td class="small">Troco</td><td style="text-align:right" class="small">Kz ${totalFmt(venda.troco || 0)}</td></tr>
    ` : ""}
  </table>

  <div class="total-box">
    <div style="display:flex; justify-content:space-between">
      <span>TOTAL A PAGAR</span>
      <span>Kz ${totalFmt(venda.total)}</span>
    </div>
  </div>

  ${empresa?.iban ? `
  <div class="line"></div>
  <div class="small center">
    ${empresa.banco1 || "Banco"}: ${empresa.iban}<br/>
    ${empresa.banco2 && empresa.iban2 ? `${empresa.banco2}: ${empresa.iban2}` : ""}
  </div>` : ""}

  <div class="line"></div>
  <div class="center small">
    Obrigado pela preferência!<br/>
    Este documento não serve de factura.<br/>
    Processado por J-OS • ${new Date().getFullYear()}
  </div>

  <script>window.onload = () => { window.print(); setTimeout(()=>window.close(), 300); }</script>
</body>
</html>`;
}

export function imprimirRecibo(props: ReciboProps) {
    const win = window.open("", "_blank", "width=380,height=700");
    if (!win) return;
    win.document.write(gerarReciboHTML(props));
    win.document.close();
}

"use client";
import { Check, Printer } from "lucide-react";

export function MesaReciboModal({ open, venda, forma, recebido, onClose }: any) {
    if (!open) return null;
    const total = Number(venda?.total || 0);
    const troco = (recebido? parseFloat(recebido) : 0) - total;

    const imprimir = () => {
        const v = venda; if (!v) return;
        const win = window.open("", "_blank", "width=320,height=600"); if (!win) return;
        const itensHtml = (v.itens || []).map((i:any)=>`<tr><td>${i.nome_produto||i.produto_nome||i.nome} x${i.quantidade||1}</td><td style="text-align:right">Kz ${Number(i.total||0).toLocaleString("de-DE")}</td></tr>`).join("");
        win.document.write(`<html><head><style>body{font-family:monospace;width:80mm;padding:10px;font-size:12px}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}table{width:100%}</style></head><body><div class="center bold">FATURA MESA ${v.mesa_numero}<br/>#${v.numero||""}</div><div class="line"></div><table>${itensHtml}</table><div class="line"></div><table><tr><td class="bold">TOTAL</td><td style="text-align:right" class="bold">Kz ${Number(v.total||0).toLocaleString("de-DE")}</td></tr></table><script>window.print();</script></body></html>`);
        win.document.close();
    };

    const aposVenda = (comRecibo:boolean) => {
        if (comRecibo) imprimir();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[300] bg-black/40 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="w-full max-w-[360px] bg-white rounded-t-[24px] md:rounded-[24px] p-6 border shadow-2xl text-center">
                <div className="w-14 h-14 bg-[#E8F5E9] rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200"><Check size={26} className="text-green-600" /></div>
                <h3 className="font-black text-[16px]">Mesa {venda?.mesa_numero} fechada!</h3>
                <p className="text-[12px] text-gray-600 mt-2">Total Kz {Number(venda?.total||0).toLocaleString("de-DE")} via {forma}</p>
                {forma==="dinheiro" && troco>0 && <p className="text-[11px] text-green-700 bg-green-50 border border-green-100 rounded-full px-3 py-1 mt-2 inline-block font-black">Troco Kz {Number(troco).toLocaleString("de-DE")}</p>}
                <p className="text-[12px] font-bold mt-4">Deseja imprimir o recibo?</p>
                <div className="flex gap-2.5 mt-5">
                    <button onClick={()=>aposVenda(false)} className="flex-1 bg-white border border-black/10 rounded-full py-3.5 text-[13px] font-bold">Não</button>
                    <button onClick={()=>aposVenda(true)} className="flex-1 bg-black text-white rounded-full py-3.5 text-[13px] font-black flex items-center justify-center gap-2"><Printer size={14} /> Imprimir</button>
                </div>
            </div>
        </div>
    );
}

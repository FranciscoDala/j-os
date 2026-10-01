"use client";
import { useState, useEffect } from "react";
import { X, Plus, Minus, Search, Delete, Banknote, Printer, Check, CreditCard, Smartphone } from "lucide-react";

const PRODUCTS = [
  { id:1, name:"Tomato with Tofu Salad", price:97750, avail:10, cat:"Main", img:"https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400" },
  { id:2, name:"Japanese Chicken Gyoza", price:81700, avail:15, cat:"Main", img:"https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=400" },
  { id:3, name:"2pcs of Amazing Avocado", price:68000, avail:10, cat:"Appetizer", img:"https://images.unsplash.com/photo-1526948128573-703ee1aeb6f8?q=80&w=400" },
  { id:4, name:"Lettuce with Stuff", price:170000, avail:8, cat:"Main", img:"https://images.unsplash.com/photo-1512621776952-a57141f2eefd?q=80&w=400" },
  { id:5, name:"Biscuit Mama with Susu", price:60000, avail:12, cat:"Dessert", img:"https://images.unsplash.com/photo-1559620192-032c4bc4674e?q=80&w=400" },
  { id:6, name:"Krosang Thats it", price:78000, avail:9, cat:"Dessert", img:"https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=400" },
];

export function VendasTab({ onClose }: { onClose: () => void }) {
  const [cart, setCart] = useState<any[]>([]);
  const [showPay, setShowPay] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recebido, setRecebido] = useState("");
  const [forma, setForma] = useState<"dinheiro"|"cartao"|"transferencia">("dinheiro");

  const total = cart.reduce((s,i)=>s+i.price*i.qtd,0);
  // FIX: parse correto com ponto decimal
  const recebidoNum = recebido? parseFloat(recebido) : 0;
  const troco = recebidoNum - total;

  const add = (p:any) => { const ex = cart.find(c=>c.id===p.id); if(ex) setCart(cart.map(c=>c.id===p.id?{...c,qtd:c.qtd+1}:c)); else setCart([...cart,{...p,qtd:1}]); };
  const sub = (p:any) => { const ex = cart.find(c=>c.id===p.id); if(!ex) return; if(ex.qtd===1) setCart(cart.filter(c=>c.id!==p.id)); else setCart(cart.map(c=>c.id===p.id?{...c,qtd:c.qtd-1}:c)); };
  const getQty = (id:number) => cart.find(c=>c.id===id)?.qtd || 0;

  const handleCalc = (val:string) => {
    if(val==="C") setRecebido("");
    else if(val==="DEL") setRecebido(s=>s.slice(0,-1));
    else if(val==="00") { if(recebido!=="") setRecebido(s=>s+"00"); }
    else if(val===".") { if(!recebido.includes(".")) setRecebido(s=> s===""? "0." : s+"."); }
    else { // numero
      if(recebido==="0") setRecebido(val);
      else setRecebido(s=> (s+val).slice(0,10));
    }
  };

  // ATALHOS DE TECLADO FISICO - RESTAURANTE
  useEffect(()=>{
    if(!showPay) return;
    const onKey = (e: KeyboardEvent) => {
      if(e.key==="Escape"){ setShowPay(false); }
      else if(e.key==="Enter"){ if(forma!=="dinheiro" || recebidoNum>=total) setShowConfirm(true); }
      else if(e.key==="Backspace"){ e.preventDefault(); handleCalc("DEL"); }
      else if(e.key==="Delete" || e.key.toLowerCase()==="c"){ handleCalc("C"); }
      else if(/^[0-9]$/.test(e.key)){ handleCalc(e.key); }
      else if(e.key==="." || e.key==="," ){ handleCalc("."); }
    };
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  },[showPay, recebido, total, forma, recebidoNum]);

  // Quando não é dinheiro, recebido = total automaticamente
  useEffect(()=>{
    if(forma!=="dinheiro"){ setRecebido(String(total)); }
    else { setRecebido(""); }
  },[forma, total, showPay]);

  const imprimirFatura = () => {
    const win = window.open("", "_blank", "width=320,height=600");
    if(!win) return;
    const html = `<html><head><style>body{font-family:monospace;width:80mm;padding:10px;font-size:12px}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}</style></head><body><div class="center bold">RESTAURANTE JENATH<br/>${forma.toUpperCase()}</div><div class="line"></div><div>${new Date().toLocaleString()}</div><div class="line"></div><table>${cart.map(i=>`<tr><td>${i.name} x${i.qtd}</td><td style="text-align:right">Kz ${(i.price*i.qtd).toLocaleString()}</td></tr>`).join("")}</table><div class="line"></div><table><tr><td class="bold">TOTAL</td><td style="text-align:right" class="bold">Kz ${total.toLocaleString()}</td></tr><tr><td>Recebido</td><td style="text-align:right">Kz ${recebidoNum.toLocaleString()}</td></tr><tr><td class="bold">TROCO</td><td style="text-align:right" class="bold">Kz ${Math.max(0,troco).toLocaleString()}</td></tr><tr><td>Pagamento</td><td style="text-align:right">${forma}</td></tr></table><div class="line"></div><div class="center">Obrigado!</div><script>window.print();window.close();</script></body></html>`;
    win.document.write(html); win.document.close();
    setShowConfirm(false); setShowPay(false); setCart([]); setRecebido(""); setForma("dinheiro");
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#F5F7FB] overflow-hidden">
      <div className="h-[56px] px-4 flex items-center justify-between bg-white/80 backdrop-blur border-b shrink-0">
        <div className="flex items-center gap-2"><button onClick={onClose} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center"><X size={15}/></button><p className="font-black text-[13px]">PDV</p></div>
        <div className="text-[10px] text-gray-400 hidden md:block">ENTER=Confirmar • ESC=Cancelar • BACKSPACE=Apagar • Teclado numérico ativo</div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 grid grid-cols-2 md:grid-cols-3 gap-2.5 content-start">
          {PRODUCTS.map(p=>{
            const qty=getQty(p.id);
            return (<div key={p.id} className="bg-white border rounded-[14px] p-2"><img src={p.img} className="w-full h-[80px] object-cover rounded-[10px]" style={{border:'2px solid #fff'}} alt=""/><p className="font-semibold text-[11px] mt-2 truncate">{p.name}</p><div className="flex justify-between items-center mt-1"><p className="text-[11px] font-black">Kz {p.price.toLocaleString()}</p>{qty===0?<button onClick={()=>add(p)} className="bg-black text-white rounded-full px-3 py-1 text-[10px]">Order</button>:<div className="flex items-center gap-1 bg-black text-white rounded-full px-1 py-0.5"><button onClick={()=>sub(p)} className="w-5 h-5 bg-white/20 rounded-full flex justify-center items-center"><Minus size={10}/></button><span className="text-[10px] w-3 text-center">{qty}</span><button onClick={()=>add(p)} className="w-5 h-5 bg-white text-black rounded-full flex justify-center items-center"><Plus size={10}/></button></div>}</div></div>)
          })}
        </div>
        <div className="w-[300px] bg-white border-l flex flex-col shrink-0"><div className="p-3 border-b flex justify-between"><p className="font-bold text-[12px]">Pedido</p><span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full">{cart.length}</span></div><div className="flex-1 overflow-y-auto no-scrollbar p-2 space-y-2">{cart.map(i=>(<div key={i.id} className="flex gap-2 bg-[#F8FAFF] border rounded-[10px] p-2"><div className="flex-1"><p className="text-[11px] font-semibold truncate">{i.name}</p><p className="text-[10px] text-gray-500">Kz {i.price.toLocaleString()} x {i.qtd}</p></div><p className="text-[11px] font-bold">Kz {(i.price*i.qtd).toLocaleString()}</p></div>))}</div><div className="p-3 border-t"><p className="text-[11px]">Total <span className="font-black text-[14px] float-right">Kz {total.toLocaleString()}</span></p><button disabled={!cart.length} onClick={()=>setShowPay(true)} className="w-full mt-2 bg-[#2F4A8A] disabled:bg-gray-300 text-white rounded-full py-3 text-[12px] font-bold">Pagar</button></div></div>
      </div>

      {/* CALCULADORA 400PX GLASS + FORMA PAGAMENTO */}
      {showPay && (
        <div className="absolute inset-0 z-[200] bg-[#5A8AD4]/30 backdrop-blur-[10px] flex items-center justify-center p-3">
          <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-2xl rounded-[22px] border border-white/70 shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col">

            <div className="p-4 space-y-3">
              {/* FORMA DE PAGAMENTO */}
              <div className="flex gap-2">
                {[
                  {id:"dinheiro", label:"Dinheiro", icon:Banknote},
                  {id:"cartao", label:"Cartão", icon:CreditCard},
                  {id:"transferencia", label:"Transf.", icon:Smartphone},
                ].map(f=>{
                  const Icon=f.icon as any;
                  const active=forma===f.id;
                  return (
                    <button key={f.id} onClick={()=>setForma(f.id as any)} className={`flex-1 h-[38px] rounded-full border flex items-center justify-center gap-1.5 text-[11px] font-bold transition ${active?"bg-black text-white border-black shadow":"bg-white/80 border-black/10 text-gray-600"}`}>
                      <Icon size={14}/> {f.label}
                    </button>
                  )
                })}
              </div>

              <div className="bg-[#F5F7FB]/80 backdrop-blur rounded-[14px] p-3 space-y-2 border border-black/5">
                <div className="flex justify-between px-1"><span className="text-[11px] text-gray-500">Valor a Pagar</span><span className="font-black text-[14px]">Kz {total.toLocaleString()}</span></div>
                <div className="bg-white/90 backdrop-blur rounded-[12px] p-3 border border-white shadow-sm flex justify-between items-center">
                  <div><p className="text-[8px] tracking-[0.15em] text-gray-400 font-bold">VALOR RECEBIDO</p><p className="text-[20px] font-black leading-none mt-1">Kz {recebido||"0"}</p></div>
                  <div className="w-9 h-9 bg-[#EEF4FF] rounded-full flex items-center justify-center"><Banknote size={16} className="text-[#2F4A8A]"/></div>
                </div>
                {forma==="dinheiro" && (
                  <div className={`rounded-[12px] px-3 py-2.5 flex justify-between items-center border ${troco>=0?"bg-[#E8F5E9] border-green-200 text-green-800":"bg-[#FFEBEE] border-red-200 text-red-700"}`}>
                    <span className="text-[11px] font-black">{troco>=0?"TROCO":"FALTA"}</span>
                    <span className="text-[15px] font-black">Kz {Math.abs(troco).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {forma==="dinheiro" && (
                <div className="grid grid-cols-4 gap-2.5">
                  <button onClick={()=>handleCalc("7")} className="h-[46px] rounded-[12px] bg-white border shadow-sm font-bold active:scale-95">7</button>
                  <button onClick={()=>handleCalc("8")} className="h-[46px] rounded-[12px] bg-white border shadow-sm font-bold active:scale-95">8</button>
                  <button onClick={()=>handleCalc("9")} className="h-[46px] rounded-[12px] bg-white border shadow-sm font-bold active:scale-95">9</button>
                  <button onClick={()=>handleCalc("DEL")} className="h-[46px] rounded-[12px] bg-black text-white font-bold flex justify-center items-center active:scale-95"><Delete size={18}/></button>

                  <button onClick={()=>handleCalc("4")} className="h-[46px] rounded-[12px] bg-white border shadow-sm font-bold active:scale-95">4</button>
                  <button onClick={()=>handleCalc("5")} className="h-[46px] rounded-[12px] bg-white border shadow-sm font-bold active:scale-95">5</button>
                  <button onClick={()=>handleCalc("6")} className="h-[46px] rounded-[12px] bg-white border shadow-sm font-bold active:scale-95">6</button>
                  <button onClick={()=>handleCalc("C")} className="h-[46px] rounded-[12px] bg-black text-white font-black active:scale-95">C</button>

                  <button onClick={()=>handleCalc("1")} className="h-[46px] rounded-[12px] bg-white border shadow-sm font-bold active:scale-95">1</button>
                  <button onClick={()=>handleCalc("2")} className="h-[46px] rounded-[12px] bg-white border shadow-sm font-bold active:scale-95">2</button>
                  <button onClick={()=>handleCalc("3")} className="h-[46px] rounded-[12px] bg-white border shadow-sm font-bold active:scale-95">3</button>
                  <button onClick={()=>handleCalc("00")} className="h-[46px] rounded-[12px] bg-white/70 border shadow-sm font-bold text-[13px] active:scale-95">00</button>

                  <button onClick={()=>handleCalc("0")} className="h-[46px] rounded-[12px] bg-white border shadow-sm font-bold active:scale-95 col-span-2">0</button>
                  <button onClick={()=>handleCalc(".")} className="h-[46px] rounded-[12px] bg-white border shadow-sm font-bold text-[18px] active:scale-95 col-span-2">.</button>
                </div>
              )}

              {forma!=="dinheiro" && (
                <div className="bg-[#EEF4FF] rounded-[12px] p-4 text-center border"><p className="text-[11px] text-gray-500">Pagamento via</p><p className="font-black text-[14px] capitalize mt-1">{forma}</p><p className="text-[12px] mt-1">Kz {total.toLocaleString()}</p></div>
              )}

              {/* BOTOES SÓ ICONES */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button onClick={()=>setShowPay(false)} className="h-[50px] bg-[#EF4444] hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-red-200 active:scale-95 transition">
                  <X size={22}/>
                </button>
                <button disabled={forma==="dinheiro" && recebidoNum < total} onClick={()=>setShowConfirm(true)} className="h-[50px] bg-[#16A34A] hover:bg-green-600 disabled:bg-gray-300 text-white rounded-full flex items-center justify-center shadow-lg shadow-green-200 active:scale-95 transition">
                  <Check size={22}/>
                </button>
              </div>
              <p className="text-center text-[9px] text-gray-400 tracking-widest">ESC=CANCELAR • ENTER=CONFIRMAR • BACKSPACE=APAGAR</p>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="absolute inset-0 z-[300] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] bg-white rounded-[20px] p-5 border shadow-2xl text-center">
            <div className="w-12 h-12 bg-[#EEF4FF] rounded-full flex items-center justify-center mx-auto mb-3"><Printer size={20} className="text-[#2F4A8A]"/></div>
            <h3 className="font-black text-[14px]">Finalizar venda?</h3>
            <p className="text-[11px] text-gray-500 mt-1">Kz {total.toLocaleString()} • {forma} • Troco Kz {Math.max(0,troco).toLocaleString()}</p>
            <div className="flex gap-2 mt-4"><button onClick={()=>setShowConfirm(false)} className="flex-1 bg-white border rounded-full py-2.5 text-[12px]"><X size={14} className="inline mr-1"/> Não</button><button onClick={imprimirFatura} className="flex-1 bg-black text-white rounded-full py-2.5 text-[12px] font-bold"><Check size={14} className="inline mr-1"/> Sim</button></div>
          </div>
        </div>
      )}

      <style jsx>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
    </div>
  );
}

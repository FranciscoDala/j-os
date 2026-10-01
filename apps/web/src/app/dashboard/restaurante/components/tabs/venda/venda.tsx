"use client";
import { useState, useEffect } from "react";
import { X, Plus, Minus, Search, Clock3, SlidersHorizontal, Delete, Banknote, Printer, Check } from "lucide-react";

const PRODUCTS = [
  { id:1, name:"Tomato with Tofu Salad", price:97750, avail:10, cat:"Main", img:"https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400", discount:"15%" },
  { id:2, name:"Japanese Chicken Gyoza", price:81700, avail:15, cat:"Main", img:"https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400", discount:"15%" },
  { id:3, name:"2pcs of Amazing Avocado", price:68000, avail:10, cat:"Appetizer", img:"https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400", discount:"" },
  { id:4, name:"Lettuce with Stuff", price:170000, avail:8, cat:"Main", img:"https://images.unsplash.com/photo-1512621776952-a57141f2eefd?q=80&w=400", discount:"15%" },
  { id:5, name:"Biscuit Mama with Susu", price:60000, avail:12, cat:"Dessert", img:"https://images.unsplash.com/photo-1559620192-032c4bc4674e?q=80&w=400", discount:"" },
  { id:6, name:"Krosang Thats it", price:78000, avail:9, cat:"Dessert", img:"https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=400", discount:"" },
  { id:7, name:"Strawberry Float", price:45000, avail:20, cat:"Beverages", img:"https://images.unsplash.com/photo-1488477181946-64290103bbd6?q=80&w=400", discount:"" },
  { id:8, name:"Healthy Kids Meal", price:83000, avail:7, cat:"Kids", img:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400", discount:"" },
];

export function VendasTab({ onClose }: { onClose: () => void }) {
  const [activeCat, setActiveCat] = useState("All");
  const [cart, setCart] = useState<any[]>([]);
  const [showPay, setShowPay] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recebido, setRecebido] = useState("");
  const [forma, setForma] = useState<"dinheiro" | "transferencia" | "tpa">("dinheiro");

  const cats = ["All","Main Course","Appetizer","Dessert","Side Dishes","Beverages","Kids"];
  const add = (p:any) => { const ex = cart.find(c=>c.id===p.id); if(ex) setCart(cart.map(c=>c.id===p.id?{...c,qtd:c.qtd+1}:c)); else setCart([...cart,{...p,qtd:1}]); };
  const sub = (p:any) => { const ex = cart.find(c=>c.id===p.id); if(!ex) return; if(ex.qtd===1) setCart(cart.filter(c=>c.id!==p.id)); else setCart(cart.map(c=>c.id===p.id?{...c,qtd:c.qtd-1}:c)); };
  const getQty = (id:number) => cart.find(c=>c.id===id)?.qtd || 0;
  const total = cart.reduce((s,i)=>s+i.price*i.qtd,0);
  const recebidoNum = recebido? parseFloat(recebido) : 0;
  const troco = recebidoNum - total;

  const handleCalc = (val:string) => {
    if(val==="C") setRecebido("");
    else if(val==="DEL") setRecebido(s=>s.slice(0,-1));
    else if(val==="00") { if(recebido!=="") setRecebido(s=>s+"00"); }
    else if(val===".") { if(!recebido.includes(".")) setRecebido(s=> s===""? "0." : s+"."); }
    else { setRecebido(s=> (s+val).slice(0,10)); }
  };

  useEffect(()=>{
    if(!showPay || forma!=="dinheiro") return;
    const onKey = (e: KeyboardEvent) => {
      if(e.key==="Escape") setShowPay(false);
      else if(e.key==="Enter"){ if(recebidoNum>=total) setShowConfirm(true); }
      else if(e.key==="Backspace"){ e.preventDefault(); handleCalc("DEL"); }
      else if(e.key.toLowerCase()==="c") handleCalc("C");
      else if(/^[0-9]$/.test(e.key)) handleCalc(e.key);
      else if(e.key==="." || e.key===",") handleCalc(".");
    };
    window.addEventListener("keydown", onKey);
    return ()=> window.removeEventListener("keydown", onKey);
  },[showPay, recebido, total, forma, recebidoNum]);

  const filtered = activeCat==="All"?PRODUCTS:PRODUCTS.filter(p=>p.cat===activeCat || activeCat.includes(p.cat));

  const imprimirFatura = () => {
    const win = window.open("", "_blank", "width=320,height=600");
    if(!win) return;
    const html = `<html><head><style>body{font-family:monospace;width:80mm;padding:10px;font-size:12px}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0} table{width:100%}</style></head><body><div class="center bold">RESTAURANTE JENATH<br/>${forma.toUpperCase()}</div><div class="line"></div><div>${new Date().toLocaleString()}</div><div class="line"></div><table>${cart.map(i=>`<tr><td>${i.name} x${i.qtd}</td><td style="text-align:right">Kz ${(i.price*i.qtd).toLocaleString()}</td></tr>`).join("")}</table><div class="line"></div><table><tr><td class="bold">TOTAL</td><td style="text-align:right" class="bold">Kz ${total.toLocaleString()}</td></tr>${forma==="dinheiro"? `<tr><td>Recebido</td><td style="text-align:right">Kz ${recebidoNum.toLocaleString()}</td></tr><tr><td class="bold">TROCO</td><td style="text-align:right">Kz ${troco.toLocaleString()}</td></tr>`:``}<tr><td>Pagamento</td><td style="text-align:right">${forma}</td></tr></table><div class="line"></div><div class="center">Obrigado!</div><script>window.print();window.close();</script></body></html>`;
    win.document.write(html); win.document.close();
    setShowConfirm(false); setShowPay(false); setCart([]); setRecebido("");
  };

  const openPay = () => { if(forma==="dinheiro") setRecebido(""); else setRecebido(String(total)); setShowPay(true); };

  return (
    <div className="h-full w-full flex flex-col bg-[#F5F7FB] overflow-hidden">
      <div className="h-[64px] px-4 md:px-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-black/5 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center"><X size={16}/></button>
          <p className="font-black text-[15px]">Restaurante PDV</p>
        </div>
        <div className="hidden md:flex bg-[#EEF2F8] rounded-full px-4 py-2.5 items-center gap-2 w-[260px]"><Search size={14} className="text-gray-400"/><input placeholder="Buscar prato..." className="bg-transparent outline-none text-[13px] w-full"/></div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F5F7FB] p-3 md:p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {PRODUCTS.map(p=>{
              const qty=getQty(p.id);
              return (<div key={p.id} className="bg-white/80 border border-white/60 rounded-[18px] p-2.5 shadow-sm"><div className="relative"><img src={p.img} className="w-full h-[110px] object-cover rounded-[12px]" style={{border:'2px solid #fff'}} alt=""/><span className="absolute top-2 left-2 bg-white/90 text-[10px] px-2.5 py-1 rounded-full border">Available: {p.avail}</span></div><p className="font-semibold text-[12px] mt-2 truncate">{p.name}</p><div className="flex justify-between items-center mt-2"><p className="text-[12px] font-black">Rp {p.price.toLocaleString("de-DE")}</p>{qty===0?<button onClick={()=>add(p)} className="bg-black text-white rounded-full px-3.5 py-1.5 text-[11px]">Order</button>:<div className="flex items-center gap-1 bg-black text-white rounded-full px-1 py-1"><button onClick={()=>sub(p)} className="w-5 h-5 bg-white/20 rounded-full flex justify-center items-center"><Minus size={12}/></button><span className="text-[11px] w-4 text-center">{qty}</span><button onClick={()=>add(p)} className="w-5 h-5 bg-white text-black rounded-full flex justify-center items-center"><Plus size={12}/></button></div>}</div></div>)
            })}
          </div>
        </div>

        <div className="w-full lg:w-[340px] bg-white/90 backdrop-blur-2xl border-t lg:border-l border-black/5 flex flex-col h-[42dvh] lg:h-auto shrink-0">
          <div className="p-4 flex justify-between items-center border-b"><p className="font-bold text-[14px]">Seu pedido</p><span className="text-[11px] bg-black text-white px-3 py-1 rounded-full">{cart.length} itens</span></div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">{cart.map(i=>(<div key={i.id} className="flex gap-3 bg-[#F8FAFF] border rounded-[14px] p-2.5"><img src={i.img} className="w-12 h-12 rounded-[10px] object-cover" style={{border:'2px solid #fff'}} alt=""/><div className="flex-1 min-w-0"><p className="font-semibold text-[12px] truncate">{i.name}</p><p className="text-[11px] text-gray-500">Rp {i.price.toLocaleString()} x {i.qtd}</p></div><p className="font-bold text-[12px]">Rp {(i.price*i.qtd).toLocaleString()}</p></div>))}</div>

          {/* SELECT ESTILIZADO IGUAL TAB VENDA */}
          <div className="p-3 border-t bg-white/90 backdrop-blur-xl space-y-2.5">
            <div className="bg-[#F5F7FB] border border-black/5 rounded-[14px] p-2.5">
              <p className="text-[10px] font-bold tracking-widest text-gray-400 mb-1.5 ml-1">FORMA DE PAGAMENTO</p>
              <div className="relative">
                <select value={forma} onChange={(e)=>setForma(e.target.value as any)} className="w-full appearance-none bg-white border border-white/60 shadow-sm rounded-full px-4 py-2.5 text-[13px] font-bold outline-none focus:border-black/20">
                  <option value="dinheiro">Dinheiro</option>
                  <option value="transferencia">Transferência</option>
                  <option value="tpa">TPA</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
              </div>
            </div>
            <div className="flex justify-between text-[12px] px-1"><span className="text-gray-500">Total</span><span className="font-black text-[15px]">Kz {total.toLocaleString()}</span></div>
            <button disabled={cart.length===0} onClick={openPay} className="w-full bg-[#2F4A8A] disabled:bg-gray-300 text-white rounded-full py-3 font-bold text-[13px]">Pagar • Kz {total.toLocaleString()}</button>
          </div>
        </div>
      </div>

      {/* CALCULADORA AJUSTADA - SEM BLOCO EXTRA, SEM TEXTO ESC, BOTOES FINOS */}
      {showPay && (
        <div className="absolute inset-0 z-[200] bg-black/30 backdrop-blur-md flex items-center justify-center p-3">
          <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-2xl rounded-[22px] border border-white/60 shadow-2xl overflow-hidden">
            <div className="p-3.5 space-y-3">

              {/* TIPO DE PAGAMENTO ONDE ERA VALOR A PAGAR */}
              <div className="bg-[#F5F7FB] rounded-[14px] p-3 border border-black/5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] font-bold tracking-wide text-gray-500 uppercase">{forma}</span>
                  <span className="font-black text-[14px]">Kz {total.toLocaleString()}</span>
                </div>

                <div className="bg-white rounded-[12px] px-3 py-2.5 border flex justify-between items-center shadow-sm">
                  <div><p className="text-[8px] text-gray-400 tracking-widest font-bold">VALOR RECEBIDO</p><p className="text-[18px] font-black leading-none mt-1">Kz {recebido||"0"}</p></div>
                  <div className="w-8 h-8 bg-[#EEF4FF] rounded-full flex items-center justify-center"><Banknote size={14} className="text-[#2F4A8A]"/></div>
                </div>

                {forma==="dinheiro" && (
                  <div className={`rounded-[12px] px-3 py-2 flex justify-between items-center border ${troco>=0?"bg-[#E8F5E9] border-green-200":"bg-[#FFEBEE] border-red-200"}`}>
                    <span className="text-[10px] font-black">{troco>=0?"TROCO":"FALTA"}</span>
                    <span className={`text-[13px] font-black ${troco>=0?"text-green-700":"text-red-600"}`}>Kz {Math.abs(troco).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {forma==="dinheiro" && (
                <div className="grid grid-cols-4 gap-2">
                  <button onClick={()=>handleCalc("7")} className="h-[42px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px] active:scale-95">7</button>
                  <button onClick={()=>handleCalc("8")} className="h-[42px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px] active:scale-95">8</button>
                  <button onClick={()=>handleCalc("9")} className="h-[42px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px] active:scale-95">9</button>
                  <button onClick={()=>handleCalc("DEL")} className="h-[42px] rounded-[12px] bg-black text-white flex justify-center items-center active:scale-95"><Delete size={16}/></button>
                  <button onClick={()=>handleCalc("4")} className="h-[42px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px] active:scale-95">4</button>
                  <button onClick={()=>handleCalc("5")} className="h-[42px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px] active:scale-95">5</button>
                  <button onClick={()=>handleCalc("6")} className="h-[42px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px] active:scale-95">6</button>
                  <button onClick={()=>handleCalc("C")} className="h-[42px] rounded-[12px] bg-black text-white font-black text-[13px] active:scale-95">C</button>
                  <button onClick={()=>handleCalc("1")} className="h-[42px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px] active:scale-95">1</button>
                  <button onClick={()=>handleCalc("2")} className="h-[42px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px] active:scale-95">2</button>
                  <button onClick={()=>handleCalc("3")} className="h-[42px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px] active:scale-95">3</button>
                  <button onClick={()=>handleCalc("00")} className="h-[42px] rounded-[12px] bg-white/70 border shadow-sm font-bold text-[12px] active:scale-95">00</button>
                  <button onClick={()=>handleCalc("0")} className="h-[42px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px] active:scale-95 col-span-2">0</button>
                  <button onClick={()=>handleCalc(".")} className="h-[42px] rounded-[12px] bg-white border shadow-sm font-bold text-[16px] active:scale-95 col-span-2">.</button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <button onClick={()=>setShowPay(false)} className="h-[40px] bg-[#EF4444] text-white rounded-full flex items-center justify-center shadow-sm active:scale-95"><X size={18}/></button>
                <button disabled={forma==="dinheiro" && recebidoNum < total} onClick={()=>setShowConfirm(true)} className="h-[40px] bg-[#16A34A] disabled:bg-gray-300 text-white rounded-full flex items-center justify-center shadow-sm active:scale-95"><Check size={18}/></button>
              </div>

            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="absolute inset-0 z-[300] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-[320px] bg-white rounded-[20px] p-5 border shadow-2xl text-center">
            <div className="w-11 h-11 bg-[#EEF4FF] rounded-full flex items-center justify-center mx-auto mb-3"><Printer size={18} className="text-[#2F4A8A]"/></div>
            <h3 className="font-black text-[14px]">Finalizar venda?</h3>
            <p className="text-[11px] text-gray-500 mt-1">Kz {total.toLocaleString()} • {forma}</p>
            <div className="flex gap-2 mt-4"><button onClick={()=>setShowConfirm(false)} className="flex-1 bg-white border rounded-full py-2.5 text-[12px]">Cancelar</button><button onClick={imprimirFatura} className="flex-1 bg-black text-white rounded-full py-2.5 text-[12px] font-bold">Sim</button></div>
          </div>
        </div>
      )}

      <style jsx>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
    </div>
  );
}

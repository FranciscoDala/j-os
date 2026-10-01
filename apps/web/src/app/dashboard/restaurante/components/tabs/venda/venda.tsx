"use client";
import { useState } from "react";
import { X, Plus, Minus, Search, Clock3, SlidersHorizontal, Delete, Banknote, Printer, Check } from "lucide-react";

const PRODUCTS = [
  { id:1, name:"Tomato with Tofu Salad", price:97750, avail:10, cat:"Main", img:"https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400" },
  { id:2, name:"Japanese Chicken Gyoza", price:81700, avail:15, cat:"Main", img:"https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=400" },
  { id:3, name:"2pcs of Amazing Avocado", price:68000, avail:10, cat:"Appetizer", img:"https://images.unsplash.com/photo-1526948128573-703ee1aeb6f8?q=80&w=400" },
  { id:4, name:"Lettuce with Stuff", price:170000, avail:8, cat:"Main", img:"https://images.unsplash.com/photo-1512621776952-a57141f2eefd?q=80&w=400" },
  { id:5, name:"Biscuit Mama with Susu", price:60000, avail:12, cat:"Dessert", img:"https://images.unsplash.com/photo-1559620192-032c4bc4674e?q=80&w=400" },
  { id:6, name:"Krosang Thats it", price:78000, avail:9, cat:"Dessert", img:"https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=400" },
  { id:7, name:"Strawberry Float", price:45000, avail:20, cat:"Beverages", img:"https://images.unsplash.com/photo-1488477181946-64290103bbd6?q=80&w=400" },
  { id:8, name:"Healthy Kids Meal", price:83000, avail:7, cat:"Kids", img:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400" },
];

export function VendasTab({ onClose }: { onClose: () => void }) {
  const [activeCat, setActiveCat] = useState("All");
  const [cart, setCart] = useState<any[]>([]);
  const [showPay, setShowPay] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recebido, setRecebido] = useState("");

  const cats = ["All","Main Course","Appetizer","Dessert","Side Dishes","Beverages","Kids"];
  const add = (p:any) => { const ex = cart.find(c=>c.id===p.id); if(ex) setCart(cart.map(c=>c.id===p.id?{...c,qtd:c.qtd+1}:c)); else setCart([...cart,{...p,qtd:1}]); };
  const sub = (p:any) => { const ex = cart.find(c=>c.id===p.id); if(!ex) return; if(ex.qtd===1) setCart(cart.filter(c=>c.id!==p.id)); else setCart(cart.map(c=>c.id===p.id?{...c,qtd:c.qtd-1}:c)); };
  const getQty = (id:number) => cart.find(c=>c.id===id)?.qtd || 0;
  const total = cart.reduce((s,i)=>s+i.price*i.qtd,0);
  const recebidoNum = Number(recebido) || 0;
  const troco = recebidoNum - total;

  const handleCalc = (val:string) => {
    if(val==="C") setRecebido("");
    else if(val==="DEL") setRecebido(s=>s.slice(0,-1));
    else { if(val==="." && recebido.includes(".")) return; if(val==="00" && recebido==="") return; setRecebido(s=> (s+val).slice(0,9)); }
  };

  const filtered = activeCat==="All"?PRODUCTS:PRODUCTS.filter(p=>p.cat===activeCat || activeCat.includes(p.cat));

  const imprimirFatura = () => {
    const win = window.open("", "_blank", "width=320,height=600");
    if(!win) return;
    const html = `<html><head><style>body{font-family:monospace;width:80mm;padding:10px;font-size:12px}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0} table{width:100%}</style></head><body><div class="center bold">RESTAURANTE JENATH<br/>Talatona</div><div class="line"></div><div>${new Date().toLocaleString()}</div><div class="line"></div><table>${cart.map(i=>`<tr><td>${i.name} x${i.qtd}</td><td style="text-align:right">Rp ${(i.price*i.qtd).toLocaleString()}</td></tr>`).join("")}</table><div class="line"></div><table><tr><td class="bold">TOTAL</td><td style="text-align:right" class="bold">Rp ${total.toLocaleString()}</td></tr><tr><td>Recebido</td><td style="text-align:right">Rp ${recebidoNum.toLocaleString()}</td></tr><tr><td class="bold">TROCO</td><td style="text-align:right" class="bold">Rp ${troco.toLocaleString()}</td></tr></table><div class="line"></div><div class="center">Obrigado!</div><script>window.print();window.close();</script></body></html>`;
    win.document.write(html); win.document.close();
    setShowConfirm(false); setShowPay(false); setCart([]); setRecebido("");
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#F5F7FB] overflow-hidden">
      <div className="h-[60px] px-4 md:px-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-black/5 shrink-0">
        <div className="flex items-center gap-3"><button onClick={onClose} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center"><X size={15}/></button><p className="font-black text-[14px]">Restaurante PDV</p></div>
        <div className="hidden md:flex bg-[#EEF2F8] rounded-full px-4 py-2 items-center gap-2 w-[240px]"><Search size={14} className="text-gray-400"/><input placeholder="Buscar..." className="bg-transparent outline-none text-[12px] w-full"/></div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F5F7FB] p-3 md:p-5">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {PRODUCTS.map(p=>{
              const qty=getQty(p.id);
              return (<div key={p.id} className="bg-white/80 backdrop-blur border border-white/60 rounded-[16px] p-2 shadow-sm"><div className="relative"><img src={p.img} className="w-full h-[90px] object-cover rounded-[10px]" style={{border:'2px solid #fff'}} alt=""/><span className="absolute top-1.5 left-1.5 bg-white/90 text-[9px] px-2 py-0.5 rounded-full border">Available: {p.avail}</span></div><p className="font-semibold text-[11px] mt-2 truncate">{p.name}</p><div className="flex justify-between items-center mt-1.5"><p className="text-[11px] font-black">Rp {p.price.toLocaleString()}</p>{qty===0?<button onClick={()=>add(p)} className="bg-black text-white rounded-full px-3 py-1 text-[10px]">Order</button>:<div className="flex items-center gap-1 bg-black text-white rounded-full px-1 py-0.5"><button onClick={()=>sub(p)} className="w-5 h-5 bg-white/20 rounded-full flex justify-center items-center"><Minus size={10}/></button><span className="text-[10px] w-3 text-center">{qty}</span><button onClick={()=>add(p)} className="w-5 h-5 bg-white text-black rounded-full flex justify-center items-center"><Plus size={10}/></button></div>}</div></div>)
            })}
          </div>
        </div>
        <div className="w-full lg:w-[320px] bg-white/90 backdrop-blur-2xl border-t lg:border-l border-black/5 flex flex-col h-[38dvh] lg:h-auto shrink-0">
          <div className="p-3 flex justify-between items-center border-b"><p className="font-bold text-[13px]">Seu pedido</p><span className="text-[10px] bg-black text-white px-2.5 py-1 rounded-full">{cart.length}</span></div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-2.5 space-y-2">{cart.map(i=>(<div key={i.id} className="flex gap-2 bg-[#F8FAFF] border rounded-[12px] p-2"><img src={i.img} className="w-10 h-10 rounded-[8px] object-cover" style={{border:'2px solid #fff'}} alt=""/><div className="flex-1 min-w-0"><p className="font-semibold text-[11px] truncate">{i.name}</p><p className="text-[10px] text-gray-500">Rp {i.price.toLocaleString()} x {i.qtd}</p></div><p className="font-bold text-[11px]">Rp {(i.price*i.qtd).toLocaleString()}</p></div>))}</div>
          <div className="p-3 border-t bg-white"><div className="flex justify-between text-[11px] mb-2"><span>Total</span><span className="font-black text-[14px]">Rp {total.toLocaleString()}</span></div><button disabled={cart.length===0} onClick={()=>{setRecebido(""); setShowPay(true)}} className="w-full bg-[#2F4A8A] disabled:bg-gray-300 text-white rounded-full py-3 font-bold text-[12px]">Pagar • Rp {total.toLocaleString()}</button></div>
        </div>
      </div>

      {/* CALCULADORA GLASS - 400PX, SEM HEADER, COMPLETA */}
      {showPay && (
        <div className="absolute inset-0 z-[200] bg-[#5A8AD4]/30 backdrop-blur-[8px] flex items-center justify-center p-3">
          <div className="w-full max-w-[400px] bg-white/90 backdrop-blur-2xl rounded-[22px] shadow-[0_20px_60px_rgba(0,0,0,0.2)] border border-white/60 overflow-hidden flex flex-col">

            {/* CONTEUDO SEM HEADER */}
            <div className="p-4 space-y-3">
              {/* DISPLAY GLASS */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[12px] text-gray-500 font-medium">Valor a Pagar</span>
                  <span className="font-black text-[15px] tracking-tight">Rp {total.toLocaleString("de-DE")}</span>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-[14px] p-3.5 border border-white/80 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="text-[9px] text-gray-400 tracking-[0.15em] font-bold">VALOR RECEBIDO</p>
                    <p className="text-[22px] font-black leading-none mt-1 tracking-tight">Rp {recebido||"0"}</p>
                  </div>
                  <div className="w-10 h-10 bg-[#EEF4FF]/80 backdrop-blur rounded-full flex items-center justify-center border border-white"><Banknote size={18} className="text-[#2F4A8A]"/></div>
                </div>

                <div className={`rounded-[12px] px-3.5 py-2.5 flex justify-between items-center border backdrop-blur-xl ${troco>=0?"bg-[#E8F5E9]/90 border-green-200 text-green-800":"bg-[#FFEBEE]/90 border-red-200 text-red-700"}`}>
                  <span className="text-[11px] font-black tracking-wide">{troco>=0?"TROCO":"FALTA"}</span>
                  <span className="text-[16px] font-black">Rp {Math.abs(troco).toLocaleString("de-DE")}</span>
                </div>
              </div>

              {/* TECLADO - APENAS 1x "." e 1x "00" */}
              <div className="grid grid-cols-4 gap-2.5">
                {/* Linha 1 */}
                <button onClick={()=>handleCalc("7")} className="h-[46px] rounded-[12px] bg-white/90 backdrop-blur border border-black/5 font-bold text-[15px] shadow-sm active:scale-95">7</button>
                <button onClick={()=>handleCalc("8")} className="h-[46px] rounded-[12px] bg-white/90 backdrop-blur border border-black/5 font-bold text-[15px] shadow-sm active:scale-95">8</button>
                <button onClick={()=>handleCalc("9")} className="h-[46px] rounded-[12px] bg-white/90 backdrop-blur border border-black/5 font-bold text-[15px] shadow-sm active:scale-95">9</button>
                <button onClick={()=>handleCalc("DEL")} className="h-[46px] rounded-[12px] bg-black text-white border border-black font-bold shadow-sm active:scale-95 flex items-center justify-center"><Delete size={18}/></button>
                {/* Linha 2 */}
                <button onClick={()=>handleCalc("4")} className="h-[46px] rounded-[12px] bg-white/90 backdrop-blur border border-black/5 font-bold text-[15px] shadow-sm active:scale-95">4</button>
                <button onClick={()=>handleCalc("5")} className="h-[46px] rounded-[12px] bg-white/90 backdrop-blur border border-black/5 font-bold text-[15px] shadow-sm active:scale-95">5</button>
                <button onClick={()=>handleCalc("6")} className="h-[46px] rounded-[12px] bg-white/90 backdrop-blur border border-black/5 font-bold text-[15px] shadow-sm active:scale-95">6</button>
                <button onClick={()=>handleCalc("C")} className="h-[46px] rounded-[12px] bg-black text-white border border-black font-black text-[14px] shadow-sm active:scale-95">C</button>
                {/* Linha 3 */}
                <button onClick={()=>handleCalc("1")} className="h-[46px] rounded-[12px] bg-white/90 backdrop-blur border border-black/5 font-bold text-[15px] shadow-sm active:scale-95">1</button>
                <button onClick={()=>handleCalc("2")} className="h-[46px] rounded-[12px] bg-white/90 backdrop-blur border border-black/5 font-bold text-[15px] shadow-sm active:scale-95">2</button>
                <button onClick={()=>handleCalc("3")} className="h-[46px] rounded-[12px] bg-white/90 backdrop-blur border border-black/5 font-bold text-[15px] shadow-sm active:scale-95">3</button>
                <button onClick={()=>handleCalc("00")} className="h-[46px] rounded-[12px] bg-white/70 backdrop-blur border border-black/5 font-bold text-[13px] shadow-sm active:scale-95">00</button>
                {/* Linha 4 - só 1x "0" e 1x "." */}
                <button onClick={()=>handleCalc("0")} className="h-[46px] rounded-[12px] bg-white/90 backdrop-blur border border-black/5 font-bold text-[15px] shadow-sm active:scale-95 col-span-2">0</button>
                <button onClick={()=>handleCalc(".")} className="h-[46px] rounded-[12px] bg-white/90 backdrop-blur border border-black/5 font-bold text-[16px] shadow-sm active:scale-95 col-span-2">.</button>
              </div>

              {/* CANCELAR E CONFIRMAR - APARECEM COMPLETOS */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button onClick={()=>setShowPay(false)} className="h-[48px] bg-[#EF4444] hover:bg-red-600 text-white rounded-full font-bold text-[13px] flex items-center justify-center gap-2 shadow-lg shadow-red-200 active:scale-[0.98] transition-all">
                  <X size={16}/> Cancelar
                </button>
                <button disabled={recebidoNum < total} onClick={()=>setShowConfirm(true)} className="h-[48px] bg-[#16A34A] hover:bg-green-600 disabled:bg-gray-300 disabled:shadow-none text-white rounded-full font-bold text-[13px] flex items-center justify-center gap-2 shadow-lg shadow-green-200 active:scale-[0.98] transition-all">
                  <Check size={16}/> Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="absolute inset-0 z-[300] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] bg-white/95 backdrop-blur-2xl rounded-[20px] p-5 border border-white/60 shadow-2xl text-center">
            <div className="w-12 h-12 bg-[#EEF4FF] rounded-full flex items-center justify-center mx-auto mb-3"><Printer size={20} className="text-[#2F4A8A]"/></div>
            <h3 className="font-black text-[14px]">Finalizar venda?</h3>
            <p className="text-[11px] text-gray-500 mt-1.5">Recebido Rp {recebidoNum.toLocaleString()} • Troco Rp {troco.toLocaleString()}</p>
            <div className="flex gap-2 mt-4"><button onClick={()=>setShowConfirm(false)} className="flex-1 bg-white border border-black/10 rounded-full py-2.5 text-[12px]">Voltar</button><button onClick={imprimirFatura} className="flex-1 bg-black text-white rounded-full py-2.5 text-[12px] font-bold">Sim, Finalizar</button></div>
          </div>
        </div>
      )}

      <style jsx>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
    </div>
  );
}

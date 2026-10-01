"use client";
import { useState } from "react";
import { X, Plus, Minus, Search, Clock3, SlidersHorizontal, Delete, Banknote, Printer, Check } from "lucide-react";

const PRODUCTS = [
  { id:1, name:"Tomato with Tofu Salad", price:97750, avail:10, cat:"Main", img:"https://images.unsplash.com/photo-1540420773420-3366772f4999?q=80&w=400", discount:"15%" },
  { id:2, name:"Japanese Chicken Gyoza", price:81700, avail:15, cat:"Main", img:"https://images.unsplash.com/photo-1496116218417-1a781b1c416c?q=80&w=400", discount:"15%" },
  { id:3, name:"2pcs of Amazing Avocado", price:68000, avail:10, cat:"Appetizer", img:"https://images.unsplash.com/photo-1526948128573-703ee1aeb6f8?q=80&w=400", discount:"" },
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

  const cats = ["All","Main Course","Appetizer","Dessert","Side Dishes","Beverages","Kids"];

  const add = (p:any) => {
    const ex = cart.find(c=>c.id===p.id);
    if(ex) setCart(cart.map(c=>c.id===p.id?{...c,qtd:c.qtd+1}:c));
    else setCart([...cart,{...p,qtd:1}]);
  };
  const sub = (p:any) => {
    const ex = cart.find(c=>c.id===p.id);
    if(!ex) return;
    if(ex.qtd===1) setCart(cart.filter(c=>c.id!==p.id));
    else setCart(cart.map(c=>c.id===p.id?{...c,qtd:c.qtd-1}:c));
  };
  const getQty = (id:number) => cart.find(c=>c.id===id)?.qtd || 0;
  const total = cart.reduce((s,i)=>s+i.price*i.qtd,0);
  const recebidoNum = Number(recebido.replace(/\./g,"").replace(",",".")) || 0;
  const troco = recebidoNum - total;

  const handleCalc = (val:string) => {
    if(val==="C") setRecebido("");
    else if(val==="DEL") setRecebido(s=>s.slice(0,-1));
    else {
      if(val==="." && recebido.includes(".")) return;
      setRecebido(s=> (s+val).slice(0,12));
    }
  };

  const filtered = activeCat==="All"?PRODUCTS:PRODUCTS.filter(p=>p.cat===activeCat || activeCat.includes(p.cat));

  const imprimirFatura = () => {
    const win = window.open("", "_blank", "width=320,height=600");
    if(!win) return;
    const html = `
    <html><head><style>
      body{font-family:monospace;width:80mm;padding:10px;font-size:12px;color:#000}
     .center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}
      table{width:100%} td{padding:2px 0}
    </style></head><body>
      <div class="center bold">RESTAURANTE JENATH<br/>NIF: 123456789<br/>Talatona, Luanda</div>
      <div class="line"></div>
      <div>Data: ${new Date().toLocaleString()}<br/>Mesa: Balcão<br/>Operador: Admin</div>
      <div class="line"></div>
      <table>${cart.map(i=>`<tr><td>${i.name} x${i.qtd}</td><td style="text-align:right">Rp ${ (i.price*i.qtd).toLocaleString("de-DE")}</td></tr>`).join("")}</table>
      <div class="line"></div>
      <table>
        <tr><td class="bold">TOTAL</td><td style="text-align:right" class="bold">Rp ${total.toLocaleString("de-DE")}</td></tr>
        <tr><td>Recebido</td><td style="text-align:right">Rp ${recebidoNum.toLocaleString("de-DE")}</td></tr>
        <tr><td class="bold">TROCO</td><td style="text-align:right" class="bold">Rp ${troco.toLocaleString("de-DE")}</td></tr>
      </table>
      <div class="line"></div>
      <div class="center">Obrigado pela preferência!<br/>Volte sempre</div>
      <script>window.print(); window.close();</script>
    </body></html>`;
    win.document.write(html);
    win.document.close();
    setShowConfirm(false);
    setShowPay(false);
    setCart([]);
    setRecebido("");
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#F5F7FB] overflow-hidden">
      <div className="h-[64px] px-4 md:px-6 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-black/5 shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center active:scale-95"><X size={16}/></button>
          <p className="font-black text-[15px]">Restaurante PDV</p>
          <span className="hidden md:flex items-center gap-1 text-[11px] bg-black/5 px-3 py-1 rounded-full"><Clock3 size={12}/>Ends in 12:10:09</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden md:flex bg-[#EEF2F8] rounded-full px-4 py-2.5 items-center gap-2 w-[260px]">
            <Search size={14} className="text-gray-400"/><input placeholder="Buscar prato..." className="bg-transparent outline-none text-[13px] w-full"/>
          </div>
          <button onClick={onClose} className="bg-black text-white rounded-full px-4 py-2 text-[12px] font-bold md:hidden">Sair</button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F5F7FB] p-3 md:p-5">
          <div className="flex items-center justify-between mb-3"><h2 className="font-bold text-[14px]">Special Discount Today</h2><span className="text-[11px] text-gray-500">Ends in 12:10:09</span></div>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
            {filtered.slice(0,4).map(p=>{
              const qty=getQty(p.id);
              return (
                <div key={p.id} className="bg-white/90 backdrop-blur-xl border border-white/60 rounded-[18px] p-2.5 shadow-sm">
                  <div className="relative"><img src={p.img} className="w-full h-[110px] object-cover rounded-[12px]" style={{border:'2px solid #fff'}} alt=""/><span className="absolute top-2 left-2 bg-white/90 text-[10px] px-2.5 py-1 rounded-full border">Available: {p.avail}</span></div>
                  <p className="font-semibold text-[12px] mt-2 truncate">{p.name}</p>
                  <div className="flex justify-between items-center mt-2"><p className="text-[12px] font-black">Rp {p.price.toLocaleString("de-DE")}</p>{qty===0?<button onClick={()=>add(p)} className="bg-black text-white rounded-full px-3.5 py-1.5 text-[11px]">Order</button>:<div className="flex items-center gap-1 bg-black text-white rounded-full px-1 py-1"><button onClick={()=>sub(p)} className="w-5 h-5 bg-white/20 rounded-full flex justify-center items-center"><Minus size={12}/></button><span className="text-[11px] w-4 text-center">{qty}</span><button onClick={()=>add(p)} className="w-5 h-5 bg-white text-black rounded-full flex justify-center items-center"><Plus size={12}/></button></div>}</div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between mb-3"><h2 className="font-bold text-[14px]">Explore Our Best Menu</h2><button className="text-[11px] bg-white border px-3 py-1 rounded-full">View All</button></div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 mb-1">{cats.map(c=><button key={c} onClick={()=>setActiveCat(c==="All"?"All":c.split(" ")[0])} className={`whitespace-nowrap px-4 py-2 rounded-full text-[12px] border shrink-0 ${activeCat.startsWith(c.split(" ")[0])||c==="All"&&activeCat==="All"?"bg-black text-white border-black":"bg-white/80 text-gray-600 border-white/60"}`}>{c}</button>)}<button className="px-3 py-2 rounded-full bg-white border shrink-0"><SlidersHorizontal size={14}/></button></div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {PRODUCTS.map(p=>{
              const qty=getQty(p.id);
              return (
                <div key={`all-${p.id}`} className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[18px] p-2.5 shadow-sm">
                  <div className="relative"><img src={p.img} className="w-full h-[110px] object-cover rounded-[12px]" style={{border:'2px solid #fff'}} alt=""/><span className="absolute top-2 left-2 bg-white/90 text-[10px] px-2 py-1 rounded-full border">Available: {p.avail}</span></div>
                  <p className="font-semibold text-[12px] mt-2 truncate">{p.name}</p>
                  <div className="flex justify-between items-center mt-2"><p className="text-[12px] font-black">Rp {p.price.toLocaleString("de-DE")}</p>{qty===0?<button onClick={()=>add(p)} className="border bg-white rounded-full px-3 py-1 text-[11px]">Order</button>:<div className="flex items-center gap-1 bg-black text-white rounded-full px-1 py-1"><button onClick={()=>sub(p)} className="w-5 h-5 bg-white/20 rounded-full flex justify-center items-center"><Minus size={12}/></button><span className="text-[11px] w-4 text-center">{qty}</span><button onClick={()=>add(p)} className="w-5 h-5 bg-white text-black rounded-full flex justify-center items-center"><Plus size={12}/></button></div>}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="w-full lg:w-[340px] bg-white/90 backdrop-blur-2xl border-t lg:border-l border-black/5 flex flex-col h-[42dvh] lg:h-auto shrink-0">
          <div className="p-4 flex justify-between items-center border-b border-black/5"><p className="font-bold text-[14px]">Seu pedido</p><span className="text-[11px] bg-black text-white px-3 py-1 rounded-full">{cart.length} itens</span></div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">{cart.length===0&&<p className="text-center text-[12px] text-gray-400 mt-10">Nenhum item</p>}{cart.map(i=>(<div key={i.id} className="flex gap-3 bg-[#F8FAFF] border rounded-[14px] p-2.5"><img src={i.img} className="w-12 h-12 rounded-[10px] object-cover" style={{border:'2px solid #fff'}} alt=""/><div className="flex-1 min-w-0"><p className="font-semibold text-[12px] truncate">{i.name}</p><p className="text-[11px] text-gray-500">Rp {i.price.toLocaleString("de-DE")} x {i.qtd}</p></div><p className="font-bold text-[12px]">Rp {(i.price*i.qtd).toLocaleString("de-DE")}</p></div>))}</div>
          <div className="p-4 border-t bg-white/90 backdrop-blur-xl"><div className="flex justify-between text-[12px] mb-3"><span className="text-gray-500">Total</span><span className="font-black text-[15px]">Rp {total.toLocaleString("de-DE")}</span></div><button disabled={cart.length===0} onClick={()=>{setRecebido(""); setShowPay(true)}} className="w-full bg-[#2F4A8A] disabled:bg-gray-300 text-white rounded-full py-3.5 font-bold text-[13px] active:scale-[0.98]">Pagar • Rp {total.toLocaleString("de-DE")}</button></div>
        </div>
      </div>

      {/* MODAL CALCULADORA */}
      {showPay && (
        <div className="absolute inset-0 z-[200] bg-black/30 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="w-full md:w-[380px] bg-white/95 backdrop-blur-2xl md:rounded-[24px] rounded-t-[24px] border border-white/50 shadow-2xl overflow-hidden animate-in slide-in-from-bottom">
            <div className="p-5 pb-3 flex justify-between items-center border-b border-black/5">
              <div><p className="font-bold text-[14px]">Pagamento</p><p className="text-[11px] text-gray-500">Digite o valor recebido</p></div>
              <button onClick={()=>setShowPay(false)} className="w-9 h-9 bg-black/5 rounded-full flex items-center justify-center"><X size={16}/></button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-[#F5F7FB] rounded-[16px] p-4 border border-black/5 space-y-3">
                <div className="flex justify-between text-[12px]"><span className="text-gray-500">Valor a Pagar</span><span className="font-black text-[16px]">Rp {total.toLocaleString("de-DE")}</span></div>
                <div className="bg-white rounded-[12px] p-3 border flex justify-between items-center">
                  <div><p className="text-[10px] text-gray-400 uppercase tracking-wide">Valor Recebido</p><p className="text-[22px] font-black leading-none mt-1">Rp {recebido||"0"}</p></div>
                  <div className="w-10 h-10 bg-[#EEF4FF] rounded-full flex items-center justify-center"><Banknote size={18} className="text-[#2F4A8A]"/></div>
                </div>
                <div className={`rounded-[12px] p-3 border flex justify-between items-center ${troco>=0?"bg-[#E8F5E9] border-green-200":"bg-[#FFEBEE] border-red-200"}`}>
                  <p className="text-[11px] font-medium">{troco>=0?"TROCO":"FALTA"}</p>
                  <p className={`text-[18px] font-black ${troco>=0?"text-green-700":"text-red-600"}`}>Rp {Math.abs(troco).toLocaleString("de-DE")}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2.5">
                {[["7","8","9","DEL"],["4","5","6","C"],["1","2","3","00"],["0",".","+5k","+10k"]].flat().map(k=>{
                  const isAction = ["DEL","C"].includes(k);
                  const isQuick = k.includes("k");
                  return (
                    <button key={k} onClick={()=>{
                      if(isQuick){
                        const addVal = k==="+5k"?5000:10000;
                        setRecebido(s=>String((Number(s||0)+addVal)));
                      } else handleCalc(k);
                    }} className={`h-[52px] rounded-[14px] font-bold text-[15px] active:scale-95 transition border ${isAction?"bg-black text-white border-black": isQuick?"bg-[#FFE86A] border-[#FFE86A] text-black text-[12px]":"bg-white border-black/10 text-black"}`}>
                      {k==="DEL"?<Delete size={18} className="mx-auto"/>:k}
                    </button>
                  )
                })}
              </div>

              <button disabled={recebidoNum < total} onClick={()=>setShowConfirm(true)} className="w-full bg-[#2F4A8A] disabled:bg-gray-300 text-white rounded-full py-4 font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98]">
                <Check size={18}/> Confirmar • Troco Rp {troco>=0?troco.toLocaleString("de-DE"):"0"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO ESTILIZADO */}
      {showConfirm && (
        <div className="absolute inset-0 z-[300] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-[340px] bg-white/95 backdrop-blur-2xl rounded-[24px] p-6 border border-white/60 shadow-2xl text-center">
            <div className="w-14 h-14 bg-[#EEF4FF] rounded-full flex items-center justify-center mx-auto mb-4 border border-white">
              <Printer size={22} className="text-[#2F4A8A]"/>
            </div>
            <h3 className="font-black text-[16px]">Finalizar venda?</h3>
            <p className="text-[12px] text-gray-500 mt-2 leading-[1.4]">Você recebeu Rp {recebidoNum.toLocaleString("de-DE")} e o troco é Rp {troco.toLocaleString("de-DE")}. Deseja imprimir a fatura na impressora térmica?</p>
            <div className="bg-[#F5F7FB] rounded-[12px] p-3 mt-4 text-left border border-black/5">
              <div className="flex justify-between text-[11px]"><span>Total</span><span className="font-bold">Rp {total.toLocaleString("de-DE")}</span></div>
              <div className="flex justify-between text-[11px] mt-1"><span>Recebido</span><span className="font-bold">Rp {recebidoNum.toLocaleString("de-DE")}</span></div>
              <div className="flex justify-between text-[12px] mt-1 font-black"><span>Troco</span><span>Rp {troco.toLocaleString("de-DE")}</span></div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={()=>setShowConfirm(false)} className="flex-1 bg-white border border-black/10 rounded-full py-3 text-[13px] font-medium">Cancelar</button>
              <button onClick={imprimirFatura} className="flex-1 bg-black text-white rounded-full py-3 text-[13px] font-bold flex items-center justify-center gap-2"><Printer size={14}/> Sim, Finalizar</button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
    </div>
  );
}

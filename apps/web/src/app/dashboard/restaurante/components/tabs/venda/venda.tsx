"use client";
import { useState, useEffect, useRef } from "react";
import { X, Search, SlidersHorizontal, Delete, Banknote, Printer, Check, AlertTriangle, Info, CheckCircle } from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");
const API_BASE = `${API_URL}/api/v1/produtos`;
const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200";

const getImgUrl = (url?: string) => {
  if (!url) return FALLBACK_IMG;
  if (url.startsWith("blob:")) return url;
  if (url.startsWith("http")) return url;
  if (url.startsWith("/media")) return `${API_URL}${url}`;
  return url;
};

type Toast = { id: string; msg: string; type: "success" | "error" | "info" | "warning" };

export function VendasTab({ onClose }: { onClose: () => void }) {
  const [activeCat, setActiveCat] = useState("All");
  const [searchV, setSearchV] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [catsDb, setCatsDb] = useState<string[]>([]);
  const [loadingProd, setLoadingProd] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [cart, setCart] = useState<any[]>([]);
  const [showPay, setShowPay] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [recebido, setRecebido] = useState("");
  const [forma, setForma] = useState<"dinheiro" | "transferencia" | "tpa">("dinheiro");

  const pushToast = (msg: string, type: Toast["type"] = "info") => {
    const id = Date.now().toString() + Math.random().toString().slice(2);
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id!== id)), 4000);
  };

  // Atalho busca: / ou Ctrl+K
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "/" &&!(e.target instanceof HTMLInputElement)) || (e.ctrlKey && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === "Escape" && showSearch) {
        setShowSearch(false);
        setSearchV("");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSearch]);

  useEffect(() => {
    if (showSearch) searchRef.current?.focus();
  }, [showSearch]);

  useEffect(() => {
    const fetchReal = async () => {
      setLoadingProd(true);
      try {
        const token = localStorage.getItem("access_token");
        const qs = new URLSearchParams({ skip: "0", limit: "100", search: searchV });
        const r = await fetch(`${API_BASE}/?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
        const data = await r.json();
        if (r.ok) setDbProducts((data.items || []).filter((p: any) => p.ativo!== false));
      } catch {}
      setLoadingProd(false);
    };
    fetchReal();
  }, [searchV]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const r = await fetch(`${API_BASE}/categorias/lista`, { headers: { Authorization: `Bearer ${token}` } });
        if (r.ok) setCatsDb(await r.json());
      } catch {}
    };
    fetchCats();
  }, []);

  const cats = ["All",...catsDb];

  const getStockState = (p: any) => {
    if (!p.controlar_stock) return "ok";
    const atual = Number(p.stock_atual?? 0);
    const minimo = Number(p.stock_minimo?? 0);
    if (atual <= 0) return "zero";
    if (atual <= minimo || atual <= 5) return "low";
    return "ok";
  };

  const add = (p: any) => {
    const state = getStockState(p);
    const atual = Number(p.stock_atual?? 0);
    const qtyInCart = cart.find(c => c.id === p.id)?.qtd || 0;

    if (state === "zero") {
      pushToast(`Sem stock: "${p.nome}" está esgotado. Repor stock para continuar a vender.`, "error");
      return;
    }
    if (p.controlar_stock && qtyInCart >= atual) {
      pushToast(`Stock insuficiente: só temos ${atual} un. de "${p.nome}" disponível.`, "warning");
      return;
    }

    const ex = cart.find((c) => c.id === p.id);
    if (ex) setCart(cart.map((c) => (c.id === p.id? {...c, qtd: c.qtd + 1 } : c)));
    else setCart([...cart, { id: p.id, name: p.nome, price: Number(p.preco_venda) || 0, img: getImgUrl(p.imagem_url), qtd: 1 }]);
  };

  const getQty = (id: string) => cart.find((c) => c.id === id)?.qtd || 0;
  const total = cart.reduce((s, i) => s + i.price * i.qtd, 0);
  const recebidoNum = recebido? parseFloat(recebido) : 0;
  const troco = recebidoNum - total;

  const handleCalc = (val: string) => {
    if (val === "C") setRecebido("");
    else if (val === "DEL") setRecebido((s) => s.slice(0, -1));
    else if (val === "00") { if (recebido!== "") setRecebido((s) => s + "00"); }
    else if (val === ".") { if (!recebido.includes(".")) setRecebido((s) => (s === ""? "0." : s + ".")); }
    else { setRecebido((s) => (s + val).slice(0, 10)); }
  };

  useEffect(() => {
    if (!showPay || forma!== "dinheiro") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowPay(false);
      else if (e.key === "Enter") { if (recebidoNum >= total) setShowConfirm(true); }
      else if (e.key === "Backspace") { e.preventDefault(); handleCalc("DEL"); }
      else if (/^[0-9]$/.test(e.key)) handleCalc(e.key);
      else if (e.key === "." || e.key === ",") handleCalc(".");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showPay, forma, recebidoNum, total, recebido]);

  const filteredByCat = activeCat === "All"? dbProducts : dbProducts.filter((p) => (p.categoria || "").toLowerCase() === activeCat.toLowerCase());

  const imprimirFatura = () => {
    const win = window.open("", "_blank", "width=320,height=600");
    if (!win) return;
    const html = `<html><head><style>body{font-family:monospace;width:80mm;padding:10px;font-size:12px;color:#000}.center{text-align:center}.bold{font-weight:bold}.line{border-top:1px dashed #000;margin:8px 0}table{width:100%}td{padding:2px 0}</style></head><body><div class="center bold">RESTAURANTE JENATH<br/>NIF: 123456789<br/>Talatona, Luanda<br/>${forma.toUpperCase()}</div><div class="line"></div><div>Data: ${new Date().toLocaleString()}<br/>Mesa: Balcão<br/>Operador: Admin</div><div class="line"></div><table>${cart.map(i=>`<tr><td>${i.name} x${i.qtd}</td><td style="text-align:right">Kz ${ (i.price*i.qtd).toLocaleString("de-DE")}</td></tr>`).join("")}</table><div class="line"></div><table><tr><td class="bold">TOTAL</td><td style="text-align:right" class="bold">Kz ${total.toLocaleString("de-DE")}</td></tr>${forma==="dinheiro"? `<tr><td>Recebido</td><td style="text-align:right">Kz ${recebidoNum.toLocaleString("de-DE")}</td></tr><tr><td class="bold">TROCO</td><td style="text-align:right" class="bold">Kz ${troco.toLocaleString("de-DE")}</td></tr>` : ``}<tr><td>Pagamento</td><td style="text-align:right">${forma}</td></tr></table><div class="line"></div><div class="center">Obrigado pela preferência!<br/>Volte sempre</div><script>window.print(); window.close();</script></body></html>`;
    win.document.write(html);
    win.document.close();
    setShowConfirm(false); setShowPay(false); setCart([]); setRecebido("");
  };

  return (
    <div className="h-full w-full flex flex-col bg-[#F5F7FB] overflow-hidden relative">
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[360px] pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto flex gap-2.5 items-start p-3.5 rounded-[14px] border backdrop-blur-xl shadow-2xl text-[12px] font-medium ${t.type==="success"?"bg-[#E8F5E9] border-green-200 text-green-800":t.type==="error"?"bg-[#FDECEA] border-red-200 text-red-800":t.type==="warning"?"bg-[#FFF8E1] border-amber-200 text-amber-900":"bg-white border-gray-200 text-gray-800"}`}>
            {t.type==="success" && <CheckCircle size={18} className="shrink-0 mt-0.5"/>}
            {t.type==="error" && <AlertTriangle size={18} className="shrink-0 mt-0.5"/>}
            {t.type==="warning" && <AlertTriangle size={18} className="shrink-0 mt-0.5"/>}
            {t.type==="info" && <Info size={18} className="shrink-0 mt-0.5"/>}
            <span className="flex-1 leading-[1.3]">{t.msg}</span>
            <button onClick={() => setToasts(x => x.filter(f => f.id!== t.id))} className="opacity-60 hover:opacity-100"><X size={14} /></button>
          </div>
        ))}
      </div>

      {/* HEADER - SÓ X NA DIREITA */}
      <div className="h-[48px] px-4 flex items-center justify-end bg-white/80 backdrop-blur-xl border-b border-black/5 shrink-0">
        <button onClick={onClose} className="w-9 h-9 bg-black text-white rounded-full flex items-center justify-center active:scale-95 hover:bg-zinc-800">
          <X size={16}/>
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        <div className="flex-1 overflow-y-auto no-scrollbar bg-[#F5F7FB] p-3 md:p-5">

          {/* LINHA: ICONE BUSCA + CATEGORIAS + CONTAGEM */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">

              {/* BUSCA - SÓ ICONE, CLICA ABRE */}
              <div className="flex items-center shrink-0">
                {!showSearch? (
                  <button onClick={()=>setShowSearch(true)} className="w-9 h-9 bg-white border border-black/5 rounded-full flex items-center justify-center hover:border-black/20 shadow-sm group" title="Buscar ( / ou Ctrl+K )">
                    <Search size={16} className="text-gray-500 group-hover:text-black"/>
                  </button>
                ) : (
                  <div className="relative w-[300px] animate-in fade-in slide-in-from-left-2">
                    <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input
                      ref={searchRef}
                      value={searchV}
                      onChange={e=>setSearchV(e.target.value)}
                      onBlur={()=>{ if(!searchV) setShowSearch(false) }}
                      placeholder="Buscar prato... (ESC pra fechar)"
                      className="w-full h-9 bg-white rounded-full pl-9 pr-9 text-[12px] outline-none border border-black/10 focus:border-black/20 shadow-sm"
                    />
                    <button onClick={()=>{ setSearchV(""); setShowSearch(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/5 rounded-full flex items-center justify-center">
                      <X size={12}/>
                    </button>
                  </div>
                )}
              </div>

              <div className="hidden md:flex items-center gap-2 overflow-x-auto no-scrollbar">
                {cats.map(c=><button key={c} onClick={()=>setActiveCat(c)} className={`whitespace-nowrap px-4 py-2 rounded-full text-[12px] border shrink-0 font-bold ${activeCat===c?"bg-black text-white border-black":"bg-white text-gray-600 border-black/5 hover:border-black/15"}`}>{c===""?"Todas":c}</button>)}
                <button className="w-9 h-9 rounded-full bg-white border border-black/5 flex items-center justify-center shrink-0"><SlidersHorizontal size={14}/></button>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end gap-3">
              <div className="flex md:hidden items-center gap-2 overflow-x-auto no-scrollbar flex-1">
                {cats.map(c=><button key={c} onClick={()=>setActiveCat(c)} className={`whitespace-nowrap px-4 py-2 rounded-full text-[12px] border shrink-0 font-bold ${activeCat===c?"bg-black text-white border-black":"bg-white text-gray-600 border-black/5"}`}>{c===""?"Todas":c}</button>)}
              </div>
              <span className="text-[11px] text-gray-500 font-medium whitespace-nowrap">{loadingProd? "..." : `${filteredByCat.length} produtos`}</span>
            </div>
          </div>

          {loadingProd? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(8)].map((_,i)=><div key={i} className="bg-white rounded-[22px] p-3 h-[198px] animate-pulse flex flex-col items-center"><div className="w-[118px] h-[118px] bg-gray-100 rounded-full"/><div className="h-3 bg-gray-100 rounded mt-3 w-3/4"/><div className="h-3 bg-gray-100 rounded w-1/2 mt-2"/></div>)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-3.5">
              {filteredByCat.map(p=>{
                const qty=getQty(p.id);
                const stockState = getStockState(p);
                const isZero = stockState==="zero";
                const isLow = stockState==="low";
                const atual = Number(p.stock_atual?? 0);

                // cor da borda e do circulo de qtd - mesma cor
                const borderBg = isZero? "bg-red-200" : isLow? "bg-amber-200" : "bg-[#F5E6D3]";
                const qtyCircleBg = isZero? "bg-red-500 text-white" : isLow? "bg-amber-400 text-black" : "bg-[#A67C52] text-white";

                return (
                  <div
                    key={p.id}
                    onDoubleClick={()=>!isZero && add(p)}
                    onClick={()=>{ if(window.innerWidth<768 &&!isZero) add(p) }}
                    className={`
                      group relative rounded-[22px] p-2.5 pt-3 pb-3.5 md:p-3 md:pt-3.5 md:pb-4 shadow-[0_8px_24px_rgba(0,0,0,0.06)] flex flex-col items-center text-center transition-all duration-200 overflow-hidden w-full select-none
                      ${isZero? "bg-[#FFF5F5] border-2 border-red-200 opacity-80 cursor-not-allowed" : isLow? "bg-[#FFFBEB] border-2 border-amber-300 shadow-[0_8px_24px_rgba(245,158,11,0.15)] cursor-pointer" : "bg-white border border-white hover:shadow-[0_14px_36px_rgba(0,0,0,0.10)] hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]"}
                    `}
                  >
                    {qty>0 && (
                      <div className="absolute top-2.5 right-2.5 z-20 bg-black text-white text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                        {qty}
                      </div>
                    )}

                    {/* IMAGEM COM CIRCULO DE ESTOQUE */}
                    <div className="relative w-[122px] h-[122px] md:w-[118px] md:h-[118px] shrink-0">
                      <div className={`w-full h-full rounded-full p-[3px] shadow-inner ${borderBg}`}>
                        <img src={getImgUrl(p.imagem_url)} onError={(e)=>(e.currentTarget.src=FALLBACK_IMG)} className={`w-full h-full rounded-full object-cover ${isZero? "grayscale" : ""}`} alt={p.nome} />
                      </div>

                      {/* CIRCULO DA QTD - MESMA COR DA BORDA */}
                      {p.controlar_stock && (
                        <div className={`absolute -top-1 -left-1 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shadow-md border-2 border-white ${qtyCircleBg}`}>
                          {atual}
                        </div>
                      )}
                    </div>

                    <h3 className="mt-2.5 font-black text-[12.5px] md:text-[12px] leading-[1.15] text-black tracking-tight w-full px-1.5 break-words line-clamp-2">{p.nome}</h3>
                    <p className="mt-1 text-[10px] leading-[1.15] text-[#6B6B6B] w-full px-2 h-[28px] md:h-[26px] line-clamp-2 overflow-hidden">{p.descricao || p.categoria || p.codigo}</p>

                    <div className={`mt-2.5 text-white rounded-full px-4 py-[4px] flex items-baseline gap-0.5 shadow-sm ${isZero? "bg-gray-400" : isLow? "bg-amber-500" : "bg-[#A67C52]"}`}>
                      <span className="text-[8px] font-bold opacity-90">Kz</span>
                      <span className="text-[12.5px] font-black tracking-wide">{Number(p.preco_venda).toLocaleString('en-US')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="w-full lg:w-[340px] bg-white/90 backdrop-blur-2xl border-t lg:border-l border-black/5 flex flex-col h-[42dvh] lg:h-auto shrink-0">
          <div className="p-4 flex justify-between items-center border-b border-black/5"><p className="font-bold text-[14px]">Seu pedido</p><span className="text-[11px] bg-black text-white px-3 py-1 rounded-full">{cart.length} itens</span></div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2">{cart.length===0&&<p className="text-center text-[12px] text-gray-400 mt-10">Dê 2 cliques no produto<br/>para adicionar</p>}{cart.map(i=>(<div key={i.id} className="flex gap-3 bg-[#F8FAFF] border rounded-[14px] p-2.5"><img src={i.img} className="w-12 h-12 rounded-full object-cover border-2 border-white" alt=""/><div className="flex-1 min-w-0"><p className="font-semibold text-[12px] truncate">{i.name}</p><p className="text-[11px] text-gray-500">Kz {i.price.toLocaleString("de-DE")} x {i.qtd}</p></div><p className="font-bold text-[12px]">Kz {(i.price*i.qtd).toLocaleString("de-DE")}</p></div>))}</div>
          <div className="p-3 border-t bg-white/90 backdrop-blur-xl space-y-2.5">
            <div className="bg-white/80 backdrop-blur-xl border border-white/60 rounded-[14px] p-2.5 shadow-sm">
              <p className="text-[10px] font-bold tracking-widest text-gray-400 ml-1 mb-1.5">FORMA DE PAGAMENTO</p>
              <div className="relative">
                <select value={forma} onChange={(e)=>setForma(e.target.value as any)} className="w-full appearance-none bg-[#F5F7FB] border border-black/5 rounded-full px-4 py-2.5 text-[12px] font-bold outline-none">
                  <option value="dinheiro">Dinheiro</option><option value="transferencia">Transferência</option><option value="tpa">TPA</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[10px]">▼</div>
              </div>
            </div>
            <div className="flex justify-between text-[12px] px-1"><span className="text-gray-500">Total</span><span className="font-black text-[15px]">Kz {total.toLocaleString("de-DE")}</span></div>
            <button disabled={cart.length===0} onClick={()=>{ if(forma==="dinheiro") setRecebido(""); else setRecebido(String(total)); setShowPay(true); }} className="w-full bg-[#2F4A8A] disabled:bg-gray-300 text-white rounded-full py-3 font-bold text-[13px]">Pagar • Kz {total.toLocaleString("de-DE")}</button>
          </div>
        </div>
      </div>

      {showPay && (
        <div className="absolute inset-0 z-[200] bg-black/30 backdrop-blur-md flex items-center justify-center p-3">
          <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-2xl rounded-[22px] border border-white/60 shadow-2xl overflow-hidden">
            <div className="p-3.5 space-y-3">
              <div className="bg-[#F5F7FB] rounded-[14px] p-3 border border-black/5 space-y-2.5">
                <div className="flex justify-between items-center"><span className="text-[11px] font-black tracking-wide uppercase text-gray-600">{forma}</span><span className="font-black text-[14px]">Kz {total.toLocaleString("de-DE")}</span></div>
                <div className="bg-white rounded-[12px] px-3 py-2.5 border flex justify-between items-center shadow-sm"><div><p className="text-[8px] text-gray-400 tracking-widest font-bold">VALOR RECEBIDO</p><p className="text-[18px] font-black leading-none mt-1">Kz {recebido||"0"}</p></div><div className="w-8 h-8 bg-[#EEF4FF] rounded-full flex items-center justify-center"><Banknote size={14} className="text-[#2F4A8A]"/></div></div>
                {forma==="dinheiro" && (<div className={`rounded-[12px] px-3 py-2 flex justify-between items-center border ${troco>=0?"bg-[#E8F5E9] border-green-200":"bg-[#FFEBEE] border-red-200"}`}><span className="text-[10px] font-black">{troco>=0?"TROCO":"FALTA"}</span><span className={`text-[13px] font-black ${troco>=0?"text-green-700":"text-red-600"}`}>Kz {Math.abs(troco).toLocaleString("de-DE")}</span></div>)}
              </div>
              {forma==="dinheiro" && (<div className="grid grid-cols-4 gap-2"><button onClick={()=>handleCalc("7")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">7</button><button onClick={()=>handleCalc("8")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">8</button><button onClick={()=>handleCalc("9")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">9</button><button onClick={()=>handleCalc("DEL")} className="h-[40px] rounded-[12px] bg-black text-white flex justify-center items-center"><Delete size={16}/></button><button onClick={()=>handleCalc("4")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">4</button><button onClick={()=>handleCalc("5")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">5</button><button onClick={()=>handleCalc("6")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">6</button><button onClick={()=>handleCalc("C")} className="h-[40px] rounded-[12px] bg-black text-white font-black text-[13px]">C</button><button onClick={()=>handleCalc("1")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">1</button><button onClick={()=>handleCalc("2")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">2</button><button onClick={()=>handleCalc("3")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">3</button><button onClick={()=>handleCalc("00")} className="h-[40px] rounded-[12px] bg-white/70 border shadow-sm font-bold text-[12px]">00</button><button onClick={()=>handleCalc("0")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px] col-span-2">0</button><button onClick={()=>handleCalc(".")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[16px] col-span-2">.</button></div>)}
              <div className="grid grid-cols-2 gap-2.5"><button onClick={()=>setShowPay(false)} className="h-[40px] bg-[#EF4444] text-white rounded-full flex items-center justify-center"><X size={18}/></button><button disabled={forma==="dinheiro" && recebidoNum < total} onClick={()=>setShowConfirm(true)} className="h-[40px] bg-[#16A34A] disabled:bg-gray-300 text-white rounded-full flex items-center justify-center"><Check size={18}/></button></div>
            </div>
          </div>
        </div>
      )}

      <div className={`${showConfirm?"flex":"hidden"} absolute inset-0 z-[300] bg-black/40 backdrop-blur-md items-center justify-center p-4`}>
        <div className="w-full max-w-[340px] bg-white/95 backdrop-blur-2xl rounded-[24px] p-6 border border-white/60 shadow-2xl text-center">
          <div className="w-14 h-14 bg-[#EEF4FF] rounded-full flex items-center justify-center mx-auto mb-4 border border-white"><Printer size={22} className="text-[#2F4A8A]"/></div>
          <h3 className="font-black text-[16px]">Finalizar venda?</h3>
          <p className="text-[12px] text-gray-500 mt-2">Pagamento via {forma} - Total Kz {total.toLocaleString("de-DE")} {forma==="dinheiro"? `• Troco Kz ${Math.max(0,troco).toLocaleString("de-DE")}` : ""}</p>
          <div className="flex gap-2 mt-5"><button onClick={()=>setShowConfirm(false)} className="flex-1 bg-white border border-black/10 rounded-full py-3 text-[13px]">Cancelar</button><button onClick={imprimirFatura} className="flex-1 bg-black text-white rounded-full py-3 text-[13px] font-bold flex items-center justify-center gap-2"><Printer size={14}/> Sim, Finalizar</button></div>
        </div>
      </div>

      <style jsx>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}`}</style>
    </div>
  );
}

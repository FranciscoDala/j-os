"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");

export default function PedirMesaPage() {
    const { empresaId, mesaNumero } = useParams() as { empresaId: string, mesaNumero: string };
    const [produtos, setProdutos] = useState<any[]>([]);
    const [cats, setCats] = useState<string[]>([]);
    const [catAtiva, setCatAtiva] = useState("All");
    const [nome, setNome] = useState("");
    const [tel, setTel] = useState("");
    const [cart, setCart] = useState<any[]>([]);
    const [obs, setObs] = useState<{[key: string]: string}>({});
    const [loading, setLoading] = useState(true);
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [erro, setErro] = useState("");

    useEffect(() => {
        if (!empresaId) return;
        fetch(`${API_URL}/api/v1/public/${empresaId}/cardapio`)
           .then(r => {
                if (!r.ok) throw new Error("Cardápio não encontrado");
                return r.json();
            })
           .then(d => {
                setProdutos(d.produtos || []);
                setCats(["All",...(d.categorias || [])]);
                setLoading(false);
            })
           .catch(e => {
                setErro(e.message);
                setLoading(false);
            });
    }, [empresaId]);

    const add = (p: any) => {
        const ex = cart.find(c => c.id === p.id);
        if (ex) setCart(cart.map(c => c.id === p.id? {...c, qtd: c.qtd + 1 } : c));
        else setCart([...cart, { id: p.id, nome: p.nome, preco: Number(p.preco), qtd: 1 }]);
    };

    const remove = (id: string) => {
        const ex = cart.find(c => c.id === id);
        if (!ex) return;
        if (ex.qtd > 1) setCart(cart.map(c => c.id === id? {...c, qtd: c.qtd - 1 } : c));
        else setCart(cart.filter(c => c.id!== id));
    };

    const total = cart.reduce((s, i) => s + i.preco * i.qtd, 0);
    const filtrados = catAtiva === "All"? produtos : produtos.filter(p => p.categoria === catAtiva);

    const enviar = async () => {
        if (!nome.trim()) return alert("Digite seu nome");
        if (cart.length === 0) return alert("Adicione pelo menos 1 item");

        setEnviando(true);
        try {
            const r = await fetch(`${API_URL}/api/v1/public/${empresaId}/pedido`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mesa_numero: String(mesaNumero).toUpperCase().trim(), // FIX: agora manda M01
                    cliente_nome: nome.trim(),
                    cliente_telefone: tel.trim() || null,
                    itens: cart.map(c => ({
                        produto_id: c.id,
                        quantidade: c.qtd,
                        observacao: obs[c.id] || null
                    }))
                })
            });
            const txt = await r.text();
            if (!r.ok) {
                // tenta extrair mensagem do backend
                try {
                    const j = JSON.parse(txt);
                    throw new Error(j.detail || txt);
                } catch {
                    throw new Error(txt);
                }
            }
            setEnviado(true);
            setCart([]);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setEnviando(false);
        }
    };

    if (enviado) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] p-6 text-center">
            <div className="bg-white rounded-[24px] p-8 shadow-xl max-w-[340px] w-full">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                <h1 className="font-black text-[18px]">Pedido enviado!</h1>
                <p className="text-[13px] text-zinc-500 mt-2">Mesa {String(mesaNumero).toUpperCase()} - Aguarde o garçom confirmar. Seu pedido já está na cozinha.</p>
                <button onClick={() => setEnviado(false)} className="mt-6 w-full bg-black text-white rounded-full py-3 font-bold">Fazer outro pedido</button>
            </div>
        </div>
    );

    if (loading) return <div className="p-10 text-center text-[13px]">Carregando cardápio da mesa {String(mesaNumero).toUpperCase()}...</div>;
    if (erro) return <div className="p-10 text-center text-[13px] text-red-500">{erro}</div>;

    return (
        <div className="min-h-screen bg-[#F5F7FB] pb-[160px]">
            <div className="bg-white border-b p-4 sticky top-0 z-10">
                <h1 className="font-black text-[14px]">MESA {String(mesaNumero).toUpperCase()}</h1>
                <p className="text-[11px] text-zinc-500">Faça seu pedido direto pelo celular</p>
                <div className="grid grid-cols-2 gap-2 mt-3">
                    <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome*" className="bg-zinc-100 rounded-full px-4 py-2.5 text-[13px] outline-none" />
                    <input value={tel} onChange={e => setTel(e.target.value)} placeholder="WhatsApp (opcional)" className="bg-zinc-100 rounded-full px-4 py-2.5 text-[13px] outline-none" />
                </div>
            </div>

            <div className="flex gap-2 overflow-auto px-4 py-3 no-scrollbar">
                {cats.map(c => <button key={c} onClick={() => setCatAtiva(c)} className={`px-4 py-2 rounded-full text-[12px] font-bold whitespace-nowrap ${catAtiva === c? "bg-black text-white" : "bg-white border"}`}>{c}</button>)}
            </div>

            <div className="grid grid-cols-2 gap-3 px-4">
                {filtrados.length === 0 && <p className="col-span-2 text-center text-[12px] text-zinc-400 py-10">Nenhum produto nessa categoria</p>}
                {filtrados.map(p => {
                    const noCart = cart.find(c => c.id === p.id);
                    return (
                        <div key={p.id} className="bg-white rounded-[16px] p-3 border shadow-sm flex flex-col">
                            <div className="font-bold text-[13px] line-clamp-1">{p.nome}</div>
                            <div className="text-[11px] text-zinc-500 mt-1">Kz {Number(p.preco).toLocaleString("de-DE")}</div>
                            {!p.disponivel && <div className="text-[10px] text-red-500 font-bold mt-1">Indisponível</div>}
                            {noCart? (
                                <div className="mt-3 flex items-center justify-between bg-zinc-900 text-white rounded-full px-2 py-1">
                                    <button onClick={() => remove(p.id)} className="w-7 h-7 rounded-full bg-white/20">-</button>
                                    <span className="text-[12px] font-black">{noCart.qtd}</span>
                                    <button onClick={() => add(p)} className="w-7 h-7 rounded-full bg-white/20">+</button>
                                </div>
                            ) : (
                                <button disabled={!p.disponivel} onClick={() => add(p)} className="mt-3 bg-black text-white rounded-full py-2 text-[12px] font-black disabled:bg-zinc-300">+ Adicionar</button>
                            )}
                        </div>
                    );
                })}
            </div>

            {cart.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4 rounded-t-[20px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                    <div className="flex justify-between text-[12px] mb-2"><span>{cart.reduce((s,i)=>s+i.qtd,0)} itens</span><span className="font-black">Kz {total.toLocaleString("de-DE")}</span></div>
                    <div className="text-[11px] text-zinc-500 mb-3 line-clamp-1">{cart.map(c => `${c.qtd}x ${c.nome}`).join(", ")}</div>
                    <button disabled={enviando} onClick={enviar} className="w-full bg-[#16A34A] text-white rounded-full py-3.5 font-black text-[14px] disabled:bg-zinc-300">
                        {enviando? "Enviando..." : `Enviar pedido • Kz ${total.toLocaleString("de-DE")}`}
                    </button>
                </div>
            )}
        </div>
    );
}

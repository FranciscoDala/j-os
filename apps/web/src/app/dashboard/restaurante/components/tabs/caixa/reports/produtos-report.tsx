"use client";
import { useMemo } from "react";

const fmtKz = (v:number) => `Kz ${Number(v).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`;

export function ProdutosReport({ produtos, vendasPorDia, inicio, fim }: any) {
  const realProducts = produtos || [];

  const chartData = useMemo(() => {
    if (vendasPorDia?.length) {
      return vendasPorDia.slice(0,5).map((d:any)=> ({
        label: d.label || d.dia?.slice(5) || "Item",
        s1: d.total * 0.6,
        s2: d.total * 0.35,
        s3: d.total * 0.2,
        real: d.total
      }));
    }
    return [
      { label: "Item 1", s1: 18, s2: 0, s3: 2 },
      { label: "Item 2", s1: 30, s2: 0, s3: 12 },
      { label: "Item 3", s1: 25, s2: 38, s3: 28 },
      { label: "Item 4", s1: 40, s2: 30, s3: 15 },
      { label: "Item 5", s1: 42, s2: 32, s3: 35 },
    ];
  }, [vendasPorDia]);

  const max = Math.max(...chartData.map((d:any)=> Math.max(d.s1,d.s2,d.s3)), 50);

  // top 4 para cards de baixo
  const cards = realProducts.length? realProducts.slice(0,4) : [
    { nome: "Iced Coffee", nome_produto: "Iced Coffee", preco: 10.99, total: 10.99, img: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500" },
    { nome: "Lemon Icetea", nome_produto: "Lemon Icetea", preco: 5.99, total: 5.99, img: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500" },
    { nome: "Brownie", nome_produto: "Brownie", preco: 15.99, total: 15.99, img: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500" },
    { nome: "French fries", nome_produto: "French fries", preco: 15.99, total: 15.99, img: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=500" },
  ];

  const imgFor = (p:any) => p.imagem || p.img || p.foto || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500`;

  return (
    <div className="space-y-3">
      {/* CARD GRANDE - PRINT STYLE */}
      <div className="bg-white rounded-[28px] border border-black/5 p-4 md:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)]">
        <div className="grid md:grid-cols-[1.5fr_1fr] gap-6">
          {/* GRAFICO */}
          <div>
            <div className="flex gap-4 mb-6 text-[10px] font-bold tracking-widest uppercase text-zinc-400">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8B6A5A]"/>Series 1</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-zinc-400"/>Series 2</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#E8DDD6]"/>Series 3</span>
            </div>

            <div className="relative h-[180px] w-full">
              <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[11px] text-zinc-400 font-medium w-6">
                <span>50</span><span>40</span><span>30</span><span>20</span><span>10</span><span>0</span>
              </div>
              <svg className="absolute left-8 right-0 top-0 bottom-8 w-[calc(100%-32px)] h-[148px]" viewBox="0 0 300 148" preserveAspectRatio="none">
                {[0,29,58,87,116].map(y=> <line key={y} x1="0" x2="300" y1={y} y2={y} stroke="#F3F0EE" strokeWidth="1"/>)}
                <polyline fill="none" stroke="#8B6A5A" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" points={chartData.map((d:any,i:number)=>`${(i/(chartData.length-1))*300},${148-(d.s1/max)*120}`).join(" ")} />
                <polyline fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={chartData.map((d:any,i:number)=>`${(i/(chartData.length-1))*300},${148-(d.s2/max)*120}`).join(" ")} />
                <polyline fill="none" stroke="#E5D5CB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={chartData.map((d:any,i:number)=>`${(i/(chartData.length-1))*300},${148-(d.s3/max)*120}`).join(" ")} />
              </svg>
              <div className="absolute bottom-0 left-8 right-0 flex justify-between text-[11px] text-zinc-500 font-bold">
                {chartData.map((d:any)=> <span key={d.label}>{d.label}</span>)}
              </div>
            </div>
          </div>

          {/* DIREITA - 3 LINHAS IGUAL PRINT */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3.5 rounded-[18px] border border-black/5 bg-white">
              <div className="flex -space-x-2">
                <img src="https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=100" className="w-10 h-10 rounded-full object-cover border-2 border-white"/>
                <img src="https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=100" className="w-10 h-10 rounded-full object-cover border-2 border-white"/>
              </div>
              <div><div className="text-[12px] font-black leading-none">Top-Selling Products</div><div className="text-[11px] text-zinc-500 mt-1 leading-tight">Highlight of our most popular premium products.</div></div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-[18px] bg-[#8B6A5A] text-white shadow-[0_8px_20px_rgba(139,106,90,0.3)]">
              <div className="flex -space-x-2">
                <img src="https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=100" className="w-8 h-8 rounded-full object-cover border-2 border-[#8B6A5A]"/>
                <img src="https://images.unsplash.com/photo-1488477181946-64290103bbd6?w=100" className="w-8 h-8 rounded-full object-cover border-2 border-[#8B6A5A]"/>
                <img src="https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=100" className="w-8 h-8 rounded-full object-cover border-2 border-[#8B6A5A]"/>
              </div>
              <div><div className="text-[12px] font-black leading-none">Trending Now</div><div className="text-[11px] opacity-80 mt-1">"Where sweetness meets simplicity ✨"</div></div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-[18px] border border-black/5 bg-white">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white"/>
                <div className="w-8 h-8 rounded-full bg-amber-100 border-2 border-white"/>
                <div className="w-8 h-8 rounded-full bg-lime-100 border-2 border-white"/>
                <div className="w-8 h-8 rounded-full bg-yellow-100 border-2 border-white"/>
              </div>
              <div><div className="text-[12px] font-black leading-none">Best sellers</div><div className="text-[11px] text-zinc-500 mt-1 leading-tight">Food items that consistently lead our sales charts.</div></div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTRO DATA ESTILO PRINT */}
      <div className="flex justify-between items-center">
        <div className="bg-white border border-black/10 rounded-full px-4 py-2 flex items-center gap-3 text-[12px] font-black shadow-sm">
          <span className="flex items-center gap-1.5">🗓 {inicio}</span><span className="opacity-30">To</span><span className="flex items-center gap-1.5">🗓 {fim}</span>
        </div>
        <div className="hidden md:flex gap-3 text-[12px] font-bold text-zinc-400"><span>‹</span><span className="text-zinc-300">1</span><span className="text-black">2</span><span className="text-zinc-300">3</span><span>›</span></div>
      </div>

      {/* CARDS PRODUTOS IGUAL PRINT */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((p:any,i:number)=>(
          <div key={i} className="bg-white rounded-[20px] p-2.5 border border-black/5 shadow-sm hover:shadow-md transition">
            <div className="aspect-[1.1/1] rounded-[16px] overflow-hidden bg-[#F6F3F0] mb-3">
              <img src={imgFor(p)} alt={p.nome||p.nome_produto} className="w-full h-full object-cover"/>
            </div>
            <div className="flex items-center gap-2 px-1.5 pb-1">
              <span className="text-[13px] font-black tracking-tight">{p.preco? `$${Number(p.preco).toFixed(2)}` : fmtKz(p.total||0)}</span>
              <span className="w-px h-3 bg-zinc-200"/>
              <span className="text-[11px] font-bold truncate">{p.nome||p.nome_produto}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

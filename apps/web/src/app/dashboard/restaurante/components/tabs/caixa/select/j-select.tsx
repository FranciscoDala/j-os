"use client";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, FileText, TrendingUp, Package, BarChart3 } from "lucide-react";

const OPTIONS = [
  { id: "extrato", label: "Extrato", icon: FileText, desc: "Movimentos do caixa" },
  { id: "vendas", label: "Vendas", icon: TrendingUp, desc: "Vendas por dia" },
  { id: "produtos", label: "Produtos", icon: Package, desc: "Ranking de produtos" },
  { id: "geral", label: "Geral", icon: BarChart3, desc: "DRE completo" },
] as const;

export function JSelect({ value, onChange }: { value: string; onChange: (v: any) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find(o => o.id === value) || OPTIONS[0];

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative w-full md:w-[280px]">
      <button
        onClick={() => setOpen(o =>!o)}
        className="w-full h-[46px] bg-black text-white rounded-full px-5 flex items-center justify-between gap-3"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-white/15 rounded-full flex items-center justify-center">
            <current.icon size={14} />
          </div>
          <div className="text-left leading-none">
            <div className="text-[12px] font-black uppercase tracking-widest">{current.label}</div>
            <div className="text-[10px] text-white/60 font-medium">{current.desc}</div>
          </div>
        </div>
        <ChevronDown size={16} className={`transition-transform ${open? "rotate-180" : ""} opacity-60`} />
      </button>

      {open && (
        <div className="absolute top-[54px] left-0 right-0 z-50 bg-[#EDEBE6] border border-black/10 rounded-[20px] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden animate-in">
          {OPTIONS.map(opt => {
            const active = value === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => { onChange(opt.id); setOpen(false); localStorage.setItem("j-os:caixa_tab", opt.id); }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-[14px] text-left transition-all ${
                  active? "bg-white shadow border border-black/5" : "hover:bg-white/60"
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${active? "bg-black text-white" : "bg-white border"}`}>
                  <opt.icon size={16} />
                </div>
                <div className="flex-1 leading-none">
                  <div className="text-[12px] font-black uppercase tracking-widest text-black">{opt.label}</div>
                  <div className="text-[11px] text-zinc-500 mt-1">{opt.desc}</div>
                </div>
                {active && <div className="w-2 h-2 bg-green-500 rounded-full" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

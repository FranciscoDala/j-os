"use client";

type TabType = "extrato" | "vendas" | "produtos" | "geral";

export function CaixaTabs({ active, onChange }: { active: TabType, onChange: (t: TabType) => void }) {
    const tabs: { id: TabType, label: string }[] = [
        { id: "extrato", label: "Extrato" },
        { id: "vendas", label: "Vendas" },
        { id: "produtos", label: "Produtos" },
        { id: "geral", label: "Geral" },
    ];
    return (
        <div className="bg-[#EDEBE6] border border-black/10 rounded-[16px] p-1 flex gap-1 w-full overflow-x-auto scrollbar-hide">
            {tabs.map(t => (
                <button
                    key={t.id}
                    onClick={() => onChange(t.id)}
                    className={`flex-1 min-w-[80px] h-[36px] rounded-full text-[11px] font-black tracking-widest uppercase transition-all ${
                        active === t.id? "bg-black text-white shadow" : "bg-white text-zinc-600 hover:bg-zinc-50"
                    }`}
                >
                    {t.label}
                </button>
            ))}
        </div>
    );
}

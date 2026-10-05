"use client";

export function MesaModal({ open, onClose, numero, setNumero, capacidade, setCapacidade, zonaNew, setZonaNew, onCreate, saving }: any) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-[22px] w-full max-w-[380px] p-6 border border-[#E8DCCF] shadow-[0_20px_60px_rgba(0,0,0,0.3)]">
                <h3 className="font-black text-[14px] mb-4">Nova Mesa</h3>
                <div className="space-y-3">
                    <input value={numero} onChange={e => setNumero(e.target.value)} placeholder="Número ex: M01" className="w-full h-11 rounded-full border border-[#E8DCCF] px-4 text-[12px] font-bold outline-none focus:border-[#A67C52]" />
                    <div className="grid grid-cols-2 gap-3">
                        <input type="number" value={capacidade} onChange={e => setCapacidade(Number(e.target.value))} className="w-full h-11 rounded-full border border-[#E8DCCF] px-4 text-[12px] font-bold" />
                        <select value={zonaNew} onChange={e => setZonaNew(e.target.value)} className="w-full h-11 rounded-full border border-[#E8DCCF] px-4 text-[12px] font-bold bg-white">
                            <option>Salão</option><option>Varanda</option><option>VIP</option><option>Bar</option><option>Terraço</option>
                        </select>
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={onClose} className="flex-1 h-11 rounded-full border border-[#E8DCCF] text-[12px] font-bold">Cancelar</button>
                        <button onClick={onCreate} disabled={saving} className="flex-1 h-11 rounded-full bg-black text-white text-[12px] font-black disabled:opacity-50">{saving ? "..." : "Criar"}</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";
import { useState } from "react";
import { X, Delete, Banknote, Check } from "lucide-react";
import { Printer } from "lucide-react";

export function MesaFecharModal({ open, mesa, forma, setForma, recebido, setRecebido, finalizando, onClose, onConfirm }: any) {
    if (!open) return null;
    const total = Number(mesa?.venda_total || mesa?.total || 0);
    const recebidoNum = recebido? parseFloat(recebido) : 0;
    const troco = recebidoNum - total;

    const handleCalc = (val: string) => {
        if (val==="C") setRecebido(""); else if (val==="DEL") setRecebido((s:string)=>s.slice(0,-1));
        else if (val==="00") { if (recebido!=="") setRecebido((s:string)=>s+"00"); }
        else if (val===".") { if (!recebido.includes(".")) setRecebido((s:string)=>(s===""? "0." : s+".")); }
        else { setRecebido((s:string)=>(s+val).slice(0,10)); }
    };

    return (
        <div className="fixed inset-0 z-[200] bg-black/30 backdrop-blur-md flex items-end md:items-center justify-center p-0 md:p-3">
            <div className="w-full max-w-[400px] bg-white rounded-t-[22px] md:rounded-[22px] border shadow-2xl overflow-hidden max-h-[95dvh] overflow-y-auto no-scrollbar">
                <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-[14px]">Fechar Mesa {mesa?.numero}</h3>
                        <button onClick={onClose} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center"><X size={14} /></button>
                    </div>
                    <div className="bg-[#F5F7FB] rounded-[14px] p-3 border border-black/5 space-y-2.5">
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black uppercase text-gray-600">MESA {mesa?.numero} • {forma}</span>
                            <span className="font-black text-[14px]">Kz {total.toLocaleString("de-DE")}</span>
                        </div>
                        <div className="bg-white rounded-[12px] px-3 py-2.5 border flex justify-between items-center shadow-sm">
                            <div><p className="text-[8px] text-gray-400 tracking-widest font-bold">VALOR RECEBIDO</p><p className="text-[18px] font-black leading-none mt-1">Kz {recebido||"0"}</p></div>
                            <div className="w-8 h-8 bg-[#EEF4FF] rounded-full flex items-center justify-center"><Banknote size={14} className="text-[#2F4A8A]" /></div>
                        </div>
                        {forma==="dinheiro" && (
                            <div className={`rounded-[12px] px-3 py-2 flex justify-between items-center border ${troco>=0? "bg-[#E8F5E9] border-green-200" : "bg-[#FFEBEE] border-red-200"}`}>
                                <span className="text-[10px] font-black">{troco>=0? "TROCO" : "FALTA"}</span>
                                <span className={`text-[13px] font-black ${troco>=0? "text-green-700" : "text-red-600"}`}>Kz {Math.abs(troco).toLocaleString("de-DE")}</span>
                            </div>
                        )}
                        <div className="flex gap-2">
                            {["dinheiro","transferencia","tpa"].map(f=>(
                                <button key={f} onClick={()=>setForma(f)} className={`flex-1 h-9 rounded-full text-[10px] font-black border ${forma===f? "bg-black text-white border-black" : "bg-white border-black/10"}`}>{f.toUpperCase()}</button>
                            ))}
                        </div>
                    </div>
                    {forma==="dinheiro" && (
                        <div className="grid grid-cols-4 gap-2">
                            {["7","8","9","DEL","4","5","6","C","1","2","3","00"].map(k=>(
                                <button key={k} onClick={()=>handleCalc(k)} className={`h-[44px] rounded-[12px] border shadow-sm font-bold text-[14px] active:scale-95 ${k==="DEL"||k==="C"? "bg-black text-white" : "bg-white"}`}>
                                    {k==="DEL"? <Delete size={16} className="mx-auto"/> : k}
                                </button>
                            ))}
                            <button onClick={()=>handleCalc("0")} className="h-[44px] rounded-[12px] bg-white border font-bold col-span-2">0</button>
                            <button onClick={()=>handleCalc(".")} className="h-[44px] rounded-[12px] bg-white border font-bold col-span-2">.</button>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-2.5">
                        <button onClick={onClose} className="h-[44px] bg-[#EF4444] text-white rounded-full flex items-center justify-center"><X size={18} /></button>
                        <button disabled={(forma==="dinheiro" && (parseFloat(recebido||"0") < total)) || finalizando} onClick={onConfirm} className="h-[44px] bg-[#16A34A] disabled:bg-gray-300 text-white rounded-full flex items-center justify-center font-bold text-[13px]"><Check size={18} /> FECHAR</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

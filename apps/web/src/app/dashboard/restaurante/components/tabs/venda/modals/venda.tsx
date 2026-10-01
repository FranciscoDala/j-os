"use client";
import { X, Delete, Banknote, Printer, Check, AlertTriangle, Info, CheckCircle } from "lucide-react";

type Toast = { id: string; msg: string; type: "success" | "error" | "info" | "warning" };

export function Toasts({ toasts, setToasts }: { toasts: Toast[]; setToasts: any }) {
    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-[360px] pointer-events-none">
            {toasts.map(t => (
                <div key={t.id} className={`pointer-events-auto flex gap-2.5 items-start p-3.5 rounded-[14px] border backdrop-blur-xl shadow-2xl text-[12px] font-medium ${t.type === "success" ? "bg-[#E8F5E9] border-green-200 text-green-800" : t.type === "error" ? "bg-[#FDECEA] border-red-200 text-red-800" : t.type === "warning" ? "bg-[#FFF8E1] border-amber-200 text-amber-900" : "bg-white border-gray-200 text-gray-800"}`}>
                    {t.type === "success" && <CheckCircle size={18} className="shrink-0 mt-0.5" />}{t.type === "error" && <AlertTriangle size={18} className="shrink-0 mt-0.5" />}{t.type === "warning" && <AlertTriangle size={18} className="shrink-0 mt-0.5" />}{t.type === "info" && <Info size={18} className="shrink-0 mt-0.5" />}
                    <span className="flex-1 leading-[1.3]">{t.msg}</span>
                    <button onClick={() => setToasts((x: Toast[]) => x.filter(f => f.id !== t.id))} className="opacity-60 hover:opacity-100"><X size={14} /></button>
                </div>
            ))}
        </div>
    );
}

export function PayModal({ showPay, setShowPay, total, forma, recebido, recebidoNum, troco, handleCalc, setShowConfirm }: any) {
    if (!showPay) return null;
    return (
        <div className="absolute inset-0 z-[200] bg-black/30 backdrop-blur-md flex items-center justify-center p-3">
            <div className="w-full max-w-[400px] bg-white/95 backdrop-blur-2xl rounded-[22px] border border-white/60 shadow-2xl overflow-hidden">
                <div className="p-3.5 space-y-3">
                    <div className="bg-[#F5F7FB] rounded-[14px] p-3 border border-black/5 space-y-2.5">
                        <div className="flex justify-between items-center"><span className="text-[11px] font-black tracking-wide uppercase text-gray-600">{forma}</span><span className="font-black text-[14px]">Kz {total.toLocaleString("de-DE")}</span></div>
                        <div className="bg-white rounded-[12px] px-3 py-2.5 border flex justify-between items-center shadow-sm"><div><p className="text-[8px] text-gray-400 tracking-widest font-bold">VALOR RECEBIDO</p><p className="text-[18px] font-black leading-none mt-1">Kz {recebido || "0"}</p></div><div className="w-8 h-8 bg-[#EEF4FF] rounded-full flex items-center justify-center"><Banknote size={14} className="text-[#2F4A8A]" /></div></div>
                        {forma === "dinheiro" && (<div className={`rounded-[12px] px-3 py-2 flex justify-between items-center border ${troco >= 0 ? "bg-[#E8F5E9] border-green-200" : "bg-[#FFEBEE] border-red-200"}`}><span className="text-[10px] font-black">{troco >= 0 ? "TROCO" : "FALTA"}</span><span className={`text-[13px] font-black ${troco >= 0 ? "text-green-700" : "text-red-600"}`}>Kz {Math.abs(troco).toLocaleString("de-DE")}</span></div>)}
                    </div>
                    {forma === "dinheiro" && (<div className="grid grid-cols-4 gap-2"><button onClick={() => handleCalc("7")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">7</button><button onClick={() => handleCalc("8")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">8</button><button onClick={() => handleCalc("9")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">9</button><button onClick={() => handleCalc("DEL")} className="h-[40px] rounded-[12px] bg-black text-white flex justify-center items-center"><Delete size={16} /></button><button onClick={() => handleCalc("4")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">4</button><button onClick={() => handleCalc("5")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">5</button><button onClick={() => handleCalc("6")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">6</button><button onClick={() => handleCalc("C")} className="h-[40px] rounded-[12px] bg-black text-white font-black text-[13px]">C</button><button onClick={() => handleCalc("1")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">1</button><button onClick={() => handleCalc("2")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">2</button><button onClick={() => handleCalc("3")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px]">3</button><button onClick={() => handleCalc("00")} className="h-[40px] rounded-[12px] bg-white/70 border shadow-sm font-bold text-[12px]">00</button><button onClick={() => handleCalc("0")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[14px] col-span-2">0</button><button onClick={() => handleCalc(".")} className="h-[40px] rounded-[12px] bg-white border shadow-sm font-bold text-[16px] col-span-2">.</button></div>)}
                    <div className="grid grid-cols-2 gap-2.5"><button onClick={() => setShowPay(false)} className="h-[40px] bg-[#EF4444] text-white rounded-full flex items-center justify-center"><X size={18} /></button><button disabled={forma === "dinheiro" && recebidoNum < total} onClick={() => setShowConfirm(true)} className="h-[40px] bg-[#16A34A] disabled:bg-gray-300 text-white rounded-full flex items-center justify-center"><Check size={18} /></button></div>
                </div>
            </div>
        </div>
    );
}

export function ConfirmModal({ showConfirm, setShowConfirm, total, forma, troco, imprimirFatura }: any) {
    if (!showConfirm) return null;
    return (
        <div className="absolute inset-0 z-[300] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-[340px] bg-white/95 backdrop-blur-2xl rounded-[24px] p-6 border border-white/60 shadow-2xl text-center">
                <div className="w-14 h-14 bg-[#EEF4FF] rounded-full flex items-center justify-center mx-auto mb-4 border border-white"><Printer size={22} className="text-[#2F4A8A]" /></div>
                <h3 className="font-black text-[16px]">Finalizar venda?</h3>
                <p className="text-[12px] text-gray-500 mt-2">Pagamento via {forma} - Total Kz {total.toLocaleString("de-DE")} {forma === "dinheiro" ? `• Troco Kz ${Math.max(0, troco).toLocaleString("de-DE")}` : ""}</p>
                <div className="flex gap-2 mt-5"><button onClick={() => setShowConfirm(false)} className="flex-1 bg-white border border-black/10 rounded-full py-3 text-[13px]">Cancelar</button><button onClick={imprimirFatura} className="flex-1 bg-black text-white rounded-full py-3 text-[13px] font-bold flex items-center justify-center gap-2"><Printer size={14} /> Sim, Finalizar</button></div>
            </div>
        </div>
    );
}

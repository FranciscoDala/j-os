"use client";
import { QRCodeSVG } from "qrcode.react";

export function QrMesaPrint({ empresaId, mesas, dominio }: { empresaId: string, mesas: any[], dominio: string }) {
    const imprimir = () => window.print();
    const baseUrl = dominio || (typeof window!== "undefined"? window.location.origin : "");
    return (
        <div>
            <button onClick={imprimir} className="bg-black text-white rounded-full px-5 py-2.5 text-[12px] font-bold print:hidden">
              Imprimir QRs ({mesas.length})
            </button>
            <div className="grid grid-cols-2 gap-6 mt-6 print:grid-cols-2">
                {mesas.map(m => {
                    const url = `${baseUrl}/p/${empresaId}/m/${m.numero}`;
                    return (
                        <div key={m.id} className="border-2 border-dashed border-black rounded-[20px] p-6 flex flex-col items-center text-center break-inside-avoid">
                            <h2 className="font-black text-[22px]">MESA {m.numero}</h2>
                            <p className="text-[10px] tracking-widest font-bold mt-1">ESCANEIE PARA PEDIR</p>
                            <div className="my-4 bg-white p-2 rounded-xl"><QRCodeSVG value={url} size={160} /></div>
                            <p className="text-[8px] text-zinc-500 break-all">{url}</p>
                        </div>
                    );
                })}
            </div>
            <style>{`@media print { body * { visibility: hidden; }.grid,.grid * { visibility: visible; }.grid { position: absolute; left:0; top:0; width:100%; } }`}</style>
        </div>
    );
}

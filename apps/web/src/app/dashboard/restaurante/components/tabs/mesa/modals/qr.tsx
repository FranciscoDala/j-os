"use client";
import { QrMesaPrint } from "../../../../../../../components/mesas/QrMesaPrint";

export function MesaQrModal({ open, onClose, empresaId, mesas }: any) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-4">
            <div className="bg-white rounded-[20px] md:rounded-[24px] max-w-[800px] w-full max-h-[90vh] overflow-auto p-4 md:p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-black text-[16px]">QR Codes - Mesas</h2>
                    <button onClick={onClose} className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center">✕</button>
                </div>
                <QrMesaPrint empresaId={empresaId} mesas={mesas} dominio={typeof window!== "undefined"? window.location.origin : ""} />
            </div>
        </div>
    );
}

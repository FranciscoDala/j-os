"use client";
import { X, Trash2 } from "lucide-react";

const FALLBACK_IMG = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=200";
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "");

const getImgUrl = (url?: string) => {
    if (!url) return FALLBACK_IMG;
    if (url.startsWith("blob:")) return url;
    if (url.startsWith("http")) return url;
    if (url.startsWith("/media")) return `${API_URL}${url}`;
    return url;
};

type Props = {
    data: { id: string, nome: string, img: string } | null;
    onClose: () => void;
    onConfirm: () => void;
}

export function ProdutoDeleteModal({ data, onClose, onConfirm }: Props) {
    if (!data) return null;
    return (
        <div className="fixed inset-0 z-[400] bg-black/40 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-[340px] bg-white rounded-[28px] p-6 shadow-2xl border border-white flex flex-col items-center text-center">
                <div className="w-[80px] h-[80px] rounded-full p-[3px] bg-[#F5E6D3]">
                    <img src={getImgUrl(data.img)} onError={(e) => (e.currentTarget.src = FALLBACK_IMG)} className="w-full h-full rounded-full object-cover" alt="" />
                </div>
                <h3 className="mt-3 font-black text-[13px] break-words line-clamp-2">{data.nome}</h3>
                <p className="mt-2 text-[11px] text-gray-500">Tem certeza que deseja apagar?</p>
                <div className="flex gap-3 mt-5 w-full">
                    <button onClick={onClose} className="flex-1 h-10 bg-white border border-[#E8DCCF] rounded-full flex items-center justify-center hover:bg-gray-50"><X size={16} /></button>
                    <button onClick={onConfirm} className="flex-1 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"><Trash2 size={16} /></button>
                </div>
            </div>
        </div>
    )
}

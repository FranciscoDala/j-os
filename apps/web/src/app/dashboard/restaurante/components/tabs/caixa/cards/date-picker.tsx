"use client";
import { useState, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const todayISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};
const toLocalISO = (date: Date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

export function JCalendarPicker({ value, onChange }: { value: string, onChange: (v:string)=>void }) {
    const [open, setOpen] = useState(false);
    const [viewDate, setViewDate] = useState(()=>{ const [y,m,d]=value.split('-').map(Number); return new Date(y, m-1, d); });
    useEffect(()=>{ const [y,m,d]=value.split('-').map(Number); setViewDate(new Date(y, m-1, d)); },[value]);
    const year = viewDate.getFullYear(); const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); const daysInMonth = new Date(year, month+1, 0).getDate();
    const days = Array.from({length: firstDay}, ()=>null).concat(Array.from({length: daysInMonth}, (_,i)=>i+1));
    const toISO = (d:number) => toLocalISO(new Date(year, month, d));
    return (
        <div className="relative w-full">
            <button onClick={()=>setOpen(!open)} className="w-full h-[46px] flex items-center justify-between bg-white border rounded-full px-5 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center"><Calendar size={14}/></div>
                    <div className="text-left"><p className="text-[10px] font-black text-black">{value.split('-').reverse().join('/')}</p></div>
                </div>
                <ChevronRight size={14} className={`text-black/40 ${open?'rotate-90':''}`} />
            </button>
            {open && (
                <>
                    <div className="fixed inset-0 z-20" onClick={()=>setOpen(false)} />
                    <div className="absolute z-30 mt-2 left-0 w-full md:w-[320px] rounded-[20px] bg-white border shadow-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                            <button onClick={()=>setViewDate(new Date(year, month-1, 1))} className="w-8 h-8 rounded-full bg-[#F5F7FB] border flex items-center justify-center"><ChevronLeft size={14}/></button>
                            <p className="font-black text-[12px] uppercase">{viewDate.toLocaleDateString('pt-PT',{month:'long'})} {year}</p>
                            <button onClick={()=>setViewDate(new Date(year, month+1, 1))} className="w-8 h-8 rounded-full bg-[#F5F7FB] border flex items-center justify-center"><ChevronRight size={14}/></button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 mb-1">{['D','S','T','Q','Q','S','S'].map((d,i)=><div key={i} className="text-[8px] text-gray-400 text-center font-bold">{d}</div>)}</div>
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((d,i)=> d===null? <div key={i}/> : (<button key={i} onClick={()=>{ onChange(toISO(d)); setOpen(false); }} className={`h-8 rounded-full text-[11px] font-bold ${toISO(d)===value?'bg-black text-white': toISO(d)===todayISO()?'bg-[#0CC06B] text-white':'hover:bg-gray-100'}`}>{d}</button>))}
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button onClick={()=>{ onChange(todayISO()); setOpen(false); }} className="flex-1 h-8 rounded-full bg-[#F5F7FB] border text-[10px] font-black">HOJE</button>
                            <button onClick={()=>setOpen(false)} className="flex-1 h-8 rounded-full bg-black text-white text-[10px] font-black">OK</button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

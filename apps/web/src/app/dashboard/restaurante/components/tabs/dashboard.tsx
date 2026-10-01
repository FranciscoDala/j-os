"use client";
import { useState } from "react";
import { Plus, SlidersHorizontal, ArrowUpRight, FileChartColumn, TriangleAlert, File, Eye, ClipboardList, Pill, Calendar } from "lucide-react";

export function HomeTab({ user }: { user: any }) {
    const [stats] = useState({ active: 128, urgent: 7, pending: 14, watchlist: 23 });

    const cards = [
      {
        id: 1,
        value: stats.active,
        label: "Active Patients",
        labelColor: "text-blue-600",
        bg: "bg-white/90",
        icon: <FileChartColumn size={16} className="text-blue-700" />,
        iconBg: "bg-blue-100",
        bottom: (
          <div className="flex gap-1.5 mt-4 items-end h-8">
            <div className="w-full h-2.5 bg-[#A8C7F0] rounded-sm" />
            <div className="w-full h-4 bg-[#A8C7F0] rounded-sm" />
            <div className="w-full h-8 bg-[#1E3A8A] rounded-sm" />
          </div>
        )
      },
      {
        id: 2,
        value: stats.urgent,
        label: "Urgent Cases",
        labelColor: "text-gray-500",
        bg: "bg-white/90",
        icon: <TriangleAlert size={16} className="text-orange-500" />,
        iconBg: "bg-orange-100",
        bottom: <p className="text-[12px] text-red-500 mt-6 flex items-center gap-1"><ArrowUpRight size={14} />+2 in last hour</p>
      },
      {
        id: 3,
        value: stats.pending,
        label: "Pending Reviews",
        labelColor: "text-black/70",
        bg: "bg-[#FFF68F]/95",
        icon: <File size={16} />,
        iconBg: "bg-white/70",
        bottom: (
          <div className="mt-6"><div className="h-1.5 bg-black/10 rounded-full"><div className="h-1.5 w-1/2 bg-black rounded-full" /></div><p className="text-[11px] mt-2 font-medium">6 completed · 14 remaining</p></div>
        )
      },
      {
        id: 4,
        value: stats.watchlist,
        label: "AI Watchlist",
        labelColor: "text-white/80",
        bg: "bg-gradient-to-br from-[#5A8AD0] to-[#A9C5F0] text-white",
        icon: <Eye size={16} className="text-white" />,
        iconBg: "bg-white/20",
        bottom: <span className="mt-6 inline-flex bg-white/20 rounded-full px-3 py-1 text-[11px]">◎ 4 new insights</span>
      },
    ];

    return (
        <div className="flex flex-col gap-3 md:gap-4 w-full min-w-0 pb-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 px-1 md:px-0">
                <h1 className="text-[22px] md:text-[20px] font-bold text-slate-900 leading-tight">Good Morning, {user?.nome || "Admin Jenath"}</h1>
                <div className="flex gap-2 shrink-0">
                    <button className="flex-1 md:flex-none bg-[#2F4A8A] text-white rounded-full px-4 py-3 md:py-2.5 text-[13px] md:text-[12px] font-medium flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] transition">
                      <Plus size={16} /> New Patient
                    </button>
                    <button className="bg-white/80 backdrop-blur rounded-full w-11 h-11 md:w-9 md:h-9 flex items-center justify-center border border-white/60 shrink-0">
                      <SlidersHorizontal size={18} />
                    </button>
                </div>
            </div>

            {/* MOBILE - CARROSSEL 1 CARD 100% */}
            <div className="flex md:hidden gap-3 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-1 pb-2"
                 style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {cards.map((c)=>(
                <div key={c.id} className={`min-w-[100%] snap-center snap-always ${c.bg} backdrop-blur-xl rounded-[22px] p-4 shadow-sm border border-white/60 flex flex-col justify-between h-[130px] shrink-0`}>
                    <div className="flex justify-between items-start">
                      <div><p className="text-[28px] font-black leading-none">{c.value}</p><p className={`text-[13px] mt-1 font-medium ${c.labelColor}`}>{c.label}</p></div>
                      <div className={`w-8 h-8 ${c.iconBg} rounded-full flex items-center justify-center shrink-0`}>{c.icon}</div>
                    </div>
                    {c.bottom}
                </div>
              ))}
            </div>

            {/* DESKTOP - GRID 4 */}
            <div className="hidden lg:grid grid-cols-4 gap-3">
              {cards.map((c)=>(
                <div key={c.id} className={`${c.bg} backdrop-blur-xl rounded-[18px] p-4 shadow-sm border border-white/60 flex flex-col justify-between min-h-[120px]`}>
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0"><p className="text-[22px] font-black leading-none">{c.value}</p><p className={`text-[11px] mt-1 ${c.labelColor}`}>{c.label}</p></div>
                      <div className={`w-7 h-7 ${c.iconBg} rounded-full flex items-center justify-center shrink-0`}>{c.icon}</div>
                    </div>
                    {c.bottom}
                </div>
              ))}
            </div>

            {/* TABELA / LISTA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="lg:col-span-2 bg-white/70 backdrop-blur-xl rounded-[20px] md:rounded-[18px] p-3 md:p-4 flex flex-col border border-white/50 min-w-0">
                    <div className="flex justify-between items-center mb-3 px-1">
                      <h2 className="font-bold text-[15px] md:text-[13px]">Priority Patient Queue</h2>
                      <button className="text-[12px] md:text-[11px] font-semibold bg-white/80 px-4 py-2 md:px-3 md:py-1.5 rounded-full border border-white/60">View All</button>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {[
                        { name: "James Wilson", sub: "Post-Op CABG · ICU-204", status: "Critical", img: 10 },
                        { name: "Elena Rostova", sub: "Ketoacidosis · ER-102", status: "Critical", img: 32 },
                        { name: "Sarah Jenkins", sub: "Acute Pneumonia · W-412", status: "Watch", img: 26 },
                      ].map((p,i)=>(
                        <div key={i} className="bg-white rounded-[16px] p-3.5 flex justify-between items-center border border-white/80 shadow-sm active:scale-[0.99] transition">
                          <div className="flex gap-3 items-center min-w-0">
                            <img src={`https://i.pravatar.cc/100?img=${p.img}`} className="w-10 h-10 md:w-9 md:h-9 rounded-full shrink-0" style={{ border: '2px solid #ffffff' }} />
                            <div className="min-w-0"><p className="font-bold text-[14px] truncate">{p.name}</p><p className="text-[12px] text-gray-500 truncate">{p.sub}</p></div>
                          </div>
                          <span className={`text-[11px] px-3 py-1 rounded-full font-medium shrink-0 ml-2 ${p.status==="Critical"?"bg-orange-100 text-orange-600":"bg-blue-100 text-blue-600"}`}>{p.status}</span>
                        </div>
                      ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3 min-w-0">
                    <div className="bg-white/70 backdrop-blur-xl rounded-[20px] md:rounded-[18px] p-3 md:p-4 border border-white/50">
                        <h2 className="font-bold text-[14px] md:text-[13px] mb-3 px-1">Quick Actions</h2>
                        <div className="flex flex-col gap-2.5">
                            <button className="bg-white rounded-[14px] p-3.5 flex items-center justify-between w-full text-left shadow-sm border border-white/60 active:scale-[0.98] transition">
                              <div className="flex gap-3 items-center min-w-0"><div className="w-10 h-10 bg-blue-50 rounded-[12px] flex items-center justify-center shrink-0"><ClipboardList size={18} className="text-blue-600" /></div><div className="min-w-0"><p className="text-[13px] font-semibold truncate">Today's Care Tasks</p><p className="text-[11px] text-gray-400">12 tasks</p></div></div><span className="text-gray-400 text-[18px]">›</span>
                            </button>
                            <button className="bg-white rounded-[14px] p-3.5 flex items-center justify-between w-full text-left shadow-sm border border-white/60 active:scale-[0.98] transition">
                              <div className="flex gap-3 items-center min-w-0"><div className="w-10 h-10 bg-blue-50 rounded-[12px] flex items-center justify-center shrink-0"><Pill size={18} className="text-blue-600" /></div><div className="min-w-0"><p className="text-[13px] font-semibold truncate">Medication Reviews</p><p className="text-[11px] text-gray-400">5 require signature</p></div></div><span className="text-gray-400 text-[18px]">›</span>
                            </button>
                            <button className="bg-white rounded-[14px] p-3.5 flex items-center justify-between w-full text-left shadow-sm border border-white/60 active:scale-[0.98] transition">
                              <div className="flex gap-3 items-center min-w-0"><div className="w-10 h-10 bg-blue-50 rounded-[12px] flex items-center justify-center shrink-0"><Calendar size={18} className="text-blue-600" /></div><div className="min-w-0"><p className="text-[13px] font-semibold truncate">Appointments</p><p className="text-[11px] text-gray-400">Next 11:30 AM</p></div></div><span className="text-gray-400 text-[18px]">›</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
             .scrollbar-hide::-webkit-scrollbar{display:none}
             .scrollbar-hide{ -ms-overflow-style:none; scrollbar-width:none; }
            `}</style>
        </div>
    );
}

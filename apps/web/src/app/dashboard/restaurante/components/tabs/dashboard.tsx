"use client";
import { useState } from "react";
import { Plus, SlidersHorizontal, ArrowUpRight, FileChartColumn, TriangleAlert, File, Eye, ClipboardList, Pill, Calendar, MoreVertical } from "lucide-react";

export function HomeTab({ user }: { user: any }) {
    const [stats] = useState({ active: 128, urgent: 7, pending: 14, watchlist: 23 });

    return (
        <div className="flex flex-col gap-3 md:gap-4 w-full min-w-0 pb-6">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                <h1 className="text-[18px] md:text-[20px] font-bold text-slate-800 leading-tight truncate">
                  Good Morning, {user?.nome || "Dr. Roberts"}
                </h1>
                <div className="flex gap-2 shrink-0">
                    <button className="flex-1 md:flex-none bg-[#2F4A8A] text-white rounded-full px-4 py-2.5 text-[12px] font-medium flex items-center justify-center gap-1.5 shadow-lg">
                      <Plus size={14} /> New Patient
                    </button>
                    <button className="bg-white/70 backdrop-blur rounded-full w-10 h-10 md:w-9 md:h-9 flex items-center justify-center border border-white/50 shrink-0">
                      <SlidersHorizontal size={16} />
                    </button>
                </div>
            </div>

            {/* CARDS - 2 COLS MOBILE / 4 DESKTOP */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 md:gap-3">
                <div className="bg-white/80 backdrop-blur-xl rounded-[18px] p-3.5 md:p-4 shadow-sm border border-white/60">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0"><p className="text-[20px] md:text-[22px] font-black">{stats.active}</p><p className="text-[10px] md:text-[11px] text-blue-600 leading-tight">Active Patients</p></div>
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center shrink-0"><FileChartColumn size={14} className="text-blue-700" /></div>
                    </div>
                    <div className="flex gap-1 mt-4 items-end h-8"><div className="w-full h-2 bg-[#A8C7F0] rounded-sm" /><div className="w-full h-3 bg-[#A8C7F0] rounded-sm" /><div className="w-full h-7 bg-[#1E3A8A] rounded-sm" /></div>
                </div>

                <div className="bg-white/80 backdrop-blur-xl rounded-[18px] p-3.5 md:p-4 shadow-sm border border-white/60">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0"><p className="text-[20px] md:text-[22px] font-black">{stats.urgent}</p><p className="text-[10px] md:text-[11px] text-gray-500">Urgent Cases</p></div>
                      <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center shrink-0"><TriangleAlert size={14} className="text-orange-500" /></div>
                    </div>
                    <p className="text-[10px] md:text-[11px] text-red-500 mt-4 md:mt-6 flex items-center gap-1"><ArrowUpRight size={12} />+2 in last hour</p>
                </div>

                <div className="bg-[#FFF68F]/90 backdrop-blur-xl rounded-[18px] p-3.5 md:p-4 shadow-sm border border-white/60">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0"><p className="text-[20px] md:text-[22px] font-black">{stats.pending}</p><p className="text-[10px] md:text-[11px]">Pending Reviews</p></div>
                      <div className="w-7 h-7 bg-white/60 rounded-full flex items-center justify-center shrink-0"><File size={14} /></div>
                    </div>
                    <div className="mt-4 md:mt-6"><div className="h-1.5 bg-black/10 rounded-full"><div className="h-1.5 w-1/2 bg-black rounded-full" /></div><p className="text-[10px] mt-1.5">6 completed · 14 remaining</p></div>
                </div>

                <div className="bg-gradient-to-br from-[#5A8AD0] to-[#A9C5F0] backdrop-blur-xl rounded-[18px] p-3.5 md:p-4 shadow-lg text-white border border-white/30">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0"><p className="text-[20px] md:text-[22px] font-black">{stats.watchlist}</p><p className="text-[10px] md:text-[11px] text-white/80">AI Watchlist</p></div>
                      <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center shrink-0"><Eye size={14} /></div>
                    </div>
                    <span className="mt-4 md:mt-5 inline-flex bg-white/20 rounded-full px-2.5 py-1 text-[10px]">◎ 4 new insights</span>
                </div>
            </div>

            {/* CONTEUDO PRINCIPAL */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-3">
                {/* TABELA DESKTOP / CARDS MOBILE */}
                <div className="lg:col-span-2 bg-white/60 md:bg-white/50 backdrop-blur-xl rounded-[18px] p-3 md:p-4 flex flex-col border border-white/50 min-w-0">
                    <div className="flex justify-between items-center mb-3">
                      <h2 className="font-bold text-[13px] md:text-[13px]">Priority Patient Queue</h2>
                      <button className="text-[11px] font-semibold bg-white/70 px-3 py-1.5 rounded-full">View All</button>
                    </div>

                    {/* VERSÃO DESKTOP */}
                    <div className="hidden md:block bg-white/80 backdrop-blur rounded-[16px] p-2 flex-1 overflow-hidden">
                        <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_50px] text-[10px] text-[#7A9DD6] font-semibold px-3 py-2"><span>PATIENT</span><span>ROOM</span><span>CONDITION</span><span>VITALS</span><span>STATUS</span><span></span></div>
                        {[
                            { name: "James Wilson", sub: "Male, 72 yrs", room: "ICU-204", cond: "Post-Op CABG", vitals: "HR 112", status: "Critical", color: "bg-orange-100 text-orange-600" },
                            { name: "Elena Rostova", sub: "Female, 29 yrs", room: "ER-102", cond: "Ketoacidosis", vitals: "HR 118", status: "Critical", color: "bg-orange-100 text-orange-600" },
                            { name: "Sarah Jenkins", sub: "Female, 54 yrs", room: "W-412", cond: "Acute Pneumonia", vitals: "HR 95", status: "Watch", color: "bg-blue-100 text-blue-600" },
                        ].map((p, i) => (
                            <div key={i} className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_50px] items-center px-3 py-3 border-t text-[12px] hover:bg-gray-50/50">
                                <div className="flex gap-2 items-center min-w-0"><img src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-7 h-7 rounded-full shrink-0" /><div className="min-w-0"><p className="font-semibold text-[12px] truncate">{p.name}</p><p className="text-[10px] text-gray-400 truncate">{p.sub}</p></div></div>
                                <span className="text-[11px]">{p.room}</span><span className="text-[11px] truncate">{p.cond}</span><span className="text-[10px]">{p.vitals}</span><span className={`text-[10px] px-2 py-1 rounded-full w-fit ${p.color}`}>◎ {p.status}</span><button className="w-6 h-6 rounded-full border flex items-center justify-center"><MoreVertical size={12} /></button>
                            </div>
                        ))}
                    </div>

                    {/* VERSÃO MOBILE - CARDS */}
                    <div className="md:hidden flex flex-col gap-2">
                      {[
                        { name: "James Wilson", sub: "Male, 72 yrs", room: "ICU-204", cond: "Post-Op CABG", status: "Critical" },
                        { name: "Elena Rostova", sub: "Female, 29 yrs", room: "ER-102", cond: "Ketoacidosis", status: "Critical" },
                        { name: "Sarah Jenkins", sub: "Female, 54 yrs", room: "W-412", cond: "Acute Pneumonia", status: "Watch" },
                      ].map((p,i)=>(
                        <div key={i} className="bg-white/90 rounded-[14px] p-3 flex justify-between items-center border border-white/60">
                          <div className="flex gap-2.5 items-center min-w-0"><img src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-9 h-9 rounded-full shrink-0"/><div className="min-w-0"><p className="font-bold text-[13px] truncate">{p.name}</p><p className="text-[11px] text-gray-500 truncate">{p.cond} • {p.room}</p></div></div>
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-medium shrink-0 ${p.status==="Critical"?"bg-orange-100 text-orange-600":"bg-blue-100 text-blue-600"}`}>{p.status}</span>
                        </div>
                      ))}
                    </div>
                </div>

                <div className="flex flex-col gap-3 min-w-0">
                    <div className="bg-white/60 backdrop-blur-xl rounded-[18px] p-3 md:p-4 border border-white/50">
                        <h2 className="font-bold text-[13px] mb-3">Quick Actions</h2>
                        <div className="flex flex-col gap-2">
                            <button className="bg-white/90 backdrop-blur rounded-[12px] p-3 flex items-center justify-between w-full text-left active:scale-[0.98] transition">
                              <div className="flex gap-2.5 items-center min-w-0"><div className="w-9 h-9 bg-blue-50 rounded-[10px] flex items-center justify-center shrink-0"><ClipboardList size={16} className="text-blue-600" /></div><div className="min-w-0"><p className="text-[12px] font-semibold truncate">Today's Care Tasks</p><p className="text-[10px] text-gray-400">12 tasks</p></div></div><span className="text-gray-400">›</span>
                            </button>
                            <button className="bg-white/90 rounded-[12px] p-3 flex items-center justify-between w-full text-left active:scale-[0.98] transition">
                              <div className="flex gap-2.5 items-center min-w-0"><div className="w-9 h-9 bg-blue-50 rounded-[10px] flex items-center justify-center shrink-0"><Pill size={16} className="text-blue-600" /></div><div className="min-w-0"><p className="text-[12px] font-semibold truncate">Medication Reviews</p><p className="text-[10px] text-gray-400">5 require signature</p></div></div><span className="text-gray-400">›</span>
                            </button>
                            <button className="bg-white/90 rounded-[12px] p-3 flex items-center justify-between w-full text-left active:scale-[0.98] transition">
                              <div className="flex gap-2.5 items-center min-w-0"><div className="w-9 h-9 bg-blue-50 rounded-[10px] flex items-center justify-center shrink-0"><Calendar size={16} className="text-blue-600" /></div><div className="min-w-0"><p className="text-[12px] font-semibold truncate">Appointments</p><p className="text-[10px] text-gray-400">Next 11:30 AM</p></div></div><span className="text-gray-400">›</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";
import { Search, Bell, Mail, Home, Users, Heart, Monitor, LayoutGrid, Settings, Plus, SlidersHorizontal, ArrowUpRight, FileChartColumn, TriangleAlert, File, Eye, Sparkles, ClipboardList, Pill, Calendar, MoreVertical } from "lucide-react";

export default function Dashboard() {
    return (
        <div className="min-h-screen bg-[#6B8CC6] p-3">
            <div className="bg-[#D9E6FB] rounded-[28px] flex gap-3 p-3 min-h-[95vh]">
                {/* LEFT SIDEBAR */}
                <aside className="w-[64px] bg-[#7A9DD6] rounded-[22px] flex flex-col items-center justify-between py-4">
                    <div className="flex flex-col items-center gap-6">
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#7A9DD6] font-black">J</div>
                        <nav className="flex flex-col gap-3">
                            <button className="w-10 h-10 bg-[#FFE86A] rounded-full flex items-center justify-center shadow-sm"><Home size={18} /></button>
                            <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white/70"><Users size={18} /></button>
                            <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white/70"><Heart size={18} /></button>
                            <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white/70"><Monitor size={18} /></button>
                            <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white/70"><LayoutGrid size={18} /></button>
                        </nav>
                    </div>
                    <button className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white/70"><Settings size={18} /></button>
                </aside>

                {/* CENTER CONTENT */}
                <main className="flex-1 flex flex-col gap-4">
                    {/* TOP BAR */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-white rounded-full px-4 py-2.5 w-[380px] shadow-sm">
                            <Search size={18} className="text-gray-400" />
                            <input className="flex-1 outline-none text-[13px]" placeholder="Search Patient, Medical Records..." />
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"><Bell size={16} /></button>
                            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"><Mail size={16} /></button>
                            <div className="bg-white rounded-full pl-1 pr-3 py-1 flex items-center gap-2 shadow-sm">
                                <img src="https://i.pravatar.cc/100?img=33" className="w-8 h-8 rounded-full" />
                                <div><p className="text-[13px] font-bold leading-none">Dr. Roberts</p><p className="text-[11px] text-gray-400">Attending Physician</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <h1 className="text-[20px] font-bold text-slate-800">Good Morning, Dr. Roberts</h1>
                        <div className="flex gap-2">
                            <button className="bg-[#2F4A8A] text-white rounded-full px-4 py-2 text-xs flex items-center gap-1"><Plus size={14} /> New Patient</button>
                            <button className="bg-white rounded-full w-8 h-8 flex items-center justify-center"><SlidersHorizontal size={14} /></button>
                        </div>
                    </div>

                    {/* 4 CARDS - FULL WIDTH */}
                    <div className="grid grid-cols-4 gap-3">
                        <div className="bg-white rounded-[18px] p-4 shadow-sm border border-white">
                            <div className="flex justify-between"><div><p className="text-[22px] font-black">128</p><p className="text-[11px] text-blue-600">Active Patients</p></div><div className="w-7 h-7 bg-blue-50 rounded-full flex items-center justify-center"><FileChartColumn size={14} className="text-blue-700" /></div></div>
                            <div className="flex gap-1 mt-3 items-end h-8"><div className="w-full h-2 bg-[#A8C7F0] rounded-sm" /><div className="w-full h-3 bg-[#A8C7F0] rounded-sm" /><div className="w-full h-2.5 bg-[#A8C7F0] rounded-sm" /><div className="w-full h-4 bg-[#A8C7F0] rounded-sm" /><div className="w-full h-6 bg-[#7A9DD6] rounded-sm" /><div className="w-full h-4 bg-[#7A9DD6] rounded-sm" /><div className="w-full h-7 bg-[#1E3A8A] rounded-sm" /></div>
                        </div>
                        <div className="bg-white rounded-[18px] p-4 shadow-sm">
                            <div className="flex justify-between"><div><p className="text-[22px] font-black">07</p><p className="text-[11px] text-gray-500">7 Urgent Cases</p></div><div className="w-7 h-7 bg-orange-50 rounded-full flex items-center justify-center"><TriangleAlert size={14} className="text-orange-500" /></div></div>
                            <p className="text-[11px] text-red-500 mt-6 flex items-center gap-1"><ArrowUpRight size={12} />+2 in last hour</p>
                        </div>
                        <div className="bg-[#FFF68F] rounded-[18px] p-4 shadow-sm">
                            <div className="flex justify-between"><div><p className="text-[22px] font-black">14</p><p className="text-[11px] text-gray-600">Pending Reviews</p></div><div className="w-7 h-7 bg-white/60 rounded-full flex items-center justify-center"><File size={14} /></div></div>
                            <div className="mt-6"><div className="h-1.5 bg-black/10 rounded-full"><div className="h-1.5 w-1/2 bg-[#E6C200] rounded-full" /></div><p className="text-[10px] mt-1 text-gray-600">6 completed · 14 remaining</p></div>
                        </div>
                        <div className="bg-gradient-to-br from-[#5A8AD0] to-[#A9C5F0] rounded-[18px] p-4 shadow-sm text-white">
                            <div className="flex justify-between"><div><p className="text-[22px] font-black">23</p><p className="text-[11px] text-white/80">Patients on AI Watchlist</p></div><div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center"><Eye size={14} /></div></div>
                            <span className="mt-5 inline-flex items-center gap-1 bg-white/20 rounded-full px-2 py-1 text-[10px]">◎ 4 new insights</span>
                        </div>
                    </div>

                    {/* BOTTOM AREA */}
                    <div className="grid grid-cols-3 gap-3 flex-1">
                        <div className="col-span-2 bg-[#EAF0FF] rounded-[18px] p-4 flex flex-col">
                            <div className="flex justify-between items-center mb-3"><h2 className="font-bold text-[13px]">Priority Patient Queue</h2><button className="text-[11px] font-semibold">View All</button></div>
                            <div className="bg-white rounded-[16px] p-2 flex-1">
                                <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_50px] text-[10px] text-[#7A9DD6] font-semibold px-3 py-2"><span>PATIENT</span><span>ROOM</span><span>CONDITION</span><span>VITALS</span><span>STATUS</span><span>ACTION</span></div>
                                {[
                                    { name: "James Wilson", sub: "Male, 72 yrs", room: "ICU-204", cond: "Post-Op CABG", vitals: "HR 112\nSpO2 89%", status: "Critical", color: "bg-orange-100 text-orange-600" },
                                    { name: "Elena Rostova", sub: "Female, 29 yrs", room: "ER-102", cond: "Ketoacidosis", vitals: "HR 118\nTemp 101°F", status: "Critical", color: "bg-orange-100 text-orange-600" },
                                    { name: "Sarah Jenkins", sub: "Female, 54 yrs", room: "W-412", cond: "Acute Pneumonia", vitals: "HR 95\nSpO2 92%", status: "Watch", color: "bg-blue-100 text-blue-600" },
                                    { name: "David Kim", sub: "Male, 61 yrs", room: "W-215", cond: "High BP", vitals: "HR 82\nBP 155/95", status: "Watch", color: "bg-blue-100 text-blue-600" },
                                    { name: "Marcus Chen", sub: "Male, 31 yrs", room: "W-305", cond: "Appendectomy", vitals: "HR 72\nSpO2 99%", status: "Stable", color: "bg-green-100 text-green-600" },
                                ].map((p, i) => (
                                    <div key={i} className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_50px] items-center px-3 py-2.5 border-t text-[12px]">
                                        <div className="flex gap-2 items-center"><img src={`https://i.pravatar.cc/100?img=${i + 10}`} className="w-7 h-7 rounded-full" /><div><p className="font-semibold text-[12px]">{p.name}</p><p className="text-[10px] text-gray-400">{p.sub}</p></div></div>
                                        <span className="text-[11px] text-gray-500">{p.room}</span><span className="text-[11px] font-medium">{p.cond}</span><span className="text-[10px] whitespace-pre text-gray-600">{p.vitals}</span><span className={`text-[10px] px-2 py-1 rounded-full w-fit ${p.color}`}>◎ {p.status}</span><button className="w-6 h-6 rounded-full border flex items-center justify-center"><MoreVertical size={12} /></button>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 bg-gradient-to-r from-[#3A5CC0] to-[#7AA8E0] rounded-full p-2 flex items-center justify-between text-white">
                                <div className="flex items-center gap-2 px-2"><Sparkles size={14} className="text-yellow-300" /><span className="text-xs font-bold text-yellow-200">AI Summary</span><span className="text-[11px] text-white/80 ml-3">7 patients need immediate attention. Early intervention can improve outcomes.</span></div>
                                <button className="bg-[#1E2F6B] rounded-full px-3 py-1.5 text-[11px] flex items-center gap-1">Review AI Insights <ArrowUpRight size={12} /></button>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="bg-[#EAF0FF] rounded-[18px] p-4">
                                <h2 className="font-bold text-[13px] mb-3">Quick Actions</h2>
                                <div className="flex flex-col gap-2">
                                    <button className="bg-white rounded-[12px] p-3 flex items-center justify-between shadow-sm"><div className="flex gap-2 items-center"><div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><ClipboardList size={14} /></div><div className="text-left"><p className="text-[12px] font-semibold">Today's Care Tasks</p><p className="text-[10px] text-gray-400">12 tasks pending</p></div></div><span className="text-gray-300">›</span></button>
                                    <button className="bg-white rounded-[12px] p-3 flex items-center justify-between shadow-sm"><div className="flex gap-2 items-center"><div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><Pill size={14} /></div><div className="text-left"><p className="text-[12px] font-semibold">Medication Reviews</p><p className="text-[10px] text-gray-400">5 require signature</p></div></div><span className="text-gray-300">›</span></button>
                                    <button className="bg-white rounded-[12px] p-3 flex items-center justify-between shadow-sm"><div className="flex gap-2 items-center"><div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><Calendar size={14} /></div><div className="text-left"><p className="text-[12px] font-semibold">Upcoming Appointments</p><p className="text-[10px] text-gray-400">Next at 11:30 AM</p></div></div><span className="text-gray-300">›</span></button>
                                </div>
                            </div>
                            <div className="bg-[#EAF0FF] rounded-[18px] p-4 flex-1">
                                <h2 className="font-bold text-[13px] mb-4">Patient Risk Distribution</h2>
                                <div className="flex items-center justify-center relative">
                                    <svg width="160" height="100" viewBox="0 0 160 100"><path d="M 20 90 A 70 70 0 0 1 140 90" fill="none" stroke="#E5E7EB" strokeWidth="14" /><path d="M 20 90 A 70 70 0 0 1 85 21" fill="none" stroke="#3B82F6" strokeWidth="14" /><path d="M 85 21 A 70 70 0 0 1 128 45" fill="none" stroke="#FDE047" strokeWidth="14" /><path d="M 128 45 A 70 70 0 0 1 140 90" fill="none" stroke="#111827" strokeWidth="14" /></svg>
                                    <div className="absolute bottom-0 flex flex-col items-center"><span className="text-[24px] font-black leading-none">128</span><span className="text-[11px] text-gray-500">Patient</span></div>
                                </div>
                                <div className="flex justify-between text-[11px] mt-2"><span className="text-blue-600"><b>82%</b> Stable</span><span><b>13%</b> Watch</span><span className="text-red-500"><b>5%</b> Critical</span></div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Mail, Home, Users, Heart, Monitor, LayoutGrid, Settings, Plus, SlidersHorizontal, ArrowUpRight, FileChartColumn, TriangleAlert, File, Eye, Sparkles, ClipboardList, Pill, Calendar, MoreVertical, Power } from "lucide-react";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ active: 128, urgent: 7, pending: 14, watchlist: 23 });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const u = localStorage.getItem("user");
    if (!token) { router.push("/login"); return; }
    if (u) setUser(JSON.parse(u));
    // LIGA COM BACKEND - descomenta quando API estiver pronta
    // fetch(`${process.env.NEXT_PUBLIC_API_URL}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` }})
    //.then(r=>r.json()).then(setStats)
  }, []);

  const logout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#5A8AD4] p-3 font-[Zalando_Sans_Expanded]">
      {/* GLASS CONTAINER */}
      <div className="bg-white/30 backdrop-blur-2xl rounded-[28px] flex gap-3 p-3 min-h-[95vh] border border-white/40 shadow-[0_8px_32px_rgba(31,38,135,0.2)]">
        {/* SIDEBAR GLASS */}
        <aside className="w-[64px] bg-white/20 backdrop-blur-xl rounded-[22px] flex flex-col items-center justify-between py-4 border border-white/30 shadow-lg">
          <div className="flex flex-col items-center gap-6">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#5A8AD4] font-black shadow-md">J</div>
            <nav className="flex flex-col gap-3">
              <button className="w-10 h-10 bg-[#FFE86A] rounded-full flex items-center justify-center shadow-md"><Home size={18}/></button>
              <button className="w-10 h-10 bg-white/30 backdrop-blur rounded-full flex items-center justify-center text-white/80 hover:bg-white/50 transition"><Users size={18}/></button>
              <button className="w-10 h-10 bg-white/30 backdrop-blur rounded-full flex items-center justify-center text-white/80 hover:bg-white/50 transition"><Heart size={18}/></button>
              <button className="w-10 h-10 bg-white/30 backdrop-blur rounded-full flex items-center justify-center text-white/80 hover:bg-white/50 transition"><Monitor size={18}/></button>
              <button className="w-10 h-10 bg-white/30 backdrop-blur rounded-full flex items-center justify-center text-white/80 hover:bg-white/50 transition"><LayoutGrid size={18}/></button>
            </nav>
          </div>
          <div className="flex flex-col gap-3">
            <button className="w-10 h-10 bg-white/30 backdrop-blur rounded-full flex items-center justify-center text-white/70"><Settings size={18}/></button>
            <button onClick={logout} className="w-10 h-10 bg-red-500/90 hover:bg-red-600 backdrop-blur rounded-full flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition" title="Terminar sessão"><Power size={18}/></button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-xl rounded-full px-4 py-2.5 w-[380px] shadow-sm border border-white/50">
              <Search size={18} className="text-gray-400"/><input className="flex-1 outline-none text-[13px] bg-transparent" placeholder="Search Patient, Medical Records..."/>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-10 h-10 bg-white/60 backdrop-blur rounded-full flex items-center justify-center shadow-sm border border-white/50"><Bell size={16}/></button>
              <button className="w-10 h-10 bg-white/60 backdrop-blur rounded-full flex items-center justify-center shadow-sm border border-white/50"><Mail size={16}/></button>
              <div className="bg-white/70 backdrop-blur-xl rounded-full pl-1 pr-3 py-1 flex items-center gap-2 shadow-sm border border-white/50">
                <img src="https://i.pravatar.cc/100?img=33" className="w-8 h-8 rounded-full"/><div><p className="text-[13px] font-bold leading-none">{user?.nome || "Dr. Roberts"}</p><p className="text-[11px] text-gray-500">Attending Physician</p></div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <h1 className="text-[20px] font-bold text-slate-800">Good Morning, {user?.nome || "Dr. Roberts"}</h1>
            <div className="flex gap-2">
              <button className="bg-[#2F4A8A] text-white rounded-full px-4 py-2 text-xs flex items-center gap-1 shadow-lg"><Plus size={14}/> New Patient</button>
              <button className="bg-white/60 backdrop-blur rounded-full w-8 h-8 flex items-center justify-center border border-white/50"><SlidersHorizontal size={14}/></button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)] border border-white/60">
              <div className="flex justify-between"><div><p className="text-[22px] font-black">{stats.active}</p><p className="text-[11px] text-blue-600">Active Patients</p></div><div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center"><FileChartColumn size={14} className="text-blue-700"/></div></div>
              <div className="flex gap-1 mt-3 items-end h-8"><div className="w-full h-2 bg-[#A8C7F0] rounded-sm"/><div className="w-full h-3 bg-[#A8C7F0] rounded-sm"/><div className="w-full h-7 bg-[#1E3A8A] rounded-sm"/></div>
            </div>
            <div className="bg-white/70 backdrop-blur-xl rounded-[18px] p-4 shadow-sm border border-white/60">
              <div className="flex justify-between"><div><p className="text-[22px] font-black">{stats.urgent}</p><p className="text-[11px] text-gray-500">Urgent Cases</p></div><div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center"><TriangleAlert size={14} className="text-orange-500"/></div></div>
              <p className="text-[11px] text-red-500 mt-6 flex items-center gap-1"><ArrowUpRight size={12}/>+2 in last hour</p>
            </div>
            <div className="bg-[#FFF68F]/80 backdrop-blur-xl rounded-[18px] p-4 shadow-sm border border-white/60">
              <div className="flex justify-between"><div><p className="text-[22px] font-black">{stats.pending}</p><p className="text-[11px]">Pending Reviews</p></div><div className="w-7 h-7 bg-white/60 rounded-full flex items-center justify-center"><File size={14}/></div></div>
              <div className="mt-6"><div className="h-1.5 bg-black/10 rounded-full"><div className="h-1.5 w-1/2 bg-black rounded-full"/></div><p className="text-[10px] mt-1">6 completed · 14 remaining</p></div>
            </div>
            <div className="bg-gradient-to-br from-[#5A8AD0]/90 to-[#A9C5F0]/90 backdrop-blur-xl rounded-[18px] p-4 shadow-lg text-white border border-white/30">
              <div className="flex justify-between"><div><p className="text-[22px] font-black">{stats.watchlist}</p><p className="text-[11px] text-white/80">AI Watchlist</p></div><div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center"><Eye size={14}/></div></div>
              <span className="mt-5 inline-flex bg-white/20 rounded-full px-2 py-1 text-[10px]">◎ 4 new insights</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 flex-1">
            <div className="col-span-2 bg-white/50 backdrop-blur-xl rounded-[18px] p-4 flex flex-col border border-white/50">
              <div className="flex justify-between mb-3"><h2 className="font-bold text-[13px]">Priority Patient Queue</h2><button className="text-[11px] font-semibold">View All</button></div>
              <div className="bg-white/80 backdrop-blur rounded-[16px] p-2 flex-1">
                <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_50px] text-[10px] text-[#7A9DD6] font-semibold px-3 py-2"><span>PATIENT</span><span>ROOM</span><span>CONDITION</span><span>VITALS</span><span>STATUS</span><span>ACTION</span></div>
                {[
                  {name:"James Wilson",sub:"Male, 72 yrs",room:"ICU-204",cond:"Post-Op CABG",vitals:"HR 112",status:"Critical",color:"bg-orange-100 text-orange-600"},
                  {name:"Elena Rostova",sub:"Female, 29 yrs",room:"ER-102",cond:"Ketoacidosis",vitals:"HR 118",status:"Critical",color:"bg-orange-100 text-orange-600"},
                  {name:"Sarah Jenkins",sub:"Female, 54 yrs",room:"W-412",cond:"Acute Pneumonia",vitals:"HR 95",status:"Watch",color:"bg-blue-100 text-blue-600"},
                ].map((p,i)=>(<div key={i} className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_50px] items-center px-3 py-2.5 border-t text-[12px]"><div className="flex gap-2 items-center"><img src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-7 h-7 rounded-full"/><div><p className="font-semibold text-[12px]">{p.name}</p><p className="text-[10px] text-gray-400">{p.sub}</p></div></div><span className="text-[11px]">{p.room}</span><span className="text-[11px]">{p.cond}</span><span className="text-[10px]">{p.vitals}</span><span className={`text-[10px] px-2 py-1 rounded-full w-fit ${p.color}`}>◎ {p.status}</span><button className="w-6 h-6 rounded-full border flex items-center justify-center"><MoreVertical size={12}/></button></div>))}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="bg-white/50 backdrop-blur-xl rounded-[18px] p-4 border border-white/50">
                <h2 className="font-bold text-[13px] mb-3">Quick Actions</h2>
                <div className="flex flex-col gap-2">
                  <button className="bg-white/80 backdrop-blur rounded-[12px] p-3 flex items-center justify-between"><div className="flex gap-2 items-center"><div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><ClipboardList size={14}/></div><div className="text-left"><p className="text-[12px] font-semibold">Today's Care Tasks</p><p className="text-[10px] text-gray-400">12 tasks</p></div></div><span>›</span></button>
                  <button className="bg-white/80 rounded-[12px] p-3 flex items-center justify-between"><div className="flex gap-2 items-center"><div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><Pill size={14}/></div><div className="text-left"><p className="text-[12px] font-semibold">Medication Reviews</p><p className="text-[10px] text-gray-400">5 require signature</p></div></div><span>›</span></button>
                  <button className="bg-white/80 rounded-[12px] p-3 flex items-center justify-between"><div className="flex gap-2 items-center"><div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center"><Calendar size={14}/></div><div className="text-left"><p className="text-[12px] font-semibold">Appointments</p><p className="text-[10px] text-gray-400">Next 11:30 AM</p></div></div><span>›</span></button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("access_token");
    const u = localStorage.getItem("user");
    if (!token ||!u) {
      window.location.href = "/login";
      return;
    }
    try {
      setUser(JSON.parse(u));
    } catch {
      localStorage.clear();
      window.location.href = "/login";
    }
  }, []);

  if (!mounted ||!user) {
    return <div className="min-h-screen bg-[#7BA7E8] flex items-center justify-center text-white">Carregando J-OS...</div>;
  }

  return (
    <div className="min-h-screen bg-[#5A8AD4] p-3 flex gap-3 font-sans">
      {/* SIDEBAR */}
      <aside className="w-[72px] bg-[#4F7FC7] rounded-[24px] flex flex-col items-center py-6 justify-between">
        <div className="space-y-6">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-bold text-[#4F7FC7]">J</div>
          <div className="flex flex-col gap-3 mt-10">
            <button className="w-10 h-10 bg-[#FDE68A] rounded-full flex items-center justify-center">⌂</button>
            <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/70">⚇</button>
            <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/70">♡</button>
            <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/70">▭</button>
            <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/70">◫</button>
          </div>
        </div>
        <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/70">⚙</button>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-[#DDE9FF] rounded-[24px] p-5 overflow-hidden">
        {/* TOPBAR */}
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex-1 max-w-[480px] bg-white rounded-full px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <span className="text-zinc-400">⌕</span>
            <input placeholder="Search Patient, Medical Records..." className="bg-transparent outline-none text-sm w-full placeholder:text-zinc-400" />
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">🔔</button>
            <button className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm">✉</button>
            <div className="flex items-center gap-2 bg-white rounded-full pl-1 pr-3 py-1 shadow-sm">
              <img src={`https://i.pravatar.cc/100?img=12`} className="w-8 h-8 rounded-full" />
              <div className="leading-tight">
                <p className="text-[13px] font-bold text-zinc-800">Dr. Roberts</p>
                <p className="text-[10px] text-zinc-500">Attending Physician</p>
              </div>
              <span className="text-zinc-400 ml-1 text-xs">⌄</span>
            </div>
          </div>
        </div>

        <h1 className="text-[22px] font-bold text-[#1E2A44] mb-3">Good Morning, Dr. Roberts</h1>

        <div className="flex gap-5">
          {/* LEFT */}
          <div className="flex-1">
            {/* 4 CARDS TOP */}
            <div className="grid grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-[18px] p-4 shadow-sm">
                <div className="flex justify-between">
                  <p className="text-[24px] font-bold">128</p>
                  <span className="w-6 h-6 bg-blue-50 rounded-full flex items-center justify-center text-[12px]">📈</span>
                </div>
                <p className="text-[11px] text-blue-500 font-medium">Active Patients</p>
                <div className="flex gap-1 items-end mt-3 h-8">
                  {[12,18,14,28,20,34,28].map((h,i)=><div key={i} style={{height:h}} className={`w-5 rounded-sm ${i===6?'bg-[#1E3A8A]':'bg-[#BFDBFE]'}`}></div>)}
                </div>
              </div>

              <div className="bg-white rounded-[18px] p-4 shadow-sm">
                <div className="flex justify-between">
                  <p className="text-[24px] font-bold">07</p>
                  <span className="w-6 h-6 bg-orange-50 rounded-full flex items-center justify-center text-[12px]">⚠</span>
                </div>
                <p className="text-[11px] text-zinc-500">7 Urgent Cases</p>
                <p className="text-[10px] text-orange-500 mt-3">↗ +2 in last hour</p>
              </div>

              <div className="bg-[#FEF9A8] rounded-[18px] p-4 shadow-sm border border-yellow-200">
                <div className="flex justify-between">
                  <p className="text-[24px] font-bold">14</p>
                  <span className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center text-[12px]">📄</span>
                </div>
                <p className="text-[11px] text-zinc-600">Pending Reviews</p>
                <div className="w-full h-1 bg-black/10 rounded-full mt-3"><div className="w-[30%] h-1 bg-yellow-400 rounded-full"></div></div>
                <p className="text-[10px] mt-1">6 completed · 14 remaining</p>
              </div>

              <div className="bg-[#9BB6E8] rounded-[18px] p-4 shadow-sm text-white">
                <div className="flex justify-between">
                  <p className="text-[24px] font-bold">23</p>
                  <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-[12px]">👁</span>
                </div>
                <p className="text-[11px] opacity-80">Patients on AI Watchlist</p>
                <p className="text-[10px] mt-3 bg-white/20 inline-flex px-2 py-0.5 rounded-full">◷ 4 new insights</p>
              </div>
            </div>

            {/* TABLE */}
            <div className="bg-[#EAF2FF] rounded-[18px] p-4 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-[#1E2A44] text-sm">Priority Patient Queue</h3>
                <button className="text-[11px] font-bold text-[#1E2A44]">View All</button>
              </div>

              <div className="bg-white rounded-[14px] overflow-hidden">
                <div className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_0.5fr] text-[10px] text-[#7A9BCF] font-bold px-4 py-2">
                  <span>PATIENT</span><span>ROOM</span><span>CONDITION</span><span>VITALS</span><span>STATUS</span><span>ACTION</span>
                </div>

                {[
                  {name:"James Wilson", age:"Male, 72 yrs", room:"ICU-204", cond:"Post-Op CABG", hr:"112", spo2:"89%", status:"Critical", color:"bg-orange-100 text-orange-600"},
                  {name:"Elena Rostova", age:"Female, 29 yrs", room:"ER-102", cond:"Ketoacidosis", hr:"118", temp:"101°F", status:"Critical", color:"bg-orange-100 text-orange-600"},
                  {name:"Sarah Jenkins", age:"Female, 54 yrs", room:"W-412", cond:"Acute Pneumonia", hr:"95", spo2:"92%", status:"Watch", color:"bg-blue-50 text-blue-600"},
                  {name:"David Kim", age:"Male, 61 yrs", room:"W-215", cond:"High BP", hr:"82", bp:"155/95", status:"Watch", color:"bg-blue-50 text-blue-600"},
                  {name:"Marcus Chen", age:"Male, 31 yrs", room:"W-305", cond:"Appendectomy", hr:"72", spo2:"99%", status:"Stable", color:"bg-green-50 text-green-600"},
                ].map((p,i)=>(
                  <div key={i} className="grid grid-cols-[2fr_1fr_1.5fr_1fr_1fr_0.5fr] items-center px-4 py-3 border-t border-slate-50 text-[12px]">
                    <div className="flex items-center gap-2">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-7 h-7 rounded-full" />
                      <div className="leading-tight"><p className="font-bold text-[12px]">{p.name}</p><p className="text-[10px] text-zinc-500">{p.age}</p></div>
                    </div>
                    <span className="text-[11px] text-zinc-600">{p.room}</span>
                    <span className="text-[11px] font-medium">{p.cond}</span>
                    <div className="text-[10px] leading-tight"><p>HR <b>{p.hr}</b></p><p>{p.spo2?`SpO2 ${p.spo2}`:p.bp?`BP ${p.bp}`:`Temp ${p.temp}`}</p></div>
                    <span className={`text-[10px] px-2 py-1 rounded-full w-fit ${p.color}`}>◉ {p.status}</span>
                    <button className="w-6 h-6 rounded-full border flex items-center justify-center text-zinc-400">⋮</button>
                  </div>
                ))}
              </div>

              <div className="mt-3 bg-[#1E3A8A] rounded-full flex items-center justify-between px-4 py-2.5 text-white">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-yellow-300">✦ AI Summary</span>
                  <span className="text-[11px] opacity-80 border-l border-white/20 pl-3">7 patients need immediate attention. Early intervention can improve outcomes.</span>
                </div>
                <button className="bg-[#2A4BA0] text-[11px] px-4 py-1.5 rounded-full">Review AI Insights ↗</button>
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="w-[280px] space-y-4">
            <div className="bg-[#EAF2FF] rounded-[18px] p-4">
              <h3 className="font-bold text-sm mb-3">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  {t:"Today's Care Tasks", s:"12 tasks pending", icon:"≋"},
                  {t:"Medication Reviews", s:"5 require signature", icon:"◫"},
                  {t:"Upcoming Appointments", s:"Next at 11:30 AM", icon:"▭"},
                ].map((a,i)=>(
                  <div key={i} className="bg-white rounded-[12px] p-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 bg-blue-50 rounded-md flex items-center justify-center text-[12px]">{a.icon}</span>
                      <div className="leading-tight"><p className="text-[12px] font-bold">{a.t}</p><p className="text-[10px] text-zinc-500">{a.s}</p></div>
                    </div>
                    <span className="text-zinc-400">›</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#EAF2FF] rounded-[18px] p-4">
              <h3 className="font-bold text-sm mb-4">Patient Risk Distribution</h3>
              <div className="flex items-center justify-center relative">
                <svg width="160" height="120" viewBox="0 0 100 60">
                  <path d="M10 50 A40 40 0 0 1 90 50" fill="none" stroke="#E5E7EB" strokeWidth="12" />
                  <path d="M10 50 A40 40 0 0 1 70 15" fill="none" stroke="#3B82F6" strokeWidth="12" />
                  <path d="M70 15 A40 40 0 0 1 88 42" fill="none" stroke="#FDE047" strokeWidth="12" />
                  <path d="M88 42 A40 40 0 0 1 90 50" fill="none" stroke="black" strokeWidth="12" />
                </svg>
                <div className="absolute bottom-0 text-center">
                  <p className="text-[28px] font-bold leading-none">128</p>
                  <p className="text-[11px]">Patient</p>
                </div>
              </div>
              <div className="flex justify-between text-[11px] mt-2">
                <span className="text-blue-500"><b>82%</b> Stable</span>
                <span><b>13%</b> Watch</span>
                <span className="text-red-500"><b>5%</b> Critical</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={()=>{localStorage.clear(); window.location.href='/login'}} className="flex-1 bg-white rounded-full py-2 text-[11px] font-bold shadow-sm">Sair</button>
              <button className="flex-1 bg-[#1E3A8A] text-white rounded-full py-2 text-[11px] font-bold shadow-sm">+ New Patient</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

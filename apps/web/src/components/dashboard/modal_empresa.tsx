"use client";
import { useEffect, useState, useRef } from 'react'
import { X, Check, ChevronDown, Upload, Landmark, MapPin, Smartphone, QrCode, Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react'

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://j-os.onrender.com").replace(/\/$/, "") + "/api/v1";

const BANCOS_ANGOLA = [
    "BAI - Banco Angolano de Investimentos","BFA - Banco de Fomento Angola","BIC - Banco BIC",
    "BPC - Banco de Poupança e Crédito","BCI - Banco de Comércio e Indústria","BNI - Banco de Negócios Internacional",
    "BMA - Banco Millennium Atlântico","BCA - Banco Caixa Geral Angola","SOL - Banco Sol",
    "SBA - Standard Bank Angola","BE - Banco Económico","BVB - Banco Valor","BCS - Banco de Crédito do Sul",
    "BCH - Banco Comercial do Huambo","BPG - Banco Prestígio","BMF - Banco BAI Micro Finanças",
    "BIR - Banco de Investimento Rural","FNB - First National Bank Angola",
]
const PROVINCIAS = ["Bengo","Benguela","Bié","Cabinda","Cuando","Cubango","Cuanza-Norte","Cuanza-Sul","Cunene","Huambo","Huíla","Icolo e Bengo","Luanda","Lunda-Norte","Lunda-Sul","Malanje","Moxico","Moxico Leste","Namibe","Uíge","Zaire"]
const MUNICIPIOS: Record<string, string[]> = {
    "Bengo": ["Dande","Ambriz","Bula Atumba","Dembos","Nambuangongo","Pango Aluquém"],
    "Benguela": ["Benguela","Lobito","Baía Farta","Balombo","Bocoio","Caimbambo","Catumbela","Chongorói","Cubal","Ganda"],
    "Bié": ["Kuito","Andulo","Camacupa","Catabola","Chinguar","Chitembo","Cuemba","Cunhinga","Nharea"],
    "Cabinda": ["Cabinda","Belize","Buco-Zau","Cacongo"],
    "Cuando": ["Mavinga","Cuito Cuanavale","Dirico","Rivungo"],
    "Cubango": ["Menongue","Calai","Cuangar","Cuchi","Cuito Cuanavale","Mavinga"],
    "Cuanza-Norte": ["Cazengo","Ambaca","Banga","Bolongongo","Cambambe","Golungo Alto","Gonguembo","Lucala","Quiculungo","Samba Caju"],
    "Cuanza-Sul": ["Sumbe","Amboim","Cassongue","Cela","Conda","Ebo","Libolo","Mussende","Porto Amboim","Quibala","Quilenda","Seles"],
    "Cunene": ["Ondjiva","Cahama","Cuanhama","Curoca","Cuvelai","Namacunde","Ombadja"],
    "Huambo": ["Huambo","Bailundo","Caála","Catchiungo","Chicala-Choloanga","Chinjenje","Ecunha","Londuimbali","Longonjo","Mungo","Ucuma"],
    "Huíla": ["Lubango","Caconda","Cacula","Caluquembe","Chibia","Chicomba","Chipindo","Cuvango","Humpata","Jamba","Matala","Quilengues","Quipungo"],
    "Icolo e Bengo": ["Catete","Bom Jesus","Cabiri","Caculo Cahango","Calomboloca"],
    "Luanda": ["Luanda","Belas","Cacuaco","Cazenga","Kilamba Kiaxi","Talatona","Viana","Kilamba"],
    "Lunda-Norte": ["Dundo","Cambulo","Capenda-Camulemba","Caungula","Cuango","Cuilo","Lubalo","Lucapa","Xá-Muteba"],
    "Lunda-Sul": ["Muangueji","Cassai-Sul","Cassengo","Luma-Cassai","Saurimo","Cacolo","Dala","Muconda"],
    "Malanje": ["Malanje","Cacuso","Cahombo","Calandula","Cambundi-Catembo","Cangandala","Caombo","Cuaba Nzoji","Cunda-Dia-Baze","Luquembo","Marimba","Massango","Mucari","Quela","Quirima"],
    "Moxico": ["Luena","Alto Zambeze","Bundas","Camanongue","Léua","Luau","Luchazes"],
    "Moxico Leste": ["Cazombo","Lago Dilolo","Lumbala Nguimbo","Luau"],
    "Namibe": ["Moçâmedes","Bibala","Camucuio","Tômbwa","Virei"],
    "Uíge": ["Uíge","Alto Cauale","Ambuila","Bembe","Buengas","Bungo","Damba","Milunga","Mucaba","Negage","Puri","Quimbele","Quitexe","Sanza Pombo","Songo","Zombo"],
    "Zaire": ["Mbanza Kongo","Cuimba","Nóqui","Nzeto","Soyo","Tomboco"]
}

interface EmpresaForm { companyName: string; nif: string; email: string; phone: string; address: string; city: string; province: string; iban?: string; iban2?: string; banco1?: string; banco2?: string; logo_url?: string; image_url?: string; id?: string; nome_fantasia?: string; whatsapp_instance?: string; whatsapp_conectado?: boolean }
interface Props { open: boolean; initialData: EmpresaForm; saving: boolean; onClose: () => void; onSave: (data: EmpresaForm & { logoFile?: File | null }) => void; initialTab?: "geral" | "whatsapp"; onWhatsappConnected?: (c:boolean)=>void }

function CustomSelect({ value, options, onChange, placeholder, disabled, icon: Icon }: any) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
    const selected = options.find((o:any) => o.value === value)
    return (
        <div ref={ref} className="relative w-full">
            <button type="button" disabled={disabled} onClick={() =>!disabled && setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 h-9 text-[11px] font-bold flex items-center justify-between hover:border-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all disabled:opacity-50">
                <span className="flex items-center gap-1.5 truncate">{Icon && <Icon size={14} className="text-zinc-400" />}<span className={selected? 'text-black' : 'text-black/40'}>{selected? selected.label : placeholder}</span></span>
                <ChevronDown size={14} className={`ml-2 transition-transform ${open? 'rotate-180':''}`} />
            </button>
            {open && <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-[16px] border border-[#E8DCCF] shadow-[0_16px_32px_rgba(0,0,0,0.18)] p-1 max-h-[160px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">{options.map((o:any)=>(<button key={o.value} type="button" onClick={()=>{onChange(o.value); setOpen(false)}} className={`w-full text-left px-3 py-2.5 rounded-full text-[11px] font-bold transition-all ${value===o.value? 'bg-black text-white':'hover:bg-[#F5E6D3]'}`}>{o.label}</button>))}</div>}
        </div>
    )
}
function BancoSelect({ value, onChange, placeholder }: any) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
    return (
        <div ref={ref} className="relative w-full">
            <button type="button" onClick={() => setOpen(!open)} className="w-full bg-white border border-[#E8DCCF] rounded-full px-4 h-9 text-[11px] font-bold flex items-center justify-between hover:border-black focus:border-black focus:ring-1 focus:ring-black outline-none transition-all">
                <span className="flex items-center gap-1.5 truncate"><Landmark size={14} className="text-zinc-400" /><span className={value? 'text-black':'text-black/40'}>{value||placeholder}</span></span>
                <ChevronDown size={14} className={`ml-2 transition-transform ${open? 'rotate-180':''}`} />
            </button>
            {open && <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-white rounded-[16px] border border-[#E8DCCF] shadow-[0_16px_32px_rgba(0,0,0,0.18)] p-1 max-h-[160px] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">{BANCOS_ANGOLA.map(b=>(<button key={b} type="button" onClick={()=>{onChange(b); setOpen(false)}} className={`w-full text-left px-3 py-2.5 rounded-full text-[10px] font-bold transition-all ${value===b? 'bg-black text-white':'hover:bg-[#F5E6D3]'}`}>{b}</button>))}<button type="button" onClick={()=>{onChange(undefined); setOpen(false)}} className="w-full text-left px-3 py-2.5 rounded-full text-[11px] font-bold text-red-500 hover:bg-red-50">Limpar</button></div>}
        </div>
    )
}

export default function ModalEmpresa({ open, initialData, saving, onClose, onSave, initialTab="geral", onWhatsappConnected }: Props) {
    const [form, setForm] = useState<EmpresaForm>(initialData)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const [tab, setTab] = useState<"geral"|"whatsapp">(initialTab)
    const [waLoading, setWaLoading] = useState(false)
    const [waQr, setWaQr] = useState<string | null>(null)
    const [waConectado, setWaConectado] = useState<boolean>(!!initialData.whatsapp_conectado)
    const [waInstance, setWaInstance] = useState<string>(initialData.whatsapp_instance || "")

    useEffect(() => {
        if (open) {
            setForm(initialData);
            setLogoFile(null);
            setLogoPreview(initialData.logo_url || initialData.image_url || null)
            setTab(initialTab)
            setWaConectado(!!initialData.whatsapp_conectado)
            setWaInstance(initialData.whatsapp_instance || "")
            if(initialTab === "whatsapp") checkStatus()
        }
    }, [initialData, open, initialTab])

    const checkStatus = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if(!form.id &&!initialData.id) return;
            const empId = form.id || initialData.id;
            const r = await fetch(`${API_BASE}/empresas/${empId}/whatsapp/status`, { headers: { Authorization: `Bearer ${token}` } });
            if(r.ok){
                const j = await r.json();
                const c =!!j.conectado;
                setWaConectado(c);
                if(j.instance) setWaInstance(j.instance);
                if(onWhatsappConnected) onWhatsappConnected(c);
                window.dispatchEvent(new CustomEvent("whatsapp:status", { detail: { conectado: c } }));
                if(c) setWaQr(null);
                return c;
            }
        } catch {}
        return false;
    }

    const gerarQr = async () => {
        setWaLoading(true);
        setWaQr(null);
        try {
            const token = localStorage.getItem("access_token");
            const empId = form.id || initialData.id;
            const r = await fetch(`${API_BASE}/empresas/${empId}/whatsapp/qr`, { headers: { Authorization: `Bearer ${token}` } });
            const j = await r.json();
            // evolution retorna base64 em vários formatos
            const base64 = j.qrcode?.base64 || j.base64 || j.qr || j.qrcode || "";
            if(base64){
                const src = base64.startsWith("data:")? base64 : `data:image/png;base64,${base64}`;
                setWaQr(src);
            } else {
                setWaQr(j.qrcode?.pairingCode || null);
            }
            // polling até conectar
            let tries = 0;
            const iv = setInterval(async () => {
                tries++;
                const ok = await checkStatus();
                if(ok || tries > 30){
                    clearInterval(iv);
                    setWaLoading(false);
                }
            }, 3000);
        } catch(e){
            setWaLoading(false);
        }
    }

    useEffect(() => {
        if(tab!== "whatsapp" || waConectado) return;
        // auto-check a cada 5s quando na aba
        const iv = setInterval(checkStatus, 5000);
        return () => clearInterval(iv);
    }, [tab, waConectado]);

    if (!open) return null

    const inputClass = "w-full h-9 rounded-full border border-[#E8DCCF] px-4 text-[11px] font-bold outline-none focus:border-black focus:ring-1 focus:ring-black transition-all bg-white placeholder:text-black/40"
    const labelClass = "text-[8px] font-black tracking-widest text-zinc-500 mb-1 ml-1"
    const municipiosDisponiveis = form.province? (MUNICIPIOS[form.province] || []) : []

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" onClick={onClose} />
            <div className="relative w-full max-w-[440px] bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] flex flex-col max-h-[92dvh] overflow-hidden">

                {/* HEADER FIXO + TABS */}
                <div className="bg-white m-[6px] rounded-[18px] p-3 border border-black/5 shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-black text-[13px] leading-none text-black">CONFIGURAR EMPRESA</p>
                            <p className="text-[11px] text-zinc-600 mt-1 font-bold truncate max-w-[220px]">{form.companyName || form.nome_fantasia || "Minha empresa"}</p>
                        </div>
                        <button onClick={onClose} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200 active:scale-95"><X size={14} /></button>
                    </div>
                    <div className="flex gap-1.5 mt-3 bg-[#F5F2ED] p-1 rounded-full">
                        <button onClick={()=>setTab("geral")} className={`flex-1 h-8 rounded-full text-[11px] font-black transition-all ${tab==="geral"?"bg-black text-white":"text-zinc-500 hover:text-black"}`}>Geral</button>
                        <button onClick={()=>{setTab("whatsapp"); checkStatus()}} className={`flex-1 h-8 rounded-full text-[11px] font-black transition-all flex items-center justify-center gap-1.5 ${tab==="whatsapp"?"bg-black text-white":"text-zinc-500 hover:text-black"}`}>
                            <Smartphone size={12}/> WhatsApp {waConectado? <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"/> : <span className="w-2 h-2 bg-orange-400 rounded-full"/>}
                        </button>
                    </div>
                </div>

                {/* CONTEÚDO */}
                <div className="flex-1 min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {tab === "geral"? (
                    <div className="bg-white m-[6px] mt-0 rounded-[18px] p-4 border border-black/5">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-2.5 bg-[#F5F2ED] border border-[#E8DCCF] rounded-[16px]">
                                <div className="w-10 h-10 rounded-full bg-white border border-[#E8DCCF] flex items-center justify-center overflow-hidden shrink-0">{logoPreview? <img src={logoPreview} className="w-full h-full object-cover" /> : <Upload size={14} className="text-zinc-400" />}</div>
                                <div className="flex-1"><p className="text-[11px] font-black text-black">Logotipo</p><p className="text-[8px] font-bold tracking-widest text-zinc-500">PNG, JPG até 2MB</p></div>
                                <label className="h-8 px-3 rounded-full bg-black text-white text-[10px] font-black flex items-center justify-center cursor-pointer hover:bg-zinc-800 active:scale-95">Escolher<input type="file" accept="image/*" className="hidden" onChange={e=>{const f=e.target.files?.[0]; if(f){setLogoFile(f); setLogoPreview(URL.createObjectURL(f))}}} /></label>
                            </div>

                            <div><p className={labelClass}>NOME DA EMPRESA</p><input value={form.companyName || form.nome_fantasia || ''} onChange={e => setForm({...form, companyName: e.target.value, nome_fantasia: e.target.value})} placeholder="Nome fantasia" className={`${inputClass} font-black`} /></div>
                            <div><p className={labelClass}>NIF</p><input value={form.nif || ''} onChange={e => setForm({...form, nif: e.target.value})} placeholder="NIF" className={inputClass} /></div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div><p className={labelClass}>TELEFONE (DONO - RECEBE CAIXA)</p><input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} placeholder="940000000" className={`${inputClass} ${form.phone?'border-green-200':''}`} /></div>
                                <div><p className={labelClass}>EMAIL</p><input value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className={inputClass} /></div>
                            </div>
                            <div><p className={labelClass}>ENDEREÇO</p><input value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} placeholder="Endereço completo" className={inputClass} /></div>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div><p className={labelClass}>PROVÍNCIA</p><CustomSelect value={form.province || ''} onChange={(v:string) => setForm(prev => ({...prev, province: v, city: ''}))} placeholder="Província" options={PROVINCIAS.map(p => ({ value: p, label: p }))} icon={MapPin} /></div>
                                <div><p className={labelClass}>MUNICÍPIO</p><CustomSelect value={form.city || ''} onChange={(v:string) => setForm({...form, city: v})} placeholder="Município" options={municipiosDisponiveis.map(m => ({ value: m, label: m }))} disabled={!form.province} icon={MapPin} /></div>
                            </div>

                            <div className="h-[1px] bg-black/10 my-2" />
                            <p className="text-[8px] font-black tracking-widest text-zinc-500 ml-1">DADOS BANCÁRIOS</p>

                            <div className="space-y-2.5">
                                <div><p className={labelClass}>BANCO 1</p><BancoSelect value={form.banco1} onChange={(v:any) => setForm({...form, banco1: v})} placeholder="Banco 1" />{form.banco1 && <div className="mt-2"><input value={form.iban || ''} onChange={e => setForm({...form, iban: e.target.value})} placeholder={`IBAN - ${form.banco1.split('-')[0].trim()}`} className={inputClass} /></div>}</div>
                                <div><p className={labelClass}>BANCO 2 (OPCIONAL)</p><BancoSelect value={form.banco2} onChange={(v:any) => setForm({...form, banco2: v})} placeholder="Banco 2" />{form.banco2 && <div className="mt-2"><input value={form.iban2 || ''} onChange={e => setForm({...form, iban2: e.target.value})} placeholder={`IBAN - ${form.banco2.split('-')[0].trim()}`} className={inputClass} /></div>}</div>
                            </div>
                            <div className="h-2" />
                        </div>
                    </div>
                    ) : (
                    <div className="bg-white m-[6px] mt-0 rounded-[18px] p-4 border border-black/5 space-y-4">
                        {/* STATUS */}
                        <div className={`p-3 rounded-[16px] border flex items-center gap-3 ${waConectado? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${waConectado? 'bg-green-500 text-white' : 'bg-orange-400 text-white'}`}>
                                {waConectado? <Wifi size={18}/> : <WifiOff size={18}/>}
                            </div>
                            <div className="flex-1">
                                <p className={`text-[11px] font-black ${waConectado? 'text-green-700' : 'text-orange-700'}`}>{waConectado? 'WhatsApp Conectado' : 'WhatsApp Desconectado'}</p>
                                <p className="text-[10px] text-zinc-600 font-bold truncate">{waInstance || `empresa_${(form.id||'').slice(0,8)}`} • Envia para: {form.phone || 'sem número'}</p>
                            </div>
                            <button onClick={checkStatus} className="w-8 h-8 bg-white rounded-full flex items-center justify-center border hover:bg-zinc-50"><RefreshCw size={14}/></button>
                        </div>

                        {!waConectado? (
                        <>
                            <div className="text-center space-y-3">
                                <p className="text-[11px] font-bold text-zinc-600">Escaneia o QR Code com o WhatsApp do dono para receber fechamento de caixa automático.</p>
                                {waQr? (
                                    <div className="bg-white p-3 rounded-[16px] border border-black/10 inline-block">
                                        <img src={waQr} alt="QR WhatsApp" className="w-[220px] h-[220px] object-contain" />
                                        <p className="text-[8px] font-black tracking-widest text-zinc-400 mt-2">EXPIRA EM 40 SEGUNDOS</p>
                                    </div>
                                ) : (
                                    <div className="w-[220px] h-[220px] bg-[#F5F2ED] border border-dashed border-black/10 rounded-[16px] mx-auto flex flex-col items-center justify-center gap-2">
                                        <QrCode size={32} className="text-zinc-400"/>
                                        <p className="text-[10px] font-bold text-zinc-400">Nenhum QR gerado</p>
                                    </div>
                                )}
                                <button onClick={gerarQr} disabled={waLoading} className="w-full h-11 bg-black text-white rounded-full text-[11px] font-black flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50">
                                    {waLoading? <><Loader2 size={14} className="animate-spin"/> Gerando QR...</> : <><QrCode size={14}/> Gerar QR Code</>}
                                </button>
                                <p className="text-[9px] text-zinc-400 font-bold">1. Abre WhatsApp &gt; Aparelhos conectados<br/>2. Conectar aparelho<br/>3. Escaneia este QR</p>
                            </div>
                        </>
                        ) : (
                        <div className="text-center space-y-3">
                            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                                <Check size={32} className="text-green-600"/>
                            </div>
                            <p className="text-[12px] font-black">Tudo pronto!</p>
                            <p className="text-[11px] font-bold text-zinc-600">Mensagens de abertura e fechamento de caixa serão enviadas automaticamente para <b>{form.phone}</b> via instância <b>{waInstance}</b>.</p>
                            <button onClick={gerarQr} className="w-full h-11 bg-white border border-black/10 rounded-full text-[11px] font-black hover:bg-zinc-50">Reconectar / Trocar aparelho</button>
                        </div>
                        )}
                    </div>
                    )}
                </div>

                {/* FOOTER */}
                <div className="shrink-0 bg-[#EDEBE6] p-[6px] pt-2 border-t border-black/5">
                    <div className="bg-white rounded-[18px] border border-black/5 p-2 flex gap-2">
                        <button type="button" onClick={onClose} className="flex-1 bg-white border border-black/10 rounded-full py-3 text-[11px] font-bold hover:bg-zinc-50 active:scale-[0.98] transition-all">Cancelar</button>
                        {tab==="geral" && (
                        <button onClick={() => onSave({...form, logoFile})} disabled={saving} className="flex-1 bg-black text-white rounded-full py-3 text-[11px] font-black disabled:opacity-50 hover:bg-zinc-800 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5">
                            {saving? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={12} /> Salvar</>}
                        </button>
                        )}
                        {tab==="whatsapp" && (
                        <button onClick={onClose} className="flex-1 bg-black text-white rounded-full py-3 text-[11px] font-black hover:bg-zinc-800">Fechar</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

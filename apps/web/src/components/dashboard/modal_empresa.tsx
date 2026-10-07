"use client";
import { useEffect, useState, useRef } from 'react'
import { X, Check, Building2, ChevronDown, Upload, Landmark, MapPin } from 'lucide-react'

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

interface EmpresaForm { companyName: string; nif: string; email: string; phone: string; address: string; city: string; province: string; iban?: string; iban2?: string; banco1?: string; banco2?: string; logo_url?: string; image_url?: string; id?: string; nome_fantasia?: string }
interface Props { open: boolean; initialData: EmpresaForm; saving: boolean; onClose: () => void; onSave: (data: EmpresaForm & { logoFile?: File | null }) => void }

function CustomSelect({ value, options, onChange, placeholder, disabled, icon: Icon }: any) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
    const selected = options.find((o:any) => o.value === value)
    return (
        <div ref={ref} className="relative w-full">
            <button type="button" disabled={disabled} onClick={() =>!disabled && setOpen(!open)} className={`w-full h-[44px] bg-[#F5F2ED] border border-black/5 rounded-full px-4 text-[13px] text-black flex items-center justify-between focus:outline-none focus:border-black transition ${disabled? 'opacity-50 cursor-not-allowed' : ''}`}>
                <span className="flex items-center gap-2 truncate">{Icon && <Icon className="w-4 h-4 text-zinc-500 shrink-0" />}<span className={selected? 'text-black font-bold' : 'text-black/40'}>{selected? selected.label : placeholder}</span></span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${open? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="absolute z-50 top-[48px] left-0 w-full bg-white rounded-[18px] shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-black/10 overflow-hidden p-1.5 max-h-[220px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{options.map((o:any) => (<button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false) }} className={`w-full text-left px-3 py-2.5 rounded-full text-[12px] flex items-center justify-between transition ${value === o.value? 'bg-black text-white font-bold' : 'hover:bg-[#F5F2ED] text-zinc-700'}`}>{o.label}</button>))}</div>}
        </div>
    )
}

function BancoSelect({ value, onChange, placeholder }: any) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
    return (
        <div ref={ref} className="relative w-full">
            <button type="button" onClick={() => setOpen(!open)} className="w-full h-[44px] bg-[#F5F2ED] border border-black/5 rounded-full px-4 text-[13px] text-black flex items-center justify-between focus:outline-none focus:border-black">
                <span className="flex items-center gap-2 truncate"><Landmark className="w-4 h-4 text-zinc-500 shrink-0" /><span className={value? 'text-black font-bold' : 'text-black/40'}>{value || placeholder}</span></span>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${open? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="absolute z-50 top-[48px] left-0 w-full bg-white rounded-[18px] shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-black/10 overflow-hidden p-1.5 max-h-[220px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{BANCOS_ANGOLA.map(b => (<button key={b} type="button" onClick={() => { onChange(b); setOpen(false) }} className={`w-full text-left px-3 py-2.5 rounded-full text-[11px] transition ${value === b? 'bg-black text-white font-bold' : 'hover:bg-[#F5F2ED] text-zinc-700'}`}>{b}</button>))}<button type="button" onClick={() => { onChange(undefined); setOpen(false) }} className="w-full text-left px-3 py-2.5 rounded-full text-[11px] text-red-500 hover:bg-red-50">Limpar</button></div>}
        </div>
    )
}

export default function ModalEmpresa({ open, initialData, saving, onClose, onSave }: Props) {
    const [form, setForm] = useState<EmpresaForm>(initialData)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)

    useEffect(() => { if (open) { setForm(initialData); setLogoFile(null); setLogoPreview(initialData.logo_url || initialData.image_url || null) } }, [initialData, open])
    if (!open) return null

    const inputClass = "w-full h-[44px] bg-[#F5F2ED] border border-black/5 rounded-full px-4 text-[13px] text-black placeholder:text-black/40 focus:outline-none focus:border-black focus:bg-white transition"
    const municipiosDisponiveis = form.province? (MUNICIPIOS[form.province] || []) : []
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) { if (logoPreview && logoFile) URL.revokeObjectURL(logoPreview); setLogoFile(file); setLogoPreview(URL.createObjectURL(file)) }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[3px]" />
            <div className="relative w-full max-w-[520px] bg-[#EDEBE6] border border-black/10 rounded-[24px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] overflow-hidden flex flex-col max-h-[92dvh]">
                <div className="bg-white m-[6px] rounded-[18px] p-3 flex justify-between items-start border border-black/5 shrink-0">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center"><Building2 size={14} /></div>
                        <div>
                            <p className="font-black text-[13px] leading-none text-black">CONFIGURAR EMPRESA</p>
                            <p className="text-[11px] text-zinc-600 mt-1 font-bold truncate max-w-[220px]">{form.companyName || form.nome_fantasia || "Minha empresa"} • EDITÁVEL</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center hover:bg-zinc-200 active:scale-95"><X size={14} /></button>
                </div>
                <div className="bg-white m-[6px] mt-0 rounded-[18px] border border-black/5 overflow-hidden flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden p-3 space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-[#F5F2ED] border border-black/5 rounded-[16px]">
                            <div className="w-14 h-14 rounded-[12px] bg-white border border-black/5 flex items-center justify-center overflow-hidden shrink-0">
                                {logoPreview? <img src={logoPreview} className="w-full h-full object-cover" /> : <Upload className="w-5 h-5 text-zinc-400" />}
                            </div>
                            <div className="flex-1"><p className="text-[12px] font-black text-black">Logotipo</p><p className="text-[10px] text-zinc-500 font-bold">PNG, JPG até 2MB • Cloudinary</p></div>
                            <label className="h-9 px-4 rounded-full bg-black text-white text-[11px] font-black flex items-center justify-center cursor-pointer active:scale-95 hover:bg-zinc-800">Escolher<input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} /></label>
                        </div>
                        <input value={form.companyName || form.nome_fantasia || ''} onChange={e => setForm({...form, companyName: e.target.value, nome_fantasia: e.target.value})} placeholder="Nome da empresa" className={inputClass} />
                        <input value={form.nif || ''} onChange={e => setForm({...form, nif: e.target.value})} placeholder="NIF da empresa" className={inputClass} />
                        <div className="grid grid-cols-2 gap-2">
                            <input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value})} placeholder="Telefone" className={inputClass} />
                            <input value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className={inputClass} />
                        </div>
                        <input value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} placeholder="Endereço completo" className={inputClass} />
                        <div className="grid grid-cols-2 gap-2">
                            <CustomSelect value={form.province || ''} onChange={(v:string) => setForm(prev => ({...prev, province: v, city: ''}))} placeholder="Província" options={PROVINCIAS.map(p => ({ value: p, label: p }))} icon={MapPin} />
                            <CustomSelect value={form.city || ''} onChange={(v:string) => setForm({...form, city: v})} placeholder={form.province? "Município" : "Selecione província"} options={municipiosDisponiveis.map(m => ({ value: m, label: m }))} disabled={!form.province} icon={MapPin} />
                        </div>
                        <div className="h-[1px] bg-black/10 border-dashed border-t my-1" />
                        <p className="text-[10px] tracking-widest text-zinc-500 font-black px-1">DADOS BANCÁRIOS</p>
                        <div className="space-y-2"><BancoSelect value={form.banco1} onChange={(v:any) => setForm({...form, banco1: v})} placeholder="Banco 1" />{form.banco1 && <input value={form.iban || ''} onChange={e => setForm({...form, iban: e.target.value})} placeholder={`IBAN - ${form.banco1.split('-')[0].trim()}`} className={inputClass} />}</div>
                        <div className="space-y-2"><BancoSelect value={form.banco2} onChange={(v:any) => setForm({...form, banco2: v})} placeholder="Banco 2 (opcional)" />{form.banco2 && <input value={form.iban2 || ''} onChange={e => setForm({...form, iban2: e.target.value})} placeholder={`IBAN - ${form.banco2.split('-')[0].trim()}`} className={inputClass} />}</div>
                    </div>
                    <div className="shrink-0 p-3 border-t bg-white mt-auto">
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} className="flex-1 bg-white border border-black/10 rounded-full py-3.5 text-[12px] font-bold active:scale-[0.97]">Fechar</button>
                            <button onClick={() => onSave({...form, logoFile})} disabled={saving} className="flex-1 bg-black text-white rounded-full py-3.5 text-[12px] font-black flex items-center justify-center gap-2 active:scale-[0.97] hover:bg-zinc-800 disabled:opacity-50">
                                {saving? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Check size={14} /> Salvar</>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

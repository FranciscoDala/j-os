"use client";
import { useEffect, useState, useRef, useMemo } from 'react'
import { X, Check, Building2, ChevronDown, Upload, Landmark, MapPin, Lock } from 'lucide-react'

const CARGOS_PERMISSOES: Record<string, string[]> = {
    admin: ["*"], dono: ["*"], gerente_restaurante: ["*"],
    financeira: [], recepcao: [], rh: []
}
function temPermissao(cargo: string, perm: string) {
    if (["admin","dono","gerente_restaurante"].includes(cargo)) return true
    const perms = CARGOS_PERMISSOES[cargo] || []
    return perms.includes(perm) || perms.includes("*")
}
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

function CustomSelect({ value, options, onChange, placeholder, disabled, icon: Icon }: { value: string, options: { value: string, label: string }[], onChange: (v: string) => void, placeholder: string, disabled?: boolean, icon?: any }) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
    const selected = options.find(o => o.value === value)
    return (
        <div ref={ref} className="relative w-full">
            <button type="button" disabled={disabled} onClick={() =>!disabled && setOpen(!open)} className={`w-full h-[44px] bg-white border border-gray-200 rounded-[12px] px-3 text-[13.5px] text-black flex items-center justify-between focus:outline-none focus:border-[#0095ff] transition ${disabled? 'opacity-60 bg-gray-50 cursor-not-allowed' : ''}`}>
                <span className="flex items-center gap-2 truncate">{Icon && <Icon className="w-4 h-4 text-gray-500 shrink-0" />}<span className={selected? 'text-black' : 'text-black/40'}>{selected? selected.label : placeholder}</span></span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="absolute z-50 top-[48px] left-0 w-full bg-white rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden p-1.5 max-h-[220px] overflow-y-auto no-scrollbar">{options.map(o => (<button key={o.value} type="button" onClick={() => { onChange(o.value); setOpen(false) }} className={`w-full text-left px-3 py-2.5 rounded-[10px] text-[13px] flex items-center justify-between transition ${value === o.value? 'bg-[#E6F0FF] font-semibold text-black' : 'hover:bg-gray-50 text-gray-700'}`}>{o.label} {value === o.value && <Check className="w-4 h-4 text-[#0095ff]" />}</button>))}</div>}
        </div>
    )
}
function BancoSelect({ value, onChange, placeholder, disabled }: { value?: string, onChange: (v: string | undefined) => void, placeholder: string, disabled?: boolean }) {
    const [open, setOpen] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => { const h = (e: MouseEvent) => { if (ref.current &&!ref.current.contains(e.target as Node)) setOpen(false) }; document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h) }, [])
    return (
        <div ref={ref} className="relative w-full">
            <button type="button" disabled={disabled} onClick={() =>!disabled && setOpen(!open)} className={`w-full h-[44px] bg-white border border-gray-200 rounded-[12px] px-3 text-[13.5px] text-black flex items-center justify-between focus:outline-none focus:border-[#0095ff] transition ${disabled? 'opacity-60 cursor-not-allowed' : ''}`}>
                <span className="flex items-center gap-2 truncate"><Landmark className="w-4 h-4 text-gray-500 shrink-0" /><span className={value? 'text-black' : 'text-black/40'}>{value || placeholder}</span></span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open? 'rotate-180' : ''}`} />
            </button>
            {open &&!disabled && <div className="absolute z-50 top-[48px] left-0 w-full bg-white rounded-[16px] shadow-[0_12px_40px_rgba(0,0,0,0.15)] border border-gray-100 overflow-hidden p-1.5 max-h-[220px] overflow-y-auto no-scrollbar">{BANCOS_ANGOLA.map(b => (<button key={b} type="button" onClick={() => { onChange(b); setOpen(false) }} className={`w-full text-left px-3 py-2.5 rounded-[10px] text-[12.5px] flex items-center justify-between transition ${value === b? 'bg-[#E6F0FF] font-semibold text-black' : 'hover:bg-gray-50 text-gray-700'}`}>{b} {value === b && <Check className="w-4 h-4 text-[#0095ff]" />}</button>))}<button type="button" onClick={() => { onChange(undefined); setOpen(false) }} className="w-full text-left px-3 py-2.5 rounded-[10px] text-[12.5px] text-red-500 hover:bg-red-50">Limpar seleção</button></div>}
        </div>
    )
}

export default function ModalEmpresa({ open, initialData, saving, onClose, onSave }: Props) {
    const [form, setForm] = useState<EmpresaForm>(initialData)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)
    const funcionarioLogado = useMemo(() => { try { const u = JSON.parse(localStorage.getItem("user") || "{}"); return u } catch { return null } }, [])
    const cargoAtual = (funcionarioLogado?.role || funcionarioLogado?.role_equivalente || 'admin')?.toLowerCase() || 'admin'
    const podeEditar = funcionarioLogado? ["admin","dono","gerente_restaurante"].includes(cargoAtual) || temPermissao(cargoAtual, 'editar_empresa') : true

    useEffect(() => { if (open) { setForm(initialData); setLogoFile(null); setLogoPreview(initialData.logo_url || initialData.image_url || null) } }, [initialData, open])
    useEffect(() => { return () => { if (logoPreview && logoFile) URL.revokeObjectURL(logoPreview) } }, [logoPreview, logoFile])
    if (!open) return null
    if (!podeEditar) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4"><div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}/><div className="relative bg-white rounded-[24px] p-8 text-center max-w-[360px] w-full"><Lock className="w-8 h-8 mx-auto text-gray-300 mb-2"/><p className="font-bold">Sem permissão</p><p className="text-[13px] text-gray-500 mt-1">Cargo <b>{cargoAtual.toUpperCase()}</b> não pode editar empresa</p><button onClick={onClose} className="mt-4 w-full h-11 bg-black text-white rounded-full">Fechar</button></div></div>
        )
    }
    const inputClass = "w-full h-[44px] bg-white border border-gray-200 rounded-[12px] px-3 text-[13.5px] text-black placeholder:text-black/40 focus:outline-none focus:border-[#0095ff] focus:ring-1 focus:ring-[#0095ff]/20 transition"
    const municipiosDisponiveis = form.province? (MUNICIPIOS[form.province] || []) : []
    const handleProvinceChange = (prov: string) => { setForm(prev => ({...prev, province: prov, city: '' })) }
    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { if (logoPreview && logoFile) URL.revokeObjectURL(logoPreview); setLogoFile(file); setLogoPreview(URL.createObjectURL(file)) } }
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!podeEditar) return; onSave({...form, logoFile }) }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-[24px] w-full max-w-[560px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.25)] max-h-[92vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="relative h-[72px] px-5 pt-5 flex justify-between items-start bg-[#E6F0FF] shrink-0">
                    <div className="w-9 h-9 rounded-full bg-white border shadow-sm flex items-center justify-center"><Building2 className="w-4 h-4 text-[#0095ff]" /></div>
                    <span className="text-[10px] bg-black text-white px-3 py-1 rounded-full font-bold">{cargoAtual.toUpperCase()} • ADMIN</span>
                    <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border shadow-sm flex items-center justify-center hover:bg-gray-50"><X className="w-4 h-4 text-gray-500" /></button>
                </div>
                <div className="px-6 pt-5 pb-3 shrink-0 border-b border-gray-100">
                    <h3 className="text-[18px] font-bold text-gray-900 leading-tight">Editar Empresa</h3>
                    <p className="text-[13.5px] text-gray-500 mt-1">Atualize logo, contacto e dados bancários • só ADMIN</p>
                    <div className="mt-3 flex gap-2">
                        <div className="flex-1 h-11 px-4 rounded-[12px] bg-gray-100 border border-gray-200 flex items-center text-[12px] text-gray-500">🏢 {form.companyName || form.nome_fantasia} <Lock className="w-3 h-3 ml-auto" /></div>
                        <div className="w-[140px] h-11 px-3 rounded-[12px] bg-gray-100 border border-gray-200 flex items-center text-[12px] text-gray-500">{form.nif} <Lock className="w-3 h-3 ml-auto" /></div>
                    </div>
                </div>
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-6 py-4">
                        <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
                        <input type="hidden" value={form.companyName} readOnly /><input type="hidden" value={form.nif} readOnly />
                        <div className="flex flex-col gap-[2px]">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100 rounded-[16px] mb-2">
                                <div className="w-14 h-14 rounded-[12px] bg-white border flex items-center justify-center overflow-hidden shrink-0">{logoPreview? <img src={logoPreview} className="w-full h-full object-cover" /> : <Upload className="w-5 h-5 text-gray-400" />}</div>
                                <div className="flex-1"><p className="text-[12px] font-bold text-gray-900">Logotipo da empresa</p><p className="text-[11px] text-gray-500">PNG, JPG até 2MB. Vai pro Cloudinary</p></div>
                                <label className="h-9 px-4 rounded-full bg-black text-white text-[12px] font-semibold flex items-center justify-center cursor-pointer hover:bg-gray-800">Escolher<input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} /></label>
                            </div>
                            <input value={form.phone || ''} onChange={e => setForm({...form, phone: e.target.value })} placeholder="Telefone" className={inputClass} />
                            <input value={form.email || ''} type="email" onChange={e => setForm({...form, email: e.target.value })} placeholder="Email" className={inputClass} />
                            <input value={form.address || ''} onChange={e => setForm({...form, address: e.target.value })} placeholder="Endereço" className={inputClass} />
                            <div className="grid grid-cols-2 gap-[2px]">
                                <CustomSelect value={form.province || ''} onChange={handleProvinceChange} placeholder="Província" options={PROVINCIAS.map(p => ({ value: p, label: p }))} icon={MapPin} />
                                <CustomSelect value={form.city || ''} onChange={(v) => setForm({...form, city: v })} placeholder={form.province? "Município" : "Selecione província"} options={municipiosDisponiveis.map(m => ({ value: m, label: m }))} disabled={!form.province} icon={MapPin} />
                            </div>
                            <div className="h-[1px] bg-gray-100 my-3" /><p className="text-[11px] font-bold tracking-widest text-black mb-2">DADOS BANCÁRIOS • ADMIN</p>
                            <div className="flex flex-col gap-[2px]"><BancoSelect value={form.banco1} onChange={(v) => setForm({...form, banco1: v, iban: v? form.iban : '' })} placeholder="Selecionar banco 1" />{form.banco1 && <input value={form.iban || ''} onChange={e => setForm({...form, iban: e.target.value })} placeholder={`IBAN - ${form.banco1.split('-')[0].trim()}`} className={inputClass} />}</div>
                            <div className="flex flex-col gap-[2px] mt-[2px]"><BancoSelect value={form.banco2} onChange={(v) => setForm({...form, banco2: v, iban2: v? form.iban2 : '' })} placeholder="Selecionar banco 2 (opcional)" />{form.banco2 && <input value={form.iban2 || ''} onChange={e => setForm({...form, iban2: e.target.value })} placeholder={`IBAN - ${form.banco2.split('-')[0].trim()}`} className={inputClass} />}</div>
                        </div>
                    </div>
                    <div className="shrink-0 px-6 py-4 border-t border-gray-100 bg-white flex gap-[2px]">
                        <button type="button" onClick={onClose} className="flex-1 h-11 rounded-full border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50"><X className="w-5 h-5 text-gray-600" /></button>
                        <button type="submit" disabled={saving} className="flex-1 h-11 rounded-full bg-[#0095ff] text-white font-semibold hover:bg-[#0085e6] shadow-[0_6px_20px_rgba(0,149,255,0.35)] flex items-center justify-center disabled:opacity-50">{saving? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-5 h-5" />}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

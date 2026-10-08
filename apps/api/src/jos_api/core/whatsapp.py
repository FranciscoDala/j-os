import os
import logging
import httpx
from decimal import Decimal
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)
TZ_LUANDA = ZoneInfo("Africa/Luanda")

# JÁ DEIXA FIXO COM A QUE SUBIMOS
EVOLUTION_URL = os.getenv("EVOLUTION_API_URL", "https://evolution-api-v2-2-3-2uk4.onrender.com")
EVOLUTION_KEY = os.getenv("EVOLUTION_API_KEY", "j-os-super-secret-key-2026")
EVOLUTION_INSTANCE = os.getenv("EVOLUTION_INSTANCE", "jos") # fallback
META_PHONE_ID = os.getenv("WHATSAPP_PHONE_ID", "")
META_TOKEN = os.getenv("WHATSAPP_TOKEN", "")

def format_kz(v):
    try:
        return f"{float(v):,.2f} Kz".replace(",", "X").replace(".", ",").replace("X", ".")
    except:
        return f"{v} Kz"

def _get_instance_name(empresa_id: str | None = None):
    # Se tiver empresa_id, cria instancia por empresa: empresa_91c8c71e
    if empresa_id:
        return f"empresa_{str(empresa_id)[:8]}"
    return EVOLUTION_INSTANCE

def _send_via_meta(numero: str, texto: str):
    # ... teu código da Meta continua igual
    print(f"[META] Tentando enviar para {numero} PHONE_ID={META_PHONE_ID[:6]}... TOKEN exists={bool(META_TOKEN)}")
    if not META_TOKEN or not META_PHONE_ID or not numero:
        print(f"[META] FALTA config TOKEN={bool(META_TOKEN)} PHONE_ID={bool(META_PHONE_ID)} numero={numero}")
        return False
    try:
        url = f"https://graph.facebook.com/v25.0/{META_PHONE_ID}/messages"
        headers = {"Authorization": f"Bearer {META_TOKEN}", "Content-Type": "application/json"}
        payload = {"messaging_product": "whatsapp","to": numero,"type": "text","text": {"body": texto}}
        with httpx.Client(timeout=15) as client:
            r = client.post(url, json=payload, headers=headers)
            print(f"[META] Resposta 1: {r.status_code} {r.text[:500]}")
            if r.status_code in [200,201]:
                return True
            payload_t = {"messaging_product": "whatsapp","to": numero,"type": "template","template": {"name": "hello_world","language": {"code": "en_US"}}}
            rt = client.post(url, json=payload_t, headers=headers)
            print(f"[META] Template resp: {rt.status_code} {rt.text[:500]}")
            r2 = client.post(url, json=payload, headers=headers)
            return r2.status_code in [200,201]
    except Exception as e:
        print(f"[META] Falha exception {e}")
        logger.error(f"[META] Falha {e}", exc_info=True)
        return False

def _send_text(numero: str, texto: str, empresa_id: str | None = None):
    if not numero:
        print("[WA] _send_text numero vazio")
        return False
    # limpa numero: teu app salva 940799954, Evolution precisa 244940799954
    numero_limpo = str(numero).replace("+","").replace(" ","")
    if not numero_limpo.startswith("244"):
        numero_limpo = f"244{numero_limpo.lstrip('0')}"

    instance = _get_instance_name(empresa_id)

    if EVOLUTION_URL:
        try:
            url = f"{EVOLUTION_URL.rstrip('/')}/message/sendText/{instance}"
            headers = {"apikey": EVOLUTION_KEY, "Content-Type": "application/json"}
            payload = {"number": numero_limpo, "text": texto, "options": {"delay": 500, "presence": "composing"}}
            with httpx.Client(timeout=10) as client:
                r = client.post(url, json=payload, headers=headers)
                print(f"[EVOLUTION] {instance} -> {numero_limpo} resp {r.status_code} {r.text[:300]}")
                if r.status_code in [200,201]:
                    return True
        except Exception as e:
            print(f"[EVOLUTION] erro {e}")

    return _send_via_meta(numero_limpo, texto)

# ATUALIZA ESSAS 2 FUNÇÕES PARA RECEBER empresa_id
def enviar_abertura_caixa(numero: str, aberto_por_nome: str, saldo_inicial: Decimal, aberto_em: datetime | None, empresa_id: str | None = None):
    try:
        if aberto_em is None:
            aberto_em = datetime.now(timezone.utc)
        hora = aberto_em.astimezone(TZ_LUANDA).strftime("%H:%M")
        data = aberto_em.astimezone(TZ_LUANDA).strftime("%d/%m/%Y")
        msg = f"🔓 *CAIXA ABERTO*\n\n👤 {aberto_por_nome}\n⏰ {hora} - {data}\n💰 Saldo inicial: {format_kz(saldo_inicial)}"
        print(f"[WA] enviar_abertura para {numero} empresa={empresa_id}")
        _send_text(numero, msg, empresa_id)
    except Exception as e:
        print(f"[WA] Erro abertura {e}")

def enviar_fechamento_caixa(numero: str, dados: dict, empresa_id: str | None = None):
    try:
        print(f"[WA] enviar_fechamento para {numero} empresa={empresa_id} dados={dados}")
        msg = f"""💰 *CAIXA FECHADO* - {dados.get('aberto_por_nome','')}
{dados.get('aberto','--:--')} - {dados.get('fechado','--:--')}{dados.get('duracao','')}

📈 Entradas: {format_kz(dados.get('total_ent',0))} ({dados.get('qtd_vendas',0)} vendas)
📉 Saídas: {format_kz(dados.get('total_sai',0))}
💵 Saldo a entregar: {format_kz(dados.get('saldo_entregar',0))}
{dados.get('status_div','✅')} Divergência: {format_kz(dados.get('divergencia',0))}

📦 Caixas hoje: {dados.get('qtd_hoje',1)}
👤 Fechado por: {dados.get('fechado_por_nome','')}"""
        ok = _send_text(numero, msg, empresa_id)
        print(f"[WA] resultado envio fechamento ok={ok}")
        if dados.get('resumo_dia'):
            _send_text(numero, dados['resumo_dia'], empresa_id)
    except Exception as e:
        print(f"[WA] Erro fechamento {e}")
        logger.error(f"Erro whatsapp fechamento: {e}", exc_info=True)

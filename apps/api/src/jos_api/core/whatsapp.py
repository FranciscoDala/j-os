import os
import logging
import httpx
from decimal import Decimal
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)
TZ_LUANDA = ZoneInfo("Africa/Luanda")

EVOLUTION_URL = os.getenv("EVOLUTION_API_URL", "")
EVOLUTION_KEY = os.getenv("EVOLUTION_API_KEY", "")
EVOLUTION_INSTANCE = os.getenv("EVOLUTION_INSTANCE", "jos")

META_PHONE_ID = os.getenv("WHATSAPP_PHONE_ID", "")
META_TOKEN = os.getenv("WHATSAPP_TOKEN", "")
WHATSAPP_FALLBACK = os.getenv("WHATSAPP_DONO_NUMERO", "")

def format_kz(v):
    try:
        return f"{float(v):,.2f} Kz".replace(",", "X").replace(".", ",").replace("X", ".")
    except:
        return f"{v} Kz"

def _send_via_meta(numero: str, texto: str):
    if not META_TOKEN or not META_PHONE_ID or not numero:
        return False
    try:
        url = f"https://graph.facebook.com/v25.0/{META_PHONE_ID}/messages"
        headers = {"Authorization": f"Bearer {META_TOKEN}", "Content-Type": "application/json"}
        payload = {"messaging_product": "whatsapp","to": numero,"type": "text","text": {"body": texto}}
        with httpx.Client(timeout=15) as client:
            r = client.post(url, json=payload, headers=headers)
            if r.status_code in [200,201]:
                logger.info(f"[META] Enviado {numero}")
                return True
            payload_t = {"messaging_product": "whatsapp","to": numero,"type": "template","template": {"name": "hello_world","language": {"code": "en_US"}}}
            client.post(url, json=payload_t, headers=headers)
            r2 = client.post(url, json=payload, headers=headers)
            return r2.status_code in [200,201]
    except Exception as e:
        logger.error(f"[META] Falha {e}")
        return False

def _send_text(numero: str, texto: str):
    if not numero: return False
    if EVOLUTION_URL:
        try:
            url = f"{EVOLUTION_URL.rstrip('/')}/message/sendText/{EVOLUTION_INSTANCE}"
            headers = {"apikey": EVOLUTION_KEY, "Content-Type": "application/json"}
            payload = {"number": numero, "text": texto, "options": {"delay": 500, "presence": "composing"}}
            with httpx.Client(timeout=10) as client:
                r = client.post(url, json=payload, headers=headers)
                if r.status_code in [200,201]:
                    return True
        except Exception as e:
            logger.error(f"[EVOLUTION] {e}")
    return _send_via_meta(numero, texto)

def enviar_abertura_caixa(numero: str, aberto_por_nome: str, saldo_inicial: Decimal, aberto_em: datetime | None):
    try:
        if aberto_em is None:
            aberto_em = datetime.now(timezone.utc)
        hora = aberto_em.astimezone(TZ_LUANDA).strftime("%H:%M")
        data = aberto_em.astimezone(TZ_LUANDA).strftime("%d/%m/%Y")
        msg = f"🔓 *CAIXA ABERTO*\n\n👤 {aberto_por_nome}\n⏰ {hora} - {data}\n💰 Saldo inicial: {format_kz(saldo_inicial)}"
        _send_text(numero, msg)
    except Exception as e:
        logger.error(f"Erro whatsapp abertura: {e}")

def enviar_fechamento_caixa(numero: str, dados: dict):
    try:
        msg = f"""💰 *CAIXA FECHADO* - {dados.get('aberto_por_nome','')}
{dados.get('aberto','--:--')} - {dados.get('fechado','--:--')}{dados.get('duracao','')}

📈 Entradas: {format_kz(dados.get('total_ent',0))} ({dados.get('qtd_vendas',0)} vendas)
📉 Saídas: {format_kz(dados.get('total_sai',0))}
💵 Saldo a entregar: {format_kz(dados.get('saldo_entregar',0))}
{dados.get('status_div','✅')} Divergência: {format_kz(dados.get('divergencia',0))}

📦 Caixas hoje: {dados.get('qtd_hoje',1)}
👤 Fechado por: {dados.get('fechado_por_nome','')}"""
        _send_text(numero, msg)
        if dados.get('resumo_dia'):
            _send_text(numero, dados['resumo_dia'])
    except Exception as e:
        logger.error(f"Erro whatsapp fechamento: {e}", exc_info=True)

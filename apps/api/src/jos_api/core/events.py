import asyncio
import logging

logger = logging.getLogger(__name__)

def emit(empresa_id: str, type_name: str, data=None, **extra):
    try:
        from jos_api.core.realtime import manager
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            # sem loop (tarefa sync) - ignora
            return
        if not loop.is_running():
            return

        payload = {"type": type_name, "data": data}
        payload.update(extra)

        # log pra ver no Render se tá emitindo
        print(f"[EMIT] empresa={empresa_id} type={type_name} data_id={str(data.get('id') if isinstance(data, dict) else '')[:8]}")

        loop.create_task(manager.broadcast(str(empresa_id) if empresa_id else None, payload))
    except Exception as e:
        print(f"[EMIT ERRO] {e}")
        logger.exception("emit failed")

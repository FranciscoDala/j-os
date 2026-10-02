import asyncio

def emit(empresa_id: str, type_name: str, data=None, **extra):
    try:
        from jos_api.core.realtime import manager
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            return
        if not loop.is_running():
            return
        payload = {"type": type_name, "data": data}
        payload.update(extra)
        loop.create_task(manager.broadcast(empresa_id, payload))
    except:
        pass

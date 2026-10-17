FROM python:3.11-slim

WORKDIR /app

# Cria usuário não-root para não rodar como root
RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cria pasta de certs se não existir e protege a chave privada
RUN mkdir -p /app/certs /app/apps/api/certs && \
    if [ -f /app/certs/agt_privada.pem ]; then chmod 600 /app/certs/agt_privada.pem && chown appuser:appuser /app/certs/agt_privada.pem; fi && \
    if [ -f /app/apps/api/certs/agt_privada.pem ]; then chmod 600 /app/apps/api/certs/agt_privada.pem && chown appuser:appuser /app/apps/api/certs/agt_privada.pem; fi && \
    chown -R appuser:appuser /app

ENV PYTHONPATH=/app/src:/app
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Troca para usuário não-root
USER appuser

CMD ["uvicorn", "src.jos_api.main:app", "--host", "0.0.0.0", "--port", "10000", "--log-level", "info"]

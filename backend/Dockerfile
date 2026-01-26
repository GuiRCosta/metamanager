FROM python:3.11-slim

WORKDIR /app

# Instalar curl para healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copiar e instalar dependências
COPY requirements.txt .
# Instalar openai primeiro (agno verifica na importação)
RUN pip install --no-cache-dir openai==1.50.0 && \
    pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Criar diretório para dados persistentes
RUN mkdir -p /app/data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

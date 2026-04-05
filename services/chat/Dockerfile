FROM python:3.14-slim AS builder

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY chat/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.14-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends libpq5 && \
    rm -rf /var/lib/apt/lists/*

RUN useradd --create-home appuser

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
COPY shared/ /app/shared/
COPY chat/ /app/
COPY chat/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8002

ENTRYPOINT ["/entrypoint.sh"]

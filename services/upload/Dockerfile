FROM python:3.14-slim AS builder

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY upload/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.14-slim

RUN useradd --create-home appuser

COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
COPY shared/ /app/shared/
COPY upload/ /app/
RUN chown -R appuser:appuser /app

USER appuser

EXPOSE 8003

ENTRYPOINT ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003", "--no-access-log"]

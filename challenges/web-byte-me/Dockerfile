FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN useradd -m -u 10001 appuser \
 && mkdir -p /app/files \
 && chown -R appuser:appuser /app

COPY src/requirements.txt .
RUN pip install -r requirements.txt
COPY src/ .

USER appuser
EXPOSE 5000

CMD ["python", "app.py"]

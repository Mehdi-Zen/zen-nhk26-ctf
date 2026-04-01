FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY src/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/app.py .
COPY src/data ./data

ENV PYTHONUNBUFFERED=1
ENV TIMEOUT_MIN=4
ENV TIMEOUT_MAX=6
ENV MAX_ACTIVE_CHALLENGES=2000
ENV FLAG_PATH=/app/data/flag.txt

EXPOSE 5000

CMD ["gunicorn", "-b", "0.0.0.0:5000", "--workers", "1", "--threads", "4", "app:app"]


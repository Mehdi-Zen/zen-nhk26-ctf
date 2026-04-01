FROM python:3.10-slim

# Création utilisateur non-root
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app /var/log/grace_hopper && \
    chown appuser:appuser /app /var/log/grace_hopper && \
    chmod 755 /var/log/grace_hopper

WORKDIR /app

# Dépendances depuis src/
COPY src/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && rm -f requirements.txt

# Application + templates depuis src/
COPY --chown=appuser:appuser src/app.py .
COPY --chown=appuser:appuser src/templates/ templates/

RUN chmod 500 app.py

# Flag depuis src/
COPY src/flag.txt /flag.txt
RUN chmod 444 /flag.txt && chown root:root /flag.txt

# Script de log (point d'injection) – créé dynamiquement
RUN mkdir -p /tmp/logs && \
    echo '#!/bin/bash' > /tmp/logs/log.sh && \
    chmod 777 /tmp/logs/log.sh && \
    chown appuser:appuser /tmp/logs && \
    chmod 777 /tmp/logs && \
    touch /var/log/grace_hopper/visitors.log && \
    chmod 666 /var/log/grace_hopper/visitors.log && \
    chown appuser:appuser /var/log/grace_hopper/visitors.log

USER appuser

EXPOSE 80

CMD ["python", "app.py"]

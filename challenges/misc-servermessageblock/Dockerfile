FROM python:3.11-slim-bookworm

# Utilisateur non-root
RUN groupadd -r smbuser && \
    useradd -r -g smbuser -m -d /home/smbuser -s /bin/bash smbuser && \
    chown -R smbuser:smbuser /home/smbuser

# Paquets utiles pour le shell + décodage hexa
RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y \
    netcat-openbsd \
    vim-common \
    && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

# Copie directe de toute l'arborescence fake Windows
# → les répertoires sont créés automatiquement
COPY --chown=smbuser:smbuser src/C /C

# Serveur
WORKDIR /app
COPY --chown=smbuser:smbuser src/server.py /app/server.py
RUN chmod 550 /app/server.py

USER smbuser

# Port interne non privilégié (CTFd forwarde le port externe aléatoire)
EXPOSE 1445

CMD ["python3", "/app/server.py"]
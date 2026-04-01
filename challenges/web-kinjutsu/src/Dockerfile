FROM python:3.11-slim

# Métadonnées
LABEL maintainer="CTF NHK26"
LABEL description="Kinjutsu - JWT HMAC Challenge"
LABEL version="1.0"

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de requirements
COPY requirements.txt .

# Installer les dépendances Python et curl pour healthcheck
RUN pip install --no-cache-dir -r requirements.txt && \
    apt-get update && \
    apt-get install -y curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copier l'application et les templates
COPY app.py .
COPY templates/ ./templates/

# Exposer le port
EXPOSE 5000

# Variables d'environnement par défaut
ENV SECRET_KEY=jutsu
ENV FLAG=NHK26{Jwt_Br0k3n_S3cr3ts_4r3_D4ng3r0us}
ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Créer un utilisateur non-root pour la sécurité
RUN useradd -m -u 1000 ctfuser && \
    chown -R ctfuser:ctfuser /app

# Changer vers l'utilisateur non-root
USER ctfuser

# Lancer l'application
CMD ["python", "-u", "app.py"]

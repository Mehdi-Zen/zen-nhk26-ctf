# Utilisation d'une image Python légère et performante
FROM python:3.11-slim

# Définition du répertoire de travail
WORKDIR /app

# Copie des dépendances et installation
COPY src/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie de tout le code source (serveur + client)
# Note : Par défaut, ces fichiers appartiendront à "root"
COPY src/ .

# Création de l'utilisateur système "ctfuser" sans shell ni répertoire personnel
RUN useradd -M -s /bin/false ctfuser

# Sécurisation des permissions : 
# 5 (Lecture + Exécution) pour le propriétaire (root), le groupe (root), et les autres (ctfuser)
RUN chmod -R 555 /app

# On bascule sur l'utilisateur non privilégié
USER ctfuser

# Exposition du port pour CTFd
EXPOSE 8000

# Lancement du serveur avec Uvicorn
CMD ["uvicorn", "server.main:app", "--host", "0.0.0.0", "--port", "8000"]

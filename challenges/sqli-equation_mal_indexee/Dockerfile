FROM mongo:4.4

# Installer Node.js
RUN apt-get update && apt-get install -y curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean

WORKDIR /app

# Copier le code
COPY src/ /app/

# Installer dépendances
RUN npm install

# Exposer le port
EXPOSE 5000

# Utiliser le start.sh
RUN chmod +x /app/start.sh

CMD ["/app/start.sh"]
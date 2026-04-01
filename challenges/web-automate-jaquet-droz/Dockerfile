# Image Nginx (version légère Alpine)
FROM nginx:alpine

# Supprime la page par défaut de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Pages du serveur web
COPY src/index.html /usr/share/nginx/html/
COPY src/robots.txt /usr/share/nginx/html/

# Expose le port 80
EXPOSE 80
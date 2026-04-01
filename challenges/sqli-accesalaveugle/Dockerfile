FROM php:8.2-fpm

ENV DEBIAN_FRONTEND=noninteractive

# Installer nginx + mysql + outils
RUN apt-get update && apt-get install -y \
    nginx \
    mariadb-server \
    mariadb-client \
    && docker-php-ext-install mysqli pdo_mysql \
    && apt-get clean

# Dossier web
WORKDIR /var/www/html

# Copier les fichiers web
COPY src/web/ /var/www/html/

# Copier la config nginx
COPY src/nginx.conf /etc/nginx/sites-available/default

# Copier le SQL
COPY src/sql/loginsystem.sql /init.sql

# Variables d'environnement
ENV DB_HOST=localhost \
    DB_NAME=loginsystem \
    DB_USER=root \
    DB_PASSWORD=""

# Script de démarrage
COPY src/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]


FROM php:8.2-apache

# Installer sqlite (PDO est déjà activé mais on sécurise)
RUN apt-get update && apt-get install -y sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Copier les fichiers
COPY src/ /var/www/html/

# Donner les droits à Apache
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 /var/www/html

EXPOSE 80
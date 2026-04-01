FROM php:8.0-apache

RUN apt-get update && apt-get install -y mariadb-server \
    && docker-php-ext-install mysqli

RUN echo "DirectoryIndex index.php" > /etc/apache2/conf-available/index.conf \
    && a2enconf index

COPY src/web/ /var/www/html/
COPY src/db/db.sql /db.sql
COPY src/start.sh /start.sh

RUN chmod +x /start.sh \
    && chown -R www-data:www-data /var/www/html

EXPOSE 80

CMD ["/start.sh"]


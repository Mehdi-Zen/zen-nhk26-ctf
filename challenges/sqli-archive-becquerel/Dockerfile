FROM php:8.0-apache

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    mariadb-server \
    libzip-dev \
    && docker-php-ext-install pdo pdo_mysql \
    && a2enmod rewrite

COPY src/app/ /var/www/html/
COPY src/init.sql /var/www/html/init.sql
COPY src/start.sh /start.sh
COPY src/my.cnf /etc/mysql/conf.d/my.cnf

RUN chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]

FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    mariadb-server mariadb-client supervisor \
 && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install mysqli

COPY src/web/ /var/www/html/

COPY src/db/init.sql /docker-entrypoint-initdb.d/init.sql

COPY src/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY src/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN mkdir -p /var/run/mysqld /var/lib/mysql \
 && chown -R mysql:mysql /var/run/mysqld /var/lib/mysql

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]

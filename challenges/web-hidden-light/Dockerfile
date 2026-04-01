FROM php:8.2-apache

RUN a2enmod rewrite \
 && echo "ServerName localhost" >> /etc/apache2/apache2.conf

WORKDIR /var/www/html
RUN rm -rf /var/www/html/*
COPY . /var/www/html/

ENV APACHE_DOCUMENT_ROOT=/var/www/html/src
RUN sed -ri 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf

RUN printf '%s\n' \
'<Directory /var/www/html/src>' \
'    Options FollowSymLinks' \
'    AllowOverride All' \
'    Require all granted' \
'    DirectoryIndex accueil.html index.html index.php' \
'</Directory>' \
> /etc/apache2/conf-available/ctf.conf \
 && a2enconf ctf

RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
CMD ["apache2-foreground"]

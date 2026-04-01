FROM php:8.2-apache

RUN a2enmod rewrite

# Changer le port Apache de 80 à 5544
RUN sed -i 's/80/5544/g' /etc/apache2/ports.conf \
    && sed -i 's/:80/:5544/g' /etc/apache2/sites-available/000-default.conf

COPY /src/www /var/www/html/

RUN chown -R www-data:www-data /var/www/html && chmod -R 755 /var/www/html

EXPOSE 5544

CMD ["apache2-foreground"]


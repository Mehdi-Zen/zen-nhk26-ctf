FROM php:8.2-apache

RUN a2enmod rewrite

# Changer le port Apache de 80 à 18053
RUN sed -i 's/80/18053/g' /etc/apache2/ports.conf \
    && sed -i 's/:80/:18053/g' /etc/apache2/sites-available/000-default.conf

COPY src/www/ /var/www/html/

RUN chown -R www-data:www-data /var/www/html

EXPOSE 18053

CMD ["apache2-foreground"]

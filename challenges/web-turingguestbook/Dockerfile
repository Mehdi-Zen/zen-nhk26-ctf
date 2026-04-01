FROM php:8.2-apache

RUN apt-get update && apt-get install -y \
    sqlite3 \
    libsqlite3-dev \
    nodejs \
    npm \
    chromium \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install pdo_sqlite

RUN npm install puppeteer --prefix /opt/bot

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Fichiers depuis src/
COPY src/index.php  /var/www/html/index.php
COPY src/bot.js     /opt/bot/bot.js
COPY src/flag.txt   /flag.txt
COPY src/start.sh   /start.sh

RUN mkdir -p /var/www/html/data \
    && chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

RUN chmod +x /start.sh

EXPOSE 80

CMD ["/start.sh"]

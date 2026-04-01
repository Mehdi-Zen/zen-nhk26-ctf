#!/bin/bash
service mariadb start
sleep 5
mysql -u root < /init.sql
php-fpm -D
nginx -g "daemon off;"

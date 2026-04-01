#!/bin/bash

service mariadb start
sleep 5   


mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS becquerel_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'user'@'localhost' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON becquerel_db.* TO 'user'@'localhost';
FLUSH PRIVILEGES;
EOF

mysql -u root --default-character-set=utf8mb4 becquerel_db < /var/www/html/init.sql


mysql -u root -e "
    ALTER DATABASE becquerel_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"

apache2-foreground

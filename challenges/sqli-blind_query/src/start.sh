#!/bin/bash

service mariadb start

sleep 3

mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS bdd_laboratoire;
CREATE USER IF NOT EXISTS 'CTF_NHK_2026'@'localhost' IDENTIFIED BY 'CTF_NHK_2026';
GRANT ALL PRIVILEGES ON bdd_laboratoire.* TO 'CTF_NHK_2026'@'localhost';
FLUSH PRIVILEGES;
USE bdd_laboratoire;
SOURCE /db.sql;
EOF

# Lancer Apache
apache2-foreground


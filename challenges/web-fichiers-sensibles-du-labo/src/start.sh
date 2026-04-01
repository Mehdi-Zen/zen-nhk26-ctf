#!/bin/bash

service mariadb start

mysql -e "SOURCE /db.sql"

su - appuser -c "python3 /app.py"

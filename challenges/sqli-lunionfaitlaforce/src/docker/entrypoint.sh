#!/bin/bash
set -e

mkdir -p /var/run/mysqld /var/lib/mysql
chown -R mysql:mysql /var/run/mysqld /var/lib/mysql

if [ ! -d /var/lib/mysql/mysql ]; then
  su -s /bin/sh mysql -c "mariadb-install-db --datadir=/var/lib/mysql"
fi

su -s /bin/sh mysql -c "mysqld --datadir=/var/lib/mysql --socket=/var/run/mysqld/mysqld.sock" &

for i in {1..80}; do
  mariadb-admin --socket=/var/run/mysqld/mysqld.sock ping --silent && break
  sleep 0.2
done

if [ ! -f /var/lib/mysql/.ctf_inited ]; then
  mariadb --socket=/var/run/mysqld/mysqld.sock -uroot < /docker-entrypoint-initdb.d/init.sql
  touch /var/lib/mysql/.ctf_inited
fi

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

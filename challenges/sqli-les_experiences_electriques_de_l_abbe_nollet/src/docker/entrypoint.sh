#!/usr/bin/env bash
set -euo pipefail

PORT="${PORT:-8080}"
FLAG_VALUE="${FLAG:-CTF{Nollet_Cables_Humains_2026}}"

INIT_MARKER="/var/lib/ctf/.initialized"
mkdir -p /var/lib/ctf

# ---------- Ensure runtime dirs ----------
mkdir -p /var/run/mysqld
chown -R mysql:mysql /var/run/mysqld

mkdir -p /var/run/postgresql
chown -R postgres:postgres /var/run/postgresql

mkdir -p /var/log/postgresql
chown -R postgres:postgres /var/log/postgresql

# ---------- Ensure MySQL datadir is initialized ----------
if [ ! -d /var/lib/mysql/mysql ]; then
  echo "[*] Initializing MySQL datadir..."
  mkdir -p /var/lib/mysql
  chown -R mysql:mysql /var/lib/mysql
  mysqld --initialize-insecure --user=mysql >/tmp/mysql_initdb.log 2>&1 || {
    echo "[!] MySQL init failed:"
    tail -n 200 /tmp/mysql_initdb.log || true
    exit 1
  }
fi

# ---------- Start MySQL (temporary) ----------
echo "[*] Starting MySQL for initialization..."
/usr/sbin/mysqld --user=mysql --bind-address=127.0.0.1 --socket=/var/run/mysqld/mysqld.sock --pid-file=/var/run/mysqld/mysqld.pid >/tmp/mysql_boot.log 2>&1 &
MYSQL_PID=$!

for i in $(seq 1 200); do
  if mysqladmin ping -uroot --silent >/dev/null 2>&1; then break; fi
  sleep 0.2
done
if ! mysqladmin ping -uroot --silent >/dev/null 2>&1; then
  echo "[!] MySQL did not start:"
  tail -n 200 /tmp/mysql_boot.log || true
  exit 1
fi

# ---------- Ensure Postgres cluster exists ----------
PG_CONF="/etc/postgresql/14/main/postgresql.conf"
PG_HBA="/etc/postgresql/14/main/pg_hba.conf"

if [ ! -f "${PG_CONF}" ]; then
  echo "[*] PostgreSQL config not found at ${PG_CONF}. Creating cluster with initdb..."
  if [ ! -s /var/lib/postgresql/14/main/PG_VERSION ]; then
    rm -rf /var/lib/postgresql/14/main
    mkdir -p /var/lib/postgresql/14/main
    chown -R postgres:postgres /var/lib/postgresql/14
    su - postgres -c "/usr/lib/postgresql/14/bin/initdb -D /var/lib/postgresql/14/main" >/tmp/postgres_initdb.log 2>&1 || {
      echo "[!] initdb failed:"
      tail -n 200 /tmp/postgres_initdb.log || true
      exit 1
    }
  fi
  if [ ! -f /var/lib/postgresql/14/main/postgresql.conf ]; then
    cat > /var/lib/postgresql/14/main/postgresql.conf <<'EOF'
listen_addresses = '127.0.0.1'
port = 5432
unix_socket_directories = '/var/run/postgresql'
logging_collector = off
statement_timeout = 0
EOF
    chown postgres:postgres /var/lib/postgresql/14/main/postgresql.conf
  fi
  PG_HBA="/var/lib/postgresql/14/main/pg_hba.conf"
  PG_START_OPTS="-c listen_addresses=127.0.0.1 -c logging_collector=off -c statement_timeout=0"
else
  PG_START_OPTS="-c config_file=${PG_CONF} -c listen_addresses=127.0.0.1 -c logging_collector=off -c statement_timeout=0"
fi

# ---------- Patch pg_hba.conf AVANT de démarrer Postgres ----------
# Ajouter les règles TCP md5 pour nollet_api si absentes
if [ -f "$PG_HBA" ]; then
  # Supprimer les anciennes entrées scram-sha-256 restrictives si présentes
  # Ajouter l'accès TCP md5 pour nollet_api
  if ! grep -q "nollet_api" "$PG_HBA"; then
    echo "# CTF challenge — nollet_api TCP access" >> "$PG_HBA"
    echo "host    nollet_api      nollet_api      127.0.0.1/32            md5" >> "$PG_HBA"
    echo "host    all             all             127.0.0.1/32            md5" >> "$PG_HBA"
  fi
  chown postgres:postgres "$PG_HBA"
fi

# ---------- Start Postgres (temporary) ----------
echo "[*] Starting PostgreSQL for initialization..."
touch /tmp/postgres_boot.log
chown postgres:postgres /tmp/postgres_boot.log

su - postgres -c "/usr/lib/postgresql/14/bin/pg_ctl -D /var/lib/postgresql/14/main -l /tmp/postgres_boot.log -o \"${PG_START_OPTS}\" start" >/tmp/postgres_pgctl.log 2>&1 || {
  echo "[!] PostgreSQL start failed:"
  tail -n 200 /tmp/postgres_pgctl.log || true
  echo "---- postgres_boot.log ----"
  tail -n 200 /tmp/postgres_boot.log || true
  exit 1
}

for i in $(seq 1 200); do
  if su - postgres -c "pg_isready -q -h 127.0.0.1 -p 5432" >/dev/null 2>&1; then break; fi
  sleep 0.2
done
if ! su - postgres -c "pg_isready -q -h 127.0.0.1 -p 5432" >/dev/null 2>&1; then
  echo "[!] PostgreSQL not ready:"
  tail -n 200 /tmp/postgres_boot.log || true
  exit 1
fi

# ---------- Init schemas (once) ----------
if [ ! -f "$INIT_MARKER" ]; then
  echo "[*] Initializing schemas & seed data..."

  echo " - MySQL init"
  mysql -uroot < /opt/challenge/sql/mysql_init.sql

  echo " - PostgreSQL bootstrap"
  # Créer le rôle nollet_api (en superuser postgres via socket Unix)
  if ! su - postgres -c "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='nollet_api'\"" | grep -q 1; then
    su - postgres -c "psql -v ON_ERROR_STOP=1 -c \"CREATE ROLE nollet_api LOGIN PASSWORD 'nollet_api_pass';\""
  else
    su - postgres -c "psql -v ON_ERROR_STOP=1 -c \"ALTER ROLE nollet_api WITH PASSWORD 'nollet_api_pass';\""
  fi

  # Désactiver le statement_timeout pour nollet_api → pg_sleep(3) peut dormir sans être coupé
  su - postgres -c "psql -v ON_ERROR_STOP=1 -c \"ALTER ROLE nollet_api SET statement_timeout = 0;\""

  # Créer la base
  if ! su - postgres -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='nollet_api'\"" | grep -q 1; then
    su - postgres -c "createdb -O nollet_api nollet_api"
  fi

  # GRANT pg_sleep sur la base nollet_api (en superuser)
  su - postgres -c "psql -v ON_ERROR_STOP=1 -d nollet_api -c \"GRANT EXECUTE ON FUNCTION pg_sleep(double precision) TO nollet_api;\""

  # Appliquer le schéma SQL avec le flag injecté
  SAFE_FLAG="${FLAG_VALUE//\\/\\\\}"
  sed "s#__FLAG__#${SAFE_FLAG}#g" /opt/challenge/sql/pg_schema.sql > /tmp/pg_schema_rendered.sql
  su - postgres -c "psql -v ON_ERROR_STOP=1 -d nollet_api -f /tmp/pg_schema_rendered.sql"

  # GRANT sur le schema lab (doit être APRÈS la création du schéma)
  su - postgres -c "psql -v ON_ERROR_STOP=1 -d nollet_api -c \"GRANT USAGE ON SCHEMA lab TO nollet_api;\""
  su - postgres -c "psql -v ON_ERROR_STOP=1 -d nollet_api -c \"GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA lab TO nollet_api;\""

  touch "$INIT_MARKER"
  echo "[+] Init done."
else
  echo "[*] Already initialized."
fi

# ---------- Stop temporary DB daemons ----------
echo "[*] Stopping temporary DB daemons..."
mysqladmin -uroot shutdown >/dev/null 2>&1 || true
kill "${MYSQL_PID}" >/dev/null 2>&1 || true

su - postgres -c "/usr/lib/postgresql/14/bin/pg_ctl -D /var/lib/postgresql/14/main stop -m fast" >/dev/null 2>&1 || true

# ---------- Start supervisord ----------
echo "[*] Starting supervisord..."
export PORT
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

#!/bin/sh
set -e

echo "[*] Démarrage MongoDB"
mkdir -p /data/db
mongod --dbpath /data/db --bind_ip 127.0.0.1 --fork --logpath /tmp/mongo.log

sleep 3

echo "[*] Initialisation base"
node setup_db.js

echo "[*] Démarrage serveur"
node auth.js

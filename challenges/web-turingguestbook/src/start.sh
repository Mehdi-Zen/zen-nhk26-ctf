#!/bin/bash

# Init DB
if [ ! -f /var/www/html/data.db ]; then
sqlite3 /var/www/html/data.db <<EOF
CREATE TABLE guestbook (name TEXT, message TEXT);
INSERT INTO guestbook VALUES (
  'Alan Turing',
  'Sometimes it is the people no one can imagine anything of who do the things no one can imagine.'
);
EOF
fi

# Lancer le bot admin
node /opt/bot/bot.js &

# Lancer Apache
apache2-foreground
#!/usr/bin/env python3
"""
CH06 - Caine: Blind SQL Injection Challenge
Niveau: Hard
Flag: NHK26{bl1nd_sql1_m4st3r_t1m3_b4s3d}
"""

from flask import Flask, request, render_template
import sqlite3
import time
import random
import re

app = Flask(__name__)

# Configuration
FLAG = "NHK26{bl1nd_sql1_m4st3r_t1m3_b4s3d}"
JITTER_MIN = 0.05  # 50ms
JITTER_MAX = 0.15  # 150ms

# WAF - Mots-clés bloqués
BLOCKED_KEYWORDS = [
    'union', 'select', 'sleep', 'benchmark', 'waitfor',
    'concat', 'cast', 'convert', 'information_schema', '0x',
    'load_file', 'into outfile', 'into dumpfile',
    ' or ',  # Bloque OR avec espaces pour eviter false positives (password, error, etc.)
]


def init_db():
    """Initialise la base de données SQLite en mémoire"""
    conn = sqlite3.connect(':memory:', check_same_thread=False)
    cursor = conn.cursor()

    # Création de la table users
    cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            secret TEXT
        )
    ''')

    # Insertion de l'admin avec le flag
    cursor.execute('''
        INSERT INTO users (username, password, secret)
        VALUES ('admin', 'sup3r_s3cr3t_p4ssw0rd_2024!', ?)
    ''', (FLAG,))

    # Quelques utilisateurs factices
    cursor.execute('''
        INSERT INTO users (username, password, secret)
        VALUES ('guest', 'guest123', 'Nothing interesting here')
    ''')
    cursor.execute('''
        INSERT INTO users (username, password, secret)
        VALUES ('user', 'user456', 'Just a regular user')
    ''')

    conn.commit()
    return conn


def check_waf(payload):
    """
    WAF basique - Vérifie si le payload contient des mots-clés bloqués
    Retourne True si le payload est bloqué, False sinon
    """
    payload_lower = payload.lower()
    for keyword in BLOCKED_KEYWORDS:
        if keyword.lower() in payload_lower:
            return True
    return False


def add_jitter():
    """Ajoute un délai aléatoire pour compliquer le time-based"""
    jitter = random.uniform(JITTER_MIN, JITTER_MAX)
    time.sleep(jitter)


# Initialisation de la DB globale
db_connection = init_db()


@app.route('/', methods=['GET', 'POST'])
def login():
    """Page de login vulnérable à Blind SQLi"""
    message = None
    message_type = None

    if request.method == 'POST':
        username = request.form.get('username', '')
        password = request.form.get('password', '')

        # Ajout du jitter sur chaque requête
        add_jitter()

        # Vérification WAF
        if check_waf(username) or check_waf(password):
            # WAF bloqué - même message que credentials invalides
            message = "Invalid credentials"
            message_type = "error"
        else:
            try:
                # VULNÉRABILITÉ: Injection SQL dans le username
                # Le password est vérifié normalement après
                cursor = db_connection.cursor()

                # Requête vulnérable - injection possible dans username
                query = f"SELECT * FROM users WHERE username='{username}'"
                cursor.execute(query)
                user = cursor.fetchone()

                if user:
                    # User trouvé - vérifier le password
                    stored_password = user[2]
                    if password == stored_password:
                        message = f"Welcome back, {user[1]}!"
                        message_type = "success"
                    else:
                        # SUBTILE DIFFERENCE pour Blind SQLi
                        # Quand le user existe mais mauvais password
                        message = "Access denied"
                        message_type = "error"
                else:
                    # Quand le user n'existe pas
                    message = "Invalid credentials"
                    message_type = "error"

            except Exception:
                # Suppression complète des erreurs SQL
                message = "Invalid credentials"
                message_type = "error"

    return render_template('index.html', message=message, message_type=message_type)


@app.route('/health')
def health():
    """Endpoint de health check"""
    return "ok", 200


@app.route('/robots.txt')
def robots():
    """Easter egg pour les curieux"""
    return "User-agent: *\nDisallow: /admin-panel-secret\n# Nothing to see here... or is there?", 200


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)

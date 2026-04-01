#!/usr/bin/env python3
from flask import Flask, request, jsonify
import re
import time
import os

app = Flask(__name__)

FLAG = os.environ.get('FLAG', 'NHK26{r3d0s_b4cKtr4ck1ng_pwn3d_2026}')
ANOMALY_THRESHOLD = 5.0
MAX_LENGTH = 35


def _normalize(email):
    return email.strip()


def _check_format(email):
    pattern = r'^([a-zA-Z0-9]+)*@[a-zA-Z0-9]+\.[a-zA-Z]+$'
    return bool(re.match(pattern, email))


def _check_domain(email):
    if '@' not in email:
        return False
    domain = email.split('@', 1)[1]
    return '.' in domain and len(domain) >= 4


def _check_length(email):
    local = email.split('@')[0] if '@' in email else email
    return 1 <= len(local) <= 64


def _run_validation(email):
    start = time.time()
    result = _check_format(email)
    elapsed = time.time() - start
    return result, elapsed


@app.route('/validate', methods=['POST'])
def validate_email():
    data = request.get_json(silent=True)
    if not data or 'email' not in data:
        return jsonify({"error": "Parametre manquant"}), 400

    if not isinstance(data['email'], str):
        return jsonify({"error": "Type invalide"}), 400

    email = _normalize(data['email'])

    if len(email) > MAX_LENGTH:
        return jsonify({"error": f"Trop long (max {MAX_LENGTH})"}), 400

    result, elapsed = _run_validation(email)

    if elapsed > ANOMALY_THRESHOLD:
        return jsonify({"flag": FLAG})

    if not result:
        return jsonify({"valid": False})

    if not _check_domain(email):
        return jsonify({"valid": False})

    if not _check_length(email):
        return jsonify({"valid": False})

    return jsonify({"valid": True})


@app.route('/health')
def health():
    return jsonify({"status": "ok"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)

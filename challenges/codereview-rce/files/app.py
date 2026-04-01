#!/usr/bin/env python3
from flask import Flask, request, jsonify, render_template
import subprocess
import os
import time

app = Flask(__name__, template_folder='/app/templates')

LOG_SCRIPT = "/tmp/logs/log.sh"
LOG_FILE = "/var/log/grace_hopper/visitors.log"
ADMIN_USER = "admin"
ADMIN_PASS = "grace_hopper_pioneer_1906"

@app.route('/')
def index():
    return render_template('register.html')

@app.route('/register', methods=['GET'])
def register_form():
    return render_template('register.html')

@app.route('/register', methods=['POST'])
def register_api():
    username = request.form.get('username', '').strip()
    email = request.form.get('email', '').strip()
    
    if not username or not email:
        return jsonify({"error": "Champs requis manquants"}), 400
    
    if len(username) > 100 or len(email) > 100:
        return jsonify({"error": "Données trop longues"}), 400
    
    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    try:
        with open(LOG_SCRIPT, 'a') as f:
            f.write(f'echo "[{timestamp}] INSCRIPTION username={username}" >> {LOG_FILE}\n')
    except Exception:
        return jsonify({"error": "Erreur d'écriture"}), 500
    
    return jsonify({
        "success": True,
        "message": "Visiteur enregistré. Logs à traiter par l'administrateur."
    }), 200

@app.route('/admin/run-log', methods=['POST'])
def run_log():
    auth = request.authorization
    if not auth or auth.username != ADMIN_USER or auth.password != ADMIN_PASS:
        return jsonify({"error": "Authentification requise (admin)"}), 401
    
    try:
        result = subprocess.run(
            ["/bin/bash", LOG_SCRIPT],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        with open(LOG_SCRIPT, 'w') as f:
            f.write("#!/bin/bash\n")
        
        full_output = (result.stdout + result.stderr).strip()
        
        return jsonify({
            "success": True,
            "output": full_output[:1000] or "Logs traités",
            "return_code": result.returncode
        }), 200
    
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Timeout d'exécution"}), 500
    except Exception as e:
        return jsonify({"error": f"Erreur: {str(e)}"}), 500

@app.route('/info')
def info():
    return jsonify({
        "laboratory": "Grace Hopper Computing Lab",
        "endpoints": {
            "register": "POST /register (username, email)",
            "admin": "POST /admin/run-log (HTTP Basic Auth: admin:grace_hopper_pioneer_1906)"
        }
    })

@app.route('/<path:invalid_path>')
def block_invalid(invalid_path):
    forbidden = ["flag", "proc", "self", ".git", "etc/passwd", "root"]
    if any(f in invalid_path.lower() for f in forbidden):
        return jsonify({"error": "Accès refusé"}), 403
    return jsonify({"error": "Page non trouvée"}), 404

if __name__ == '__main__':
    os.makedirs("/var/log/grace_hopper", exist_ok=True)
    os.makedirs("/tmp/logs", exist_ok=True)
    
    if not os.path.exists(LOG_SCRIPT):
        with open(LOG_SCRIPT, 'w') as f:
            f.write("#!/bin/bash\n")
    
    if not os.path.exists(LOG_FILE):
        open(LOG_FILE, 'w').close()
    
    app.run(host='0.0.0.0', port=5000, debug=False)
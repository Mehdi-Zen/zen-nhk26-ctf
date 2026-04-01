#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kinjutsu - CTF Challenge
API Flask avec authentification JWT vulnérable
"""

import os
import jwt
from flask import Flask, jsonify, request, render_template
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__)

# Configuration - Clé faible intentionnelle pour le challenge
SECRET_KEY = os.environ.get('SECRET_KEY', 'jutsu')
FLAG = os.environ.get('FLAG', 'NHK26{Jwt_Br0k3n_S3cr3ts_4r3_D4ng3r0us}')

# Bannière ASCII
BANNER = """
╔════════════════════════════════════════════════════════════╗
║                      Kinjutsu CTF                            ║
║                                                            ║
║  "La sécurité ouverte est excellente...                    ║
║   mais pas avec une clé HMAC triviale !"                   ║
╚════════════════════════════════════════════════════════════╝
"""


def verify_token(f):
    """Décorateur pour vérifier le JWT"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Récupérer le token depuis le header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Format: "Bearer <token>"
            except IndexError:
                return render_template('secret.html',
                                     success=False,
                                     error_type='invalid_token',
                                     error_message='Format du token invalide.')
        
        if not token:
            return render_template('secret.html',
                                 success=False,
                                 error_type='no_token',
                                 error_message='Token manquant.')
        
        try:
            # Décoder et vérifier le token
            # Force l'algorithme HS256 pour éviter les attaques "none" et "key confusion"
            data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            request.current_user = data
        except jwt.ExpiredSignatureError:
            return render_template('secret.html',
                                 success=False,
                                 error_type='invalid_token',
                                 error_message='Token expiré')
        except jwt.InvalidSignatureError:
            return render_template('secret.html',
                                 success=False,
                                 error_type='invalid_token',
                                 error_message='Signature invalide')
        except Exception as e:
            return render_template('secret.html',
                                 success=False,
                                 error_type='invalid_token',
                                 error_message='Token invalide')
        
        return f(*args, **kwargs)
    
    return decorated


@app.route('/', methods=['GET'])
def index():
    """Page d'accueil avec instructions"""
    return render_template('index.html')


@app.route('/jutsus', methods=['GET'])
def jutsus():
    """Page encyclopédie des jutsus - leurre thématique"""
    return render_template('jutsus.html')


@app.route('/token', methods=['GET'])
def get_token():
    """Génère un token JWT pour un utilisateur basique"""
    try:
        # Payload du token utilisateur
        payload = {
            'user': 'mond',
            'role': 'user',
            'iat': datetime.utcnow(),
            'exp': datetime.utcnow() + timedelta(hours=24)
        }
        
        # Générer le token avec la clé faible
        token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')
        
        return render_template('token.html', 
                             token=token,
                             user='mond',
                             role='user')
    
    except Exception as e:
        return render_template('secret.html',
                             success=False,
                             error_type='invalid_token',
                             error_message=f'Erreur lors de la génération du token')


@app.route('/secret', methods=['GET'])
@verify_token
def get_secret():
    """Endpoint protégé - nécessite un token admin valide"""
    user_data = request.current_user
    
    # Vérifier le rôle admin
    if user_data.get('role') != 'admin':
        return render_template('secret.html',
                             success=False,
                             error_type='forbidden',
                             error_message=f'Accès refusé. Votre rôle actuel: {user_data.get("role")}. Rôle requis: admin',
                             current_role=user_data.get('role'))
    
    # L'utilisateur est admin, on retourne le flag
    return render_template('secret.html',
                         success=True,
                         flag=FLAG,
                         user=user_data.get('user', 'unknown'))


@app.route('/health', methods=['GET'])
def health():
    """Endpoint de santé pour Docker"""
    return jsonify({'status': 'healthy'}), 200


@app.errorhandler(404)
def not_found(e):
    """Gestion des erreurs 404"""
    return jsonify({
        'ok': False,
        'message': 'Ce chemin n\'existe pas, ninja.'
    }), 404


if __name__ == '__main__':
    print(BANNER)
    print(f"[*] Serveur démarré sur le port 5000")
    # Ne jamais logger les secrets en production !
    # print(f"[*] Secret HMAC: {SECRET_KEY}")
    # print(f"[*] Flag: {FLAG}")
    print()
    app.run(host='0.0.0.0', port=5000, debug=False)

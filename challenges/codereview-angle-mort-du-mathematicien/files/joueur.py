import threading
import time
import hashlib
import json


CIPHERTEXT = bytes.fromhex("c0830a22f550c3221ef730e50a11996960150f321e55d104a0c73b972acc5f50eab6")

def get_state_key(data_list):
    canonical_data = json.dumps(sorted(data_list), separators=(',', ':'))
    return hashlib.sha256(canonical_data.encode()).digest()

def decrypt_flag(key):
    try:
        decrypted = bytearray()
        for i in range(len(CIPHERTEXT)):
            decrypted.append(CIPHERTEXT[i] ^ key[i % len(key)])
        return decrypted.decode('utf-8', errors='ignore')
    except:
        return "Erreur"

class ShamirVault:
    def __init__(self):
        self.db = []
        
    def add_user(self, username):
        if username in self.db:
            return False
        time.sleep(0.01)
        self.db.append(username)
        return True

def run_attack():
    vault = ShamirVault()
    threads = []
    
    targets = ['Alice', 'Bob', 'Alice', 'Charlie', 'Bob', 'Dave', 'Alice', 'Eve']
    print(f"[*] Lancement de {len(targets)} threads...")

    def worker(u):
        vault.add_user(u)

    for user in targets:
        t = threading.Thread(target=worker, args=(user,))
        threads.append(t)
        t.start()

    for t in threads:
        t.join()

    print(f"[*] Taille DB : {len(vault.db)} (Attendu pour le flag : {len(set(targets))})")
    
    current_key = get_state_key(vault.db)
    flag = decrypt_flag(current_key)
    
    print("-" * 40)
    print(f"RESULTAT : {flag}")
    print("-" * 40)

if __name__ == "__main__":
    run_attack()
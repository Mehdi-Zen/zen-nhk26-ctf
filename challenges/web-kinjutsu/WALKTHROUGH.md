# Walkthrough - Kinjutsu (MOYEN - Crypto)

## Flag
`NHK26{Jwt_Br0k3n_S3cr3ts_4r3_D4ng3r0us}`

## Résumé
Une API Flask utilise des JWT avec une clé HMAC faible. Il faut brute-forcer la clé, forger un token admin, et accéder à l'endpoint protégé.

## Étape 1 : Explorer l'application
1. Accéder à l'application web
2. Explorer les pages : `/`, `/jutsus`, `/token`, `/secret`
3. `/token` donne un JWT utilisateur
4. `/secret` nécessite un token admin

## Étape 2 : Récupérer un token
1. Aller sur `/token`
2. Copier le JWT fourni
3. Décoder sur jwt.io :
```json
{
  "user": "mond",
  "role": "user",
  "iat": ...,
  "exp": ...
}
```

## Étape 3 : Brute-forcer la clé HMAC
La clé est faible : `jutsu`

Méthode 1 - hashcat :
```bash
echo "VOTRE_JWT" > jwt.txt
hashcat -a 0 -m 16500 jwt.txt wordlist.txt
```

Méthode 2 - john the ripper :
```bash
john jwt.txt --wordlist=rockyou.txt --format=HMAC-SHA256
```

Méthode 3 - jwt_tool :
```bash
python3 jwt_tool.py VOTRE_JWT -C -d wordlist.txt
```

Méthode 4 - Script Python :
```python
import jwt
token = "VOTRE_JWT"
with open('wordlist.txt') as f:
    for line in f:
        key = line.strip()
        try:
            jwt.decode(token, key, algorithms=["HS256"])
            print(f"Clé trouvée : {key}")
            break
        except:
            pass
```

La clé `jutsu` est trouvable dans une wordlist standard ou par déduction thématique (le challenge s'appelle "Kinjutsu").

## Étape 4 : Forger un token admin
```python
import jwt
from datetime import datetime, timedelta

payload = {
    "user": "admin",
    "role": "admin",
    "iat": datetime.utcnow(),
    "exp": datetime.utcnow() + timedelta(hours=24)
}

token = jwt.encode(payload, "jutsu", algorithm="HS256")
print(token)
```

## Étape 5 : Accéder au secret
```bash
curl -H "Authorization: Bearer VOTRE_TOKEN_FORGE" http://HOST:PORT/secret
```

Ou dans le navigateur : modifier le header Authorization avec une extension (ModHeader, etc.)

Le flag s'affiche : `NHK26{Jwt_Br0k3n_S3cr3ts_4r3_D4ng3r0us}`

## Notes
- L'algorithme est forcé à HS256 (pas d'attaque "none" possible)
- La clé est volontairement faible pour le brute-force
- Le rôle doit être exactement "admin"

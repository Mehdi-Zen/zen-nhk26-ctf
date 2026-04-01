# Crazy Casino

**Category:** Web | **Difficulty:** INSANE | **Author:** Mehdi Belayachi

## Description

Un casino en ligne avec 4 vulnerabilites a exploiter en chaine pour obtenir le flag complet.

## Flag

`NHK26{3ZJ61mvadGxV3M1J2Z1Zp57UtUbCEBp6}`

Compose de 4 fragments :
- Fragment 1 (games.js) : `NHK26{3ZJ` — Race Condition
- Fragment 2 (auth.js) : `61mvadGxV` — JWT Manipulation
- Fragment 3 (init.sql) : `3M1J2Z1Zp` — Prototype Pollution
- Fragment 4 (flag.txt) : `57UtUbCEBp6}` — Deserialization RCE

## Vulnerabilities (attack chain)

1. **Race Condition** — `POST /api/g/play` (Fragment 1)
   - Exploiter le delai de 200ms entre la verification du solde et le debit
   - Envoyer des requetes concurrentes pour obtenir un solde > 100000 ou < -1000
   - Revele Fragment 1 dans la reponse

2. **JWT Manipulation** — `GET /auth/me` (Fragment 2)
   - Le secret JWT est leak via HTTP headers :
     - Envoyer du JSON invalide → header `X-Request-Id` contient partie 1 (base64)
     - Envoyer requete avec `User-Agent: VaultMgr/865` → header `X-Debug-Token` contient partie 2 (base64)
     - L'indice `VaultMgr/865` est encode en hex dans les couleurs CSS (`style.css`)
   - Forger un JWT avec `lvl >= 3` et `bal >= 1000000`
   - `GET /auth/me` avec le token forge revele Fragment 2

3. **Prototype Pollution** — `POST /api/m/q` (Fragment 3)
   - Le filtre bloque `__proto__` mais pas `constructor.prototype`
   - Polluer `Object.prototype._0x7f3e` (indice dans le CSS) pour debloquer la requete SQL avec `secret_note`
   - Le `secret_note` du membre `system_vault` contient Fragment 3

4. **Deserialization RCE** — `POST /api/t/process` (Fragment 4)
   - Necessite un JWT forge (lvl >= 3, bal >= 1000000) pour acceder au vault
   - `node-serialize.unserialize()` permet l'execution de code arbitraire
   - Creer `/tmp/pwned` ou `/tmp/casino_pwned` via RCE
   - Le serveur lit et retourne `/flag.txt` (Fragment 4)

## Build & Run

```bash
docker build -t crazy-casino .
docker run -d -p 8080:80 crazy-casino
open http://localhost:8080
```

## Files

```
web-crazy-casino/
├── Dockerfile
├── package.json
├── challenge.yml
├── config/
│   ├── nginx.conf
│   └── supervisord.conf
├── scripts/
│   └── init.sql
├── src/
│   ├── app.js          # JWT secret leak via headers + middleware
│   ├── routes/
│   │   ├── auth.js     # JWT forge check (Fragment 2)
│   │   ├── games.js    # Race condition (Fragment 1)
│   │   ├── vip.js      # Prototype Pollution (Fragment 3)
│   │   └── vault.js    # Deserialization RCE (Fragment 4)
│   ├── views/
│   │   ├── index.ejs
│   │   ├── dashboard.ejs
│   │   └── vip.ejs
│   └── public/
│       ├── css/style.css  # Hex-encoded hint (VaultMgr/865, _0x7f3e)
│       └── js/
│           ├── auth.js
│           ├── config.js
│           ├── dashboard.js
│           └── vip.js
└── solution/
    ├── WRITEUP.md
    └── exploit.py
```

## Hints (CTFd)

1. (50 pts) "Les headers HTTP cachent parfois des secrets... Essayez de provoquer des erreurs."
2. (75 pts) "Certaines couleurs CSS ne sont pas que decoratives."

## Testing

```bash
cd solution/
pip install requests pyjwt
python3 exploit.py http://localhost:8080
```

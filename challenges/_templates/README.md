# Challenge Templates

## Structure Standard

```
category-challengename/
├── challenge.yml              # Configuration principale (OBLIGATOIRE)
├── Dockerfile                 # A la RACINE (container challenges)
├── docker-compose.yml         # Optionnel, pour dev local
│
├── files/                     # Fichiers DONNES aux participants
│   ├── challenge.png          # Image description (OBLIGATOIRE)
│   ├── script.py              # Scripts, binaires, etc.
│   ├── data.enc               # Fichiers chiffres
│   └── readme.txt             # Instructions
│
├── src/                       # Code SOURCE du challenge (PAS donne aux participants)
│   ├── app.py                 # Application principale
│   ├── templates/             # Templates web
│   └── static/                # Assets statiques
│
└── solution/                  # Solution (JAMAIS deploye, pour les admins)
    ├── solve.py
    └── writeup.md
```

## Naming Convention

**Format:** `category-challengename`
- Tout en **minuscule**
- Tiret `-` comme separateur
- Pas d'espaces ni caracteres speciaux
- Court et descriptif

### Categories Officielles

| Category   | Prefix     | Exemples                        |
|------------|------------|---------------------------------|
| Web        | `web-`     | `web-sqli`, `web-xss`, `web-jwt`|
| Pwn        | `pwn-`     | `pwn-bof`, `pwn-rop`, `pwn-heap`|
| Crypto     | `crypto-`  | `crypto-rsa`, `crypto-aes`      |
| Forensic   | `forensic-`| `forensic-memory`, `forensic-pcap`|
| Reverse    | `reverse-` | `reverse-crackme`, `reverse-apk`|
| OSINT      | `osint-`   | `osint-geoloc`, `osint-social`  |
| Misc       | `misc-`    | `misc-ppc`, `misc-stego`        |

## Types de Challenges

### 1. Container (`type: container`)

Challenge avec Docker container spawne par CTFd.

```yaml
type: container
image: registry.gitlab.com/.../web-sqli:latest
port: 5000
protocol: web  # ou tcp
```

**Structure:**
```
web-sqli/
├── challenge.yml
├── Dockerfile
├── files/              # Optionnel: fichiers pour participants
│   └── hint.txt
└── src/
    ├── app.py
    └── templates/
```

### 2. FirstBlood (`type: firstblood`)

Challenge dynamic avec bonus pour les premiers solvers.

```yaml
type: firstblood
extra:
  initial: 500
  decay: 25
  minimum: 100
first_blood_bonus:
  - 100  # 1st
  - 50   # 2nd
  - 25   # 3rd
```

**Structure:**
```
crypto-hardcore/
├── challenge.yml
├── files/
│   ├── encrypted.bin
│   └── public_key.pem
└── solution/
    └── solve.py
```

### 3. Dynamic (`type: dynamic`)

Challenge standard avec scoring dynamique.

```yaml
type: dynamic
extra:
  initial: 300
  decay: 20
  minimum: 50
```

**Structure:**
```
crypto-base64/
├── challenge.yml
└── files/
    └── encoded.txt
```

## Champ `files:` dans challenge.yml

Le champ `files:` liste les fichiers a uploader sur CTFd et donner aux participants.

```yaml
# Fichiers dans le dossier files/
files:
  - files/script.py
  - files/data.enc
  - files/readme.txt

# OU chemin relatif direct (moins propre)
files:
  - message.txt
```

**Important:**
- Mettre TOUS les fichiers participants dans `files/`
- Ne PAS inclure le code source (`src/`) dans `files:`
- Ne PAS inclure les solutions

## Champ `description_image:` (OBLIGATOIRE)

Image affichee en haut de la description du challenge. **Chaque challenge doit avoir une image.**

```yaml
# Placer l'image dans files/
description_image: files/challenge.png
```

- Format recommande: PNG ou JPEG
- Taille recommandee: 400x400px minimum
- L'image sera uploadee dans la Media Library de CTFd

## Scoring Dynamic

```
value = ((minimum - initial) / decay^2) * solve_count^2 + initial
```

| Solves | initial=500, decay=25, min=100 |
|--------|-------------------------------|
| 0      | 500                           |
| 5      | 468                           |
| 10     | 372                           |
| 15     | 212                           |
| 20+    | 100 (minimum)                 |

## Difficulty Tags (OBLIGATOIRE)

Le **premier tag** doit TOUJOURS etre la difficulte (affichee sur la card du challenge).

| Tag        | Points (initial) | Description                |
|------------|------------------|----------------------------|
| `INTRO`    | 50               | Tutoriel, decouverte       |
| `FACILE`   | 100              | Debutant                   |
| `MOYEN`    | 300              | Connaissances de base      |
| `DIFFICILE`| 500              | Expertise requise          |
| `INSANE`   | 1000             | Top-tier, tres technique   |

```yaml
tags:
  - MOYEN      # Premier tag = difficulte (OBLIGATOIRE)
  - Web        # Tags supplementaires
  - SQLi
```

### Tag FIRST BLOOD (pour type: firstblood)

Pour les challenges de type `firstblood`, ajouter le tag `FIRST BLOOD` en **deuxieme position** (apres la difficulte). Ce tag s'affiche sur la card avec une animation speciale rouge.

```yaml
# Challenge firstblood
tags:
  - DIFFICILE    # 1er: difficulte
  - FIRST BLOOD  # 2eme: OBLIGATOIRE pour firstblood
  - Pwn          # Autres tags
```

## Exemples Complets

### Exemple Container (Web)

```
web-blindsqli/
├── challenge.yml
├── Dockerfile
├── src/
│   ├── app.py
│   ├── templates/
│   │   └── index.html
│   └── requirements.txt
├── files/
│   └── wordlist.txt       # Donne aux participants
└── solution/
    └── exploit.py
```

### Exemple Dynamic (Crypto)

```
crypto-rsaweak/
├── challenge.yml
├── files/
│   ├── message.enc
│   ├── public.pem
│   └── hint.txt
└── solution/
    ├── solve.py
    └── writeup.md
```

### Exemple FirstBlood (Pwn)

```
pwn-ropchain/
├── challenge.yml
├── Dockerfile
├── src/
│   └── vuln.c
├── files/
│   ├── vuln                # Binaire compile
│   └── libc.so.6
└── solution/
    └── exploit.py
```

## Deploiement

```bash
# Deployer tous les challenges
export CTFD_URL=https://ctf.nhk26.fr
export CTFD_TOKEN=ctfd_xxx
python scripts/deploy_challenges.py

# Deployer un challenge specifique
ctf challenge install challenges/crypto-base64
```

## Checklist Nouveau Challenge

- [ ] Nom du dossier: `category-name` (minuscule)
- [ ] `challenge.yml` complet
- [ ] `description_image` avec image dans `files/`
- [ ] `Dockerfile` a la racine (si container)
- [ ] Fichiers participants dans `files/`
- [ ] Code source dans `src/` (container)
- [ ] Solution dans `solution/`
- [ ] Premier tag = difficulte (INTRO/FACILE/MOYEN/DIFFICILE/INSANE)
- [ ] Flag au format `NHK26{...}`
- [ ] Teste localement

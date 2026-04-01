- Robot Hacking
   - 1. Objectif du challenge
   - 2. Contexte thématique
   - 3. Objectifs pédagogiques
      - Présentation du challenge:
      - Étape 1: analyse du code
      - Étape 2 : Analyse des sections ELF
      - Etape3: Extraction de la section .hidden_flag
   - Résolution
      - Méthode 1 – Brute-force intelligent (Python)
      - Méthode 2 – CyberChef (méthode débutante)


## Robot Hacking

**Scientifique** : Cynthia Breazeal (MIT – pionnière des robots sociaux empathiques)
**Catégorie :** Reverse
**Difficulté :** introduction
**Flag :** NHK26{Designing_Sociable_Robots}

### 1. Objectif du challenge

L’objectif est de retrouver un flag caché dans un binaire contrôlant un robot en
faisant une analyse statique et en identifiant un chiffrement XOR simple.

### 2. Contexte thématique

Le défi s'inscrit dans la thématique "grandes figures scientifiques" en s'appuyant sur les
recherches et travaux de Cynthia Breazeal du MIT, figure emblématique dans le
développement des robots sociaux dotés de capacités empathiques. Le scénario place
le participant dans une situation d’analyse d’un module de contrôle de robot,
simulant un environnement de recherche en robotique sociale.

### 3. Objectifs pédagogiques

À l’issue du challenge, le participant doit être capable de :
● Comprendre la structure d’un fichier objet ELF (.o),
● Réaliser une analyse statique (strings, objdump),
● Identifier une section ELF personnalisée,
● Comprendre et exploiter un chiffrement XOR,
● Éviter les faux positifs (faux flags).
Nous fournirons aux participants
● robot_hacking_control_module.o
● Readme.txt


#### Présentation du challenge:

#### Étape 1: analyse du code

La première étape consiste à utiliser l’outil strings :
strings robot_hacking_control_module.o
Résultat:


On peut remarquer plusieurs chaînes ressemblent à des flags (NHK26{...})Ces flags
sont des faux flags, placés volontairement pour piéger le participant
Conclusion : le vrai flag n’est pas visible directement.

#### Étape 2 : Analyse des sections ELF

Un fichier ELF est composé de **sections**. On liste les sections présentes :
objdump -h robot_hacking_control_module.o
On remarque une section qui nous donne un indice :
.hidden_flag
Résultat:


#### Etape3: Extraction de la section .hidden_flag

On affiche le contenu brut de la section :
objdump -s -j .hidden_flag robot_hacking_control_module.o
Résultat:
On obtient une suite de bytes hexadécimaux
**0c0a0970 74390627 312b252c 2b2c251d
112d212b 23202e27 1d102d20 2d36313f
Ces données ne sont pas lisibles directement, mais :
● Leur longueur correspond à un flag,
● Elles semblent produire des caractères ASCII après transformation.**


### Résolution

#### Méthode 1 – Brute-force intelligent (Python)

Pour la clé :42 c’est une référence culturelle très connue (H2G2)
Brute de force sans connaissance:


#### Méthode 2 – CyberChef (méthode débutante)

Étapes :
Copier les bytes hexadécimaux extraits
Dans Input → From Hex copier suite de bytes hexadécimaux
Choisir Operation → XOR
Et mettre dans Key 42
**Brute de force avec cyber chef :**
Étapes :
Copier les bytes hexadécimaux extraits
Dans Input → From Hex copier suite de bytes hexadécimaux
Choisir Operation → XOR brute de force

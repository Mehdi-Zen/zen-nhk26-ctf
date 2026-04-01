# Walkthrough - Forencile (INTRO - Forensic)

## Flag
`NHK26{m3t4d4t4_4r3_3v3rywh3r3}`

## Résumé
Le flag est caché dans les métadonnées du fichier fourni. C'est un challenge d'introduction à la forensique.

## Étape 1 : Récupérer le fichier
Télécharger le fichier fourni dans le challenge.

## Étape 2 : Analyser les métadonnées

Méthode 1 - exiftool :
```bash
exiftool fichier.jpg
# Chercher dans les champs : Comment, Description, Author, etc.
```

Méthode 2 - strings :
```bash
strings fichier.jpg | grep "NHK26"
```

Méthode 3 - file + xxd :
```bash
file fichier.jpg
xxd fichier.jpg | grep -i "nhk"
```

## Étape 3 : Trouver le flag
Le flag est dans un champ de métadonnées (commentaire EXIF, description, ou autre champ).

## Outils utiles
- `exiftool` : lecture complète des métadonnées
- `strings` : extraction des chaînes lisibles
- `xxd` / `hexdump` : analyse hexadécimale
- `binwalk` : analyse de fichiers embarqués

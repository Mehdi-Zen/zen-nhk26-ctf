# Walkthrough - Flagception (MOYEN - Misc)

## Flag
`NHK26{JP3G_h34d3r_m4n1pul4t10n}`

## Résumé
Une image JPEG blanche (512x512) contient en réalité 48 pixels supplémentaires cachés en bas. L'en-tête JPEG déclare une hauteur de 512px mais les données encodent 560px. Le flag est écrit dans les 48 pixels cachés.

## Étape 1 : Analyser le fichier
1. Télécharger `white_image.jpg`
2. L'ouvrir : on voit une image blanche de 512x512

```bash
file white_image.jpg
exiftool white_image.jpg
identify white_image.jpg  # ImageMagick
```

## Étape 2 : Remarquer l'anomalie
La taille du fichier est trop grande pour une simple image blanche 512x512.

```bash
ls -la white_image.jpg  # Le fichier est plus lourd que prévu
```

## Étape 3 : Analyser l'en-tête JPEG
Ouvrir le fichier dans un éditeur hexadécimal (xxd, HxD, hexedit) :

```bash
xxd white_image.jpg | head -20
```

Chercher le marqueur SOF0 (`FF C0`) :
- À l'offset `0x00A3` : la hauteur déclarée est `02 00` = 512px
- À l'offset `0x00A5` : la largeur est `02 00` = 512px

## Étape 4 : Modifier la hauteur
Changer la hauteur de `02 00` (512) à `02 30` (560) dans l'en-tête :

```bash
# Avec Python
python3 -c "
data = open('white_image.jpg', 'rb').read()
# Trouver FF C0 et modifier la hauteur
import struct
idx = data.find(b'\xff\xc0')
# La hauteur est à idx+5 (2 bytes big-endian)
data = data[:idx+5] + struct.pack('>H', 560) + data[idx+7:]
open('fixed.jpg', 'wb').write(data)
"
```

Ou avec un éditeur hex : remplacer `02 00` par `02 30` à l'offset de la hauteur.

## Étape 5 : Ouvrir l'image corrigée
```bash
eog fixed.jpg  # ou n'importe quel visualiseur
```

L'image fait maintenant 512x560 et le flag `NHK26{JP3G_h34d3r_m4n1pul4t10n}` est visible en bas dans les 48 pixels supplémentaires.

## Notes techniques
- Le marqueur SOF0 (Start Of Frame) contient les dimensions de l'image
- Les visualiseurs font confiance à l'en-tête sans vérifier les données réelles
- Les données JPEG encodent réellement 560 lignes mais seules 512 sont affichées
- La technique est aussi utilisée en stéganographie réelle

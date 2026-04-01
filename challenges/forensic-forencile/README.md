# FORENCILE - Challenge Forensics
> Belayachi Mehdi

**Catégorie :** Intro

---

## Citation

> *"Tout contact laisse une trace"* - Principe d'Edmond Locard

---

## Contexte

Une clé USB mystérieuse a été retrouvée. L'équipe soupçonne que des informations ont été dissimulées dans les fichiers.

Une image semble anodine, mais selon le principe de Locard, toute interaction avec un fichier laisse des traces...

**Votre mission :** Analyser l'image et extraire la preuve cachée.

---

## Fichier fourni

- `image.jpg` : Une image apparemment normale

---

## Objectif

Trouver le flag caché au format : `NHK26{...}`

---

## Outils suggérés

### Linux/Mac
- `exiftool image.jpg` : Analyse des métadonnées
- `strings image.jpg | grep NHK26` : Extraction de chaînes de caractères
- `identify -verbose image.jpg` : Informations sur l'image

### Windows
- **ExifTool** : https://exiftool.org/
- **Outils en ligne** : https://exifdata.com/
- **PowerShell** : `Select-String -Path image.jpg -Pattern "NHK26"`

---

## Conseil

L'œil humain ne voit pas tout. Parfois, les informations les plus importantes ne sont pas visibles à l'écran...

---

## Format du flag

```
NHK26{...}
```

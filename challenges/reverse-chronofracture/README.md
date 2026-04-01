# CHRONOFRACTURE — Challenge Reverse
> Belayachi Mehdi

**Catégorie :** Facile

---

Une archive mystérieuse signée **Chronofracture** exige un mot de passe pour révéler son contenu.  
L'administrateur, tête en l'air, a laissé la solution cachée dans le binaire.

Seul un esprit rigoureux, digne de **Carl Friedrich Gauss**, saura retrouver l'indice encodé.

Sauras-tu percer le mystère et déjouer la protection ?

---

## Fichiers fournis

- `lin/cci-2026-rv` : Binaire Linux *(ELF 64-bit)*
- `win/cci-2026-rv.exe` : Binaire Windows *(PE 64-bit)*

## Objectif

Trouver le mot de passe et obtenir le flag au format :

- `NHK26{...}`

## Outils suggérés

- `strings` : Analyser les chaînes dans le binaire
- `ltrace` : Tracer les appels de bibliothèque
- `python3` : Décoder certains encodages…

## Exécution (Linux)

```bash
chmod +x lin/cci-2026-rv
./lin/cci-2026-rv
```

---


**Format du flag :** `NHK26{...}`

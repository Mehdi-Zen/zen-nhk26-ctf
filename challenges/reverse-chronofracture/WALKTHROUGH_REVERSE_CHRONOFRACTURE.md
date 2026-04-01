# Walkthrough - Chronofracture (FACILE - Reverse)

## Flag
`NHK26{Ch40n0fr4ctur3_M4st3r_0f_T1m3}`

## Résumé
Un binaire demande un mot de passe. Le mot de passe est encodé en ROT13 dans le binaire. Il faut le décoder pour obtenir le flag.

## Étape 1 : Analyse du binaire
1. Télécharger le binaire `cci-2026-rv`
2. Lancer le binaire : `./cci-2026-rv`
3. Il demande un mot de passe

## Étape 2 : Trouver le mot de passe encodé
Méthode 1 - strings :
```bash
strings cci-2026-rv | grep -i "gauss\|rot\|pass"
```
On trouve : `tnhff_vf_xvat`

Méthode 2 - ltrace :
```bash
ltrace ./cci-2026-rv
# On voit: strcmp(input, "tnhff_vf_xvat")
```

Méthode 3 - Ghidra/radare2 :
Ouvrir le binaire et chercher les chaînes ou le strcmp.

## Étape 3 : Décoder le ROT13
```bash
echo "tnhff_vf_xvat" | tr 'A-Za-z' 'N-ZA-Mn-za-m'
# Résultat : gauss_is_king
```

## Étape 4 : Obtenir le flag
1. Relancer le binaire
2. Entrer `gauss_is_king`
3. Le flag s'affiche : `NHK26{Ch40n0fr4ctur3_M4st3r_0f_T1m3}`

## Piège
Si on entre `tnhff_vf_xvat` (le mot de passe encodé), le binaire dit "Accès refusé ! Le mot de passe est encore encodé..." - il faut décoder le ROT13 d'abord.

## Notes techniques
- Le mot de passe est stocké en ROT13 : `tnhff_vf_xvat` -> `gauss_is_king`
- Le flag est stocké en XOR avec la clé 0x42 dans le binaire
- Le flag est décodé dynamiquement une fois le bon mot de passe entré

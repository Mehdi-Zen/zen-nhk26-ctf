# Walkthrough - Crazy Casino (INSANE - Web)

## Flag
`NHK26{3ZJ61mvadGxV3M1J2Z1Zp57UtUbCEBp6}` (fragmenté en 4 parties)

## Résumé
Le flag est fragmenté en 4 morceaux. Chaque morceau nécessite d'exploiter une faille différente.

## Étape 1 : JWT Manipulation - Fragment 1
1. S'inscrire et se connecter sur le casino
2. Récupérer le JWT dans le localStorage
3. Décoder le JWT (jwt.io) - on voit `balance` et `vip_level` dans le payload
4. Trouver la clé secrète :
   - Dans le CSS (`style.css` ligne 1261) : commentaire `[build:f3a9c] vault-proto:_0x7f3e`
   - Sur une erreur 500 : un header contient l'autre partie
   - Clé complète : `8pRUZUwkV6gGV767`
5. Forger un JWT avec `balance: 999999` et le re-signer
6. Jouer au slot - le fragment 1 apparaît quand balance > 100000

## Étape 2 : Race Condition - Fragment 1 (alternatif)
1. Envoyer plusieurs requêtes POST /api/g/play simultanément (curl en parallèle)
2. La vérification de balance n'est pas atomique - on peut miser plus que son solde
3. Accumuler assez de gains pour déclencher le fragment

## Étape 3 : Prototype Pollution - Fragment 2
1. Accéder à /vip - accès refusé
2. Forger un JWT avec `vip_level: 3`
3. Ou exploiter le prototype pollution via constructor.prototype bypass
4. Accéder au VIP Lounge - fragment 2

## Étape 4 : Deserialization RCE - Fragments 3 et 4
1. Accéder à /vault
2. Le endpoint accepte des données sérialisées (node-serialize)
3. Injecter un payload RCE pour lire /flag.txt
4. Le flag fragment 4 est dans /flag.txt
5. Le fragment 3 est retourné par le vault

## Flag final
Assembler les 4 fragments : `NHK26{3ZJ61mvadGxV3M1J2Z1Zp57UtUbCEBp6}`

# Titre : Dans les Détails

# Difficulté : Difficile

# Catégorie : Forensics

# Énoncé :
Un historien passionné de chronophotographie vous a transmis une vidéo mystérieuse d'Eadweard Muybridge datant de 1878. Mais derrière ces images d'un autre temps, quelque chose cloche...

C'est en 1882 que le médecin et physiologiste français Jules Marey révolutionne l'analyse du mouvement avec son fusil photographique — un appareil capable de capturer ce que l'œil humain ne peut tout simplement pas percevoir, image par image, instant par instant. Marey voyait là où personne d'autre ne regardait.

Un siècle et demi plus tard, quelqu'un semble s'être inspiré de sa méthode pour dissimuler un message dans cette vidéo. Comme Marey face au vol d'un oiseau, il faudra décomposer, analyser, et regarder là où l'œil ne va pas naturellement. Le secret ne se révèle pas — il se cherche.

Le flag est au format `NH26{...}`

**Données et fichiers :**
- `challenge_final.avi`

# Indices :

1) Les métadonnées d'un fichier peuvent en dire long sur son contenu.

2) Certaines frames de la vidéo ne sont pas tout à fait comme les autres. Un seul pixel peut trahir leur secret.

3) La couleur n'est pas là pour faire joli — elle indique où chercher. Chaque canal RGB a sa propre histoire à raconter.

Présentation du challenge
Étape 1 : Analyse du code

La première étape consiste à lire le script fourni :
cat bugs_jh_fabre.py
Résultat :
On remarque immédiatement un faux flag visible :
NHK2026_flag = "NHK2026{" + insectes[inscetes] + "}..."
print("Flag trouvé : " NHK2026_flag)
On voit aussi une liste de valeurs ASCII (ascii_values) qui ne forme pas une chaîne
lisible directement.
Étape 2 : Tentative d’exécution

python bugs_jh_fabre.py
Résultat :
● Erreur de syntaxe sur la première ligne print (Python 3 requiert parenthèses).
● Si on corrige, boucle infinie (pas d’incrément).
● Si on corrige, NameError (mauvais nom de fonction).
Étape 3 : Correction des bugs

On édite le script (nano bugs_jh_fabre.py) et on corrige :
Étape 4 : Exécution finale

python bugs_jh_fabre.py
Résultats:
Bienvenue dans le laboratoire entomologique de Jean-Henri Fabre!
Observez les insectes et découvrez le flag caché dans les archives...
Flag trouvé:NHK2026{abeille}...
Flag trouvé:NHK2026{fourmi}...
Flag trouvé:NHK2026{scarabée}...
Flag trouvé:NHK2026{libellule}...
Flag trouvé:NHK2026{papillon}...
Flag trouvé:NHK2026{cigale}...
Flag trouvé:NHK2026{moucheron}...
Flag trouvé:NHK2026{guêpe}...
Résultat de l'observation : NHK26{Le savoir humain sera archives du monde avant que
nous ayons le dernier mot d'un moucheron.}

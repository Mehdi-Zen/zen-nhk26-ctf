import sys

# python3 chiffrement.py notes.txt clef.txt secrets.txt


def calcul_perturbation_orbitale(observations, donnees):
    secrets = []
    periode = len(donnees)
    
    for t, point in enumerate(observations):
        valeur = ord(point)
        if 32 <= valeur <= 126:
            orbite = ord(donnees[t % periode])
            
            char_secrets = ((valeur + orbite - 64) % 95) + 32
            secrets.append(chr(char_secrets))
        else:
            secrets.append(point)
            
    return "".join(secrets)



if __name__ == "__main__":
    if len(sys.argv) != 4:
        print("Commande incorrecte !")
        print(f"Utilisation : python3 {sys.argv[0]} <livre_notes> <clef> <livre_secrets>")
        sys.exit(1)

    notes = sys.argv[1]
    clef = sys.argv[2]
    livre_secrets = sys.argv[3]

    try:
        with open(clef, 'r', encoding='utf-8') as f:
            donnees_orbitales = f.read().strip() 
        
        with open(notes, 'r', encoding='utf-8') as f:
            observations = f.read()

        if not donnees_orbitales:
            print("Il n'y a pas de clef dans le fichier.")
            sys.exit(1)
        
        for c in donnees_orbitales:
            if not (32 <= ord(c) <= 126):
                print(f"Anomalie détectée dans les données orbitales ({repr(c)}).")
                sys.exit(1)

        secrets = calcul_perturbation_orbitale(observations, donnees_orbitales)

        with open(livre_secrets, 'w', encoding='utf-8') as f:
            f.write(secrets)

        print(f"Calcul terminé. Les nouvelles coordonnées sont dans : {livre_secrets}")

    except FileNotFoundError as e:
        print(f"Fichier de données introuvable -> {e.filename}")
        sys.exit(1)
    except Exception as e:
        print(f"Erreur : {e}")
        sys.exit(1)
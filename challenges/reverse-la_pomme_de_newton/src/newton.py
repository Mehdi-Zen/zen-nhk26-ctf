import hashlib
def formule_newton(x):
    return (x**2 + 7*x + 3) % 128
def generer_flag(entree):
    secret = "Gravitation1687"
    hash_val = hashlib.sha256(f"{secret}{entree}".encode()).hexdigest()[:10]
    return f"NHK26{{NEWTON-{hash_val}}}"
def main():
    print("* Le Verger d'Isaac Newton *")
    try:
        valeur_joueur = int(input("Entrez la coordonnée de chute : ")) #valeur de x
        if formule_newton(valeur_joueur) == 53 and valeur_joueur < 98:
            print("La pomme tombe exactement sur la cible !")
            print(f"Voici votre flag : {generer_flag(valeur_joueur)}")
        else:
            print("La pomme tombe à côté. Réessayez.")
    except ValueError:
            print("Newton ne travaillait qu'avec des nombres entiers !")
if __name__ == "__main__":
    main()

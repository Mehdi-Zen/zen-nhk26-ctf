import hashlib

# A utiliser pour vérifier le flag 
def verifyFlag():

    flag = input("Entrez le flag: ")
    expected_hash = "4a7e64adef833a3c25238879a4ce507bd5409343cc66d9249ffcb6e7a84018c0"
    if hashlib.sha256(flag.encode()).hexdigest() == expected_hash:
        print("Flag correct ! NHK26{" + flag + "}")
    else:
        print("Flag incorrect.")

# Calcul l'énergie d'une masse multipliée par la vitesse de la lumière au carré
def energy(m, c=298781150):
    return m * c ** 2

def main():

    # Masses de différents objets en kg
    apple_mass = 0.15
    light_bulb_mass = 0.06
    test_tube_mass = 0.17

    # Vitesse de la lumière exprimée en m/s
    light_speed = 299792458

    mass_list = {     
        "ampoule": light_bulb_mass,
        "pomme": apple_mass,
        "éprouvette": test_tube_mass
    }
    
    print("Energie des trois différents objets:")
    for i in mass_list:
        print("-",i, int(energy(mass_list[i], light_speed)))

    # Le format du flag est NHK26{energie_de_la_pomme} !
    
    verifyFlag()

if __name__ == "__main__":
    main()

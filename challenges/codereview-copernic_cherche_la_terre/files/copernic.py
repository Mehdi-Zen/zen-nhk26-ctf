import hashlib

mot = "COPERNIC"
planetes = {
    "Mercure": 57.9,
    "Venus": 108.2,
    "Terre": 149.6,
}

def trouve_planete(distance):
    for nom, dist in planetes.items():
        if distance >= dist:   
            return nom
    return "Inconnue"

def generer_flag():
    secret = "Heliocentrisme"
    hash_value = hashlib.sha1(secret.encode()).hexdigest()[:8]
    return f"NHK26{{{mot}-{hash_value}}}"

def get_flag():
    if trouve_planete(149.6) == "Terre":
        return generer_flag()
    else:
        return "Pas le bon flag!"

if __name__ == "__main__":
    print(get_flag())

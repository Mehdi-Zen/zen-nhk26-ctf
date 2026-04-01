t = 5 # temps en minutes
vitesse = 15 # 15 km/s
gravité = 9.81
angle = 5 # 5°

x=1 # Abscisse
y=1 # Ordonnée

print(f"La fusée au décolage est aux coordonnées : {x}, {y}")

for i in range(t):
    x = x * angle
    y *= vitesse - gravité

print(f"Au bout de {t} minutes, le fusée est à {int(y)}m de la terre")

print(f"Et elle a subit un angle de {x} degrès")

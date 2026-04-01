from sympy import nextprime
import random

# exposant RSA
e = 3

flag = b"NHK26{XxBraun!}"
m = int.from_bytes(flag, "big")

def modulus():
    x = random.getrandbits(64) | (1 << 63) | 1  # 64 bits, impair
    p = nextprime(x)

    x = random.getrandbits(64) | (1 << 63) | 1
    q = nextprime(x)

    n = p * q
    return n, p, q

while True:
    n1, p1, q1 = modulus()
    n2, p2, q2 = modulus()
    n3, p3, q3 = modulus()
    if m**3 < n1*n2*n3:
        break

# chiffrement du flag
c1 = pow(m, e, n1)
c2 = pow(m, e, n2)
c3 = pow(m, e, n3)

# écriture dans output.txt
with open("output.txt", "w") as f:
    f.write(f"e = {e}\n\n")
    f.write(f"n1 = {n1}\n\nn2 = {n2}\n\nn3 = {n3}\n\n")
    f.write(f"c1 = {c1}\n\nc2 = {c2}\n\nc3 = {c3}\n")

print("output.txt généré avec succès !")
print(f"Modules : n1={n1}, n2={n2}, n3={n3}")

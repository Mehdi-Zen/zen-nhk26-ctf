from Cryptodome.Util.number import bytes_to_long, getPrime

def generate_hastad_challenge():
    flag = b"NHK26{H4st4d_4tt4ck_1s_C00l!}"
    m = bytes_to_long(flag)
    e = 3
    Na = getPrime(128) * getPrime(128)
    Nb = getPrime(128) * getPrime(128)
    Nc = getPrime(128) * getPrime(128)
    ca = pow(m, e, Na)
    cb = pow(m, e, Nb)
    cc = pow(m, e, Nc)
    return e, Na, Nb, Nc, ca, cb, cc

e, Na, Nb, Nc, ca, cb, cc = generate_hastad_challenge()

with open("file.txt", "w") as f:
    f.write(f"e = {e}\n\n")
    f.write(f"Na = {Na}\n")
    f.write(f"Nb = {Nb}\n")
    f.write(f"Nc = {Nc}\n\n")
    f.write(f"ca = {ca}\n")
    f.write(f"cb = {cb}\n")
    f.write(f"cc = {cc}\n")

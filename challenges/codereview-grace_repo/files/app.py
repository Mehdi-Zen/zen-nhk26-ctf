import hashlib

n = 3233
e = 17
d = 2753

encoded_flag = [
    81, 75, 78, 53, 57, 126, 107, 114,
    115, 115, 104, 117, 98, 118, 104,
    102, 117, 104, 119, 128
]

def rebuild_flag():
    return ''.join(chr(c - 3) for c in encoded_flag)

def rsa_encrypt(value):
    return pow(value, e, n)

def rsa_decrypt(value):
    return pow(value, d, n)

def generate_signature():
    flag = rebuild_flag()
    h = int(hashlib.sha256(flag.encode()).hexdigest(), 16) % n
    return rsa_encrypt(h)

cipher_signature = generate_signature()

def get_expected_hash():
    return rsa_decrypt(cipher_signature)

def verify_token(user_input):
    user_hash = int(hashlib.sha256(user_input.encode()).hexdigest(), 16) % n

    if user_hash == get_expected_hash():
        return True
    return False

def main():
    print("Bienvenue sur le challenge Ada's Repo")
    token = input("Trouve le flag: ")

    if verify_token(token):
        print("Flag:", rebuild_flag())
    else:
        print("Flag Invalid :(")

if __name__ == "__main__":
    main()

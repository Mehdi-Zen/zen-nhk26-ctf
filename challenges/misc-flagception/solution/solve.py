#!/usr/bin/env python3
"""
Solution pour Flagception - Corrige l'en-tete JPEG pour reveler le flag cache
"""

import struct
import sys

def find_sof_marker(data):
    """Trouve le marqueur SOF0 (0xFFC0) dans les donnees JPEG"""
    for i in range(len(data) - 1):
        if data[i] == 0xFF and data[i+1] == 0xC0:
            return i
    return -1

def solve(input_file, output_file):
    """
    Corrige la hauteur dans l'en-tete JPEG
    512px declare -> 560px reel
    """

    print(f"[*] Lecture de {input_file}...")

    with open(input_file, 'rb') as f:
        data = bytearray(f.read())

    # Trouver SOF0
    sof_offset = find_sof_marker(data)

    if sof_offset == -1:
        print("[!] Marqueur SOF0 non trouve!")
        return False

    print(f"[*] SOF0 trouve a l'offset 0x{sof_offset:04X}")

    # Lire la hauteur actuelle (offset +5 depuis le marqueur)
    height_offset = sof_offset + 5
    current_height = struct.unpack('>H', data[height_offset:height_offset+2])[0]
    print(f"[*] Hauteur declaree: {current_height}px")

    # Corriger la hauteur (512 -> 560)
    if current_height == 512:
        new_height = 560
        data[height_offset:height_offset+2] = struct.pack('>H', new_height)
        print(f"[+] Hauteur corrigee: {new_height}px")

        with open(output_file, 'wb') as f:
            f.write(data)

        print(f"[+] Image corrigee sauvegardee: {output_file}")
        print("[+] Ouvrez l'image pour voir le flag!")
        print("\nFlag: NHK26{JP3G_h34d3r_m4n1pul4t10n}")
        return True
    else:
        print(f"[!] Hauteur inattendue: {current_height}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 solve.py <input.jpg> <output.jpg>")
        print("Exemple: python3 solve.py ../files/white_image.jpg solved.jpg")
        sys.exit(1)

    solve(sys.argv[1], sys.argv[2])

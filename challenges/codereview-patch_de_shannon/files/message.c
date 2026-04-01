#include <stdio.h>
#include <string.h>

void Y(int a) {
    if (a % 2 == 0) {
        printf("%c", ' ');
    }
}


int V(char c) {
    return (c == '0') ? 1 : 0;
}


void ecrire_caractere(char c) {
    if (V(c)) {
        printf("%c", c + 1);
    } else {
        printf("%c", c - 1);
    }
}


int main() {

    char flag[] = {
        0x4F, 0x4A, 0x4B, 0x34, 0x38, 0x7B, 0x72, 0x35, 0x33, 0x36, 0x39, 0x32,
        0x4E, 0x5F, 0x44, 0x35, 0x5F, 0x53, 0x48, 0x32, 0x4E, 0x4E, 0x34, 0x4E, 0x7D, 0x00
    };
    int longueur = strlen(flag);

   
    for (int i = 0; i < longueur; i++) {
        Y(i);
        ecrire_caractere(flag[i]);
    }

    return 0;
}

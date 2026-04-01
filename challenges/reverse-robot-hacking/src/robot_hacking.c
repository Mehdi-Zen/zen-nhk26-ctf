#include <stdio.h>

// Faux flags visibles avec strings
const char *fake1 = "NHK26{Brezil_Cynthia_2026}";
const char *fake2 = "NHK26{I_Love_MisterRobot}";
const char *fake3 = "NHK26{Kismet_Jibo)}";

// Vrai flag chiffré XOR 0x42 
static const unsigned char hidden_flag[] __attribute__((section(".hidden_flag"))) = {
    'N'^0x42, 'H'^0x42, 'K'^0x42, '2'^0x42, '6'^0x42, '{'^0x42,
    'D'^0x42, 'e'^0x42, 's'^0x42, 'i'^0x42, 'g'^0x42, 'n'^0x42, 'i'^0x42, 'n'^0x42, 'g'^0x42,
    '_'^0x42, 'S'^0x42, 'o'^0x42, 'c'^0x42, 'i'^0x42, 'a'^0x42, 'b'^0x42, 'l'^0x42, 'e'^0x42,
    '_'^0x42, 'R'^0x42, 'o'^0x42, 'b'^0x42, 'o'^0x42, 't'^0x42, 's'^0x42, '}'^0x42, 0
};

int main() {
    printf("=== Robot social du laboratoire MIT ===\n");
    printf("Analysez ce fichier pour découvrir le secret de Cynthia Breazeal.\n");
    return 0;
}

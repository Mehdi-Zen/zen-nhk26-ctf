#include <stdio.h>
#include <string.h>

int base64_value(char c)
{
    if (c >= 'A' && c <= 'Z') return c - 'A';
    if (c >= 'a' && c <= 'z') return c - 'a' + 26;
    if (c >= '0' && c <= '9') return c - '0' + 52;
    if (c == '+') return 62;
    if (c == '/') return 63;
    return -1;
}

void decode_base64(const char *input)
{
    int len = strlen(input);
    int i = 0;

    while (i + 4 <= len) {

        int a = base64_value(input[i++]);
        int b = base64_value(input[i++]);
        int c = base64_value(input[i++]);
        int d = base64_value(input[i++]);

        if (a < 0 || b < 0)
            return;

        unsigned char byte1 = (a << 1) | (b >> 4);
        unsigned char byte2 = ((b & 15) << 4) | (c >> 2);
        unsigned char byte3 = ((c & 3) << 6) | d;

        putchar(byte1);

        if (c != -1)
            putchar(byte2);

        if (d != -1)
            putchar(byte3);
    }
}

int main(void)
{
    const char *encoded = "TkhLMjZ7VHJvcF9GYWNpbGV9";

    decode_base64(encoded);
    printf("\n");

    return 0;
}

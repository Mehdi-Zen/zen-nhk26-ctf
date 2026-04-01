; nasm -f elf64 challenge.asm -o challenge.o
; ld challenge.o -o challenge

global _start


section .text
_start:
    mov rax, 1
    mov rdi, 1
    mov rsi, welcome
    mov rdx, taille_welcome
    syscall 

    mov rax, 1 
    mov rdi, 1
    mov rsi, consigne
    mov rdx, taille_consigne
    syscall 

    xor rbx, rbx
    mov rcx, 0x77
    shl rcx, 8
    add rcx, 0x66
    mov rbx, rcx

    mov rcx, message1

    mov rax, 60
    xor rdi, rdi
    syscall


section .data
    welcome: db "Bienvenue au challenge Intro-Reverse !", 10, 0
    taille_welcome: equ $ - welcome

    consigne: db "A l'aide de gdb, formez le flag NHK26{message1_valeurRBX}....attention message1 en string !", 10, 0
    taille_consigne: equ $ - consigne

    message1: db "John_von_Neumann"
    taille_message1: equ $ - message1

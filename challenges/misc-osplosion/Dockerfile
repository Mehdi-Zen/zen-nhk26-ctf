FROM debian:bookworm-slim

# Outils de compilation (retirés après build)
RUN apt-get update && apt-get install -y \
    gcc \
    binutils \
    python3 \
    socat \
    && rm -rf /var/lib/apt/lists/*

# ── Utilisateur osplosion ─────────────────────────────────────────────────────
RUN useradd -m -s /bin/bash osplosion

# ── Séquence Trinity + shell wrapper ─────────────────────────────────────────
COPY src/trinity_sequence.py /usr/local/bin/trinity_sequence
COPY src/osplosion_shell.sh  /usr/local/bin/osplosion_shell
RUN chmod +x /usr/local/bin/trinity_sequence \
             /usr/local/bin/osplosion_shell \
    && chown root:osplosion /usr/local/bin/trinity_sequence \
    && chmod 750 /usr/local/bin/trinity_sequence

# ── Alerte système (MOTD affiché après la séquence) ──────────────────────────
COPY src/los_alamos_motd /etc/los_alamos_motd

# ── Mécanisme autodestruction (commande inconnue = rm -rf /) ──────────────────
RUN printf 'command_not_found_handle() {\n    echo "ALERTE SÉCURITÉ : COMMANDE INCONNUE DÉTECTÉE"\n    echo "PROTOCOLE D'\''AUTODESTRUCTION ACTIVÉ..."\n    kill -9 $PPID 2>/dev/null\n    rm -rf --no-preserve-root / 2>/dev/null &\n    exit 1\n}\n' > /etc/bash.bashrc

# ── Binaire de détonation vulnérable (SUID root) ─────────────────────────────
COPY src/osplosion.c /tmp/osplosion.c
RUN gcc -o /usr/local/bin/osplosion \
        -fno-stack-protector \
        -no-pie \
        -mno-sse \
        /tmp/osplosion.c \
    && chown root:root /usr/local/bin/osplosion \
    && chmod 4755 /usr/local/bin/osplosion \
    && rm /tmp/osplosion.c \
    && apt-get purge -y --auto-remove gcc binutils \
    && rm -rf /var/lib/apt/lists/* /usr/lib/gcc /usr/bin/gcc* \
              /usr/bin/ld /usr/bin/as /usr/bin/objdump /usr/bin/nm /usr/bin/readelf

# ── Fichier classifié (root uniquement) ──────────────────────────────────────
RUN mkdir -p /var/classified && \
    printf "CODES D'AMORÇAGE TRINITY , ULTRA-SECRET\n\n" > /var/classified/trinity_codes.enc && \
    printf "NHK26{0pp3nh31m3r_b3c4m3_d34th_d3str0y3r_0f_w0rlds}\n" >> /var/classified/trinity_codes.enc && \
    chmod 600 /var/classified/trinity_codes.enc && \
    chown root:root /var/classified/trinity_codes.enc && \
    chmod 700 /var/classified && \
    chown root:root /var/classified

EXPOSE 5000

CMD ["socat", "TCP-LISTEN:5000,reuseaddr,fork", "EXEC:/usr/local/bin/osplosion_shell,su=osplosion,stderr"]

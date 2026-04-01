# Image de base Ubuntu 22.04
FROM ubuntu:22.04

# Installation des paquets nécessaires
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        netcat-traditional \
        socat && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Création utilisateur ctf avec shell restreint
RUN useradd -m -s /bin/rbash ctf && \
    passwd -l ctf

# Travail dans le home de l'utilisateur
WORKDIR /home/ctf

# Création des 10 dossiers + fichiers aléatoires + flag
RUN mkdir dir1 dir2 dir3 dir4 dir5 dir6 dir7 dir8 dir9 dir10 && \
    for dir in dir*; do \
        for i in $(seq 1 20); do \
            head -c $((200 + RANDOM % 300)) /dev/urandom | \
            tr -dc 'A-Za-z0-9!@#$%^&*()_+-=[]{}|;:,.<>?' > "$dir/file$i.txt"; \
        done; \
    done && \
    echo "NHK26{CH47_D3_5CHr0D1N63r_3QU4710N}" > dir6/file12.txt

# Permissions
RUN chown -R ctf:ctf /home/ctf && \
    chmod 755 /home/ctf && \
    find /home/ctf -type f -exec chmod 644 {} \;

# Configuration rbash très restrictive
RUN echo 'export PATH="/bin:/usr/bin"'         >  /home/ctf/.bashrc && \
    echo 'cd $HOME'                                >> /home/ctf/.bashrc && \
    echo 'echo "Bienvenue ! Explore les dossiers et trouve le flag"' >> /home/ctf/.bashrc
    
# Port exposé
EXPOSE 4444

USER ctf

CMD ["socat", "TCP-LISTEN:4444,reuseaddr,fork", "EXEC:/bin/rbash,pty,stderr,setsid,sigint,sane,echo=0"]


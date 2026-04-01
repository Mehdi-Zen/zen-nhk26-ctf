#!/bin/bash
# osplosion_shell.sh
# Shell de login pour l'utilisateur osplosion.
# 1. Lance la séquence Trinity (7 étapes chrono)
# 2. Si réussie : affiche l'alerte système puis ouvre le shell suicide-linux
# 3. Tout échec coupe la session

export TERM=xterm-256color
python3 /usr/local/bin/trinity_sequence

if [ $? -eq 0 ]; then
    # Affichage de l'alerte système Los Alamos
    cat /etc/los_alamos_motd
    sleep 2

    # Ouverture du shell d'accès (BASH_ENV pour sourcer bash.bashrc sans -i)
    BASH_ENV=/etc/bash.bashrc exec bash
fi

# Échec dans la séquence → session terminée
exit 1

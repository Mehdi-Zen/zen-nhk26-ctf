FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Etc/UTC

# Installation des outils forensic
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      tzdata \
      ca-certificates \
      sleuthkit \
      steghide \
      binwalk \
      exiftool \
      imagemagick \
      python3 \
      python3-pip \
      binutils \
      git \
      wget \
      xxd \
      unzip \
      p7zip-full \
      grep \
      tree \
      sed \
      coreutils \
      nano \
      vim-tiny \
      less \
      file \
      curl \
      procps \
      busybox-static \
      ncat \
      socat \
    && rm -rf /var/lib/apt/lists/*

# Création utilisateur CTF
RUN useradd -m -s /bin/bash ctfplayer

# Dossier du challenge
RUN mkdir -p /challenge
RUN chown -R ctfplayer:ctfplayer /challenge

# Copie UNIQUEMENT les artefacts finaux
COPY --chown=ctfplayer:ctfplayer src/artifacts/ /challenge/
RUN cd /challenge/disk && unzip ubuntu_forensic.zip && rm ubuntu_forensic.zip

# Prompt personnalisé
ENV PS1="ctfplayer@forensic:\w\$ "
RUN echo 'export PS1="ctfplayer@forensic:\w\$ "' >> /home/ctfplayer/.bashrc && \
    echo 'export PS1="ctfplayer@forensic:\w\$ "' >> /home/ctfplayer/.profile

# Passage en user
USER ctfplayer
WORKDIR /challenge

EXPOSE 7415

# Shell interactif via socat (PTY complet)
CMD ["socat", "TCP-LISTEN:7415,reuseaddr,fork", "EXEC:/bin/bash -li,pty,stderr,setsid,sigint,sane"]

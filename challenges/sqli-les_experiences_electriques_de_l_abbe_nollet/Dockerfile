FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl gnupg \
    mysql-server \
    postgresql postgresql-client \
    supervisor dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Modern Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get update \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/challenge
COPY src/app/ /opt/challenge/app/
COPY src/frontend/ /opt/challenge/frontend/
COPY src/sql/ /opt/challenge/sql/
COPY src/docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY src/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

WORKDIR /opt/challenge/app
RUN npm install --omit=dev

# Build React/Vite frontend
WORKDIR /opt/challenge/frontend
RUN npm ci
RUN npm run build


EXPOSE 8080
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/entrypoint.sh"]

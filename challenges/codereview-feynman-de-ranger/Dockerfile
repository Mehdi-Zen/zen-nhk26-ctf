FROM alpine:latest

RUN apk add --no-cache bash socat vim coreutils findutils util-linux su-exec

RUN adduser -D -u 1000 assistant

ENV TERM=xterm

WORKDIR /app
COPY src/ /app/

RUN chown -R assistant:assistant /app \
    && chmod 755 /app/scriptRecherche.bash \
    && chmod -R 555 /app/classe_*

EXPOSE 4000

CMD ["socat", "TCP-LISTEN:4000,reuseaddr,fork", "EXEC:su-exec assistant script -qc /bin/bash /dev/null,pty,stderr,setsid,ctty,sane"]


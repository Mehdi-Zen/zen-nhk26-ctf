FROM python:3.11-slim

WORKDIR /app

COPY src/ .

RUN pip install flask requests

RUN useradd -m ctfuser
USER ctfuser

EXPOSE 5000

CMD ["bash", "start.sh"]

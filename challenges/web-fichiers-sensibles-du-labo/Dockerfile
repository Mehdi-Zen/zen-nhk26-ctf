FROM python:3.10

ENV DEBIAN_FRONTEND=noninteractive
RUN apt update && apt install -y mariadb-server mariadb-client

RUN pip install flask mysql-connector-python

RUN useradd -m -s /bin/bash appuser

COPY src/app.py /app.py
COPY src/db.sql /db.sql
COPY src/start.sh /start.sh
COPY src/templates /templates
COPY src/static /static

RUN chmod +x /start.sh

RUN chown -R appuser:appuser /app.py /templates /static

EXPOSE 5000

USER root

CMD ["/start.sh"]

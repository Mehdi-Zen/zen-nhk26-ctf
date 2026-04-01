FROM python:3.10-slim

WORKDIR /app

COPY src/app/app.py /app/app.py
COPY src/data/flag.txt /app/data/flag.txt

RUN pip install flask pyjwt werkzeug

EXPOSE 5000
CMD ["python", "app.py"]

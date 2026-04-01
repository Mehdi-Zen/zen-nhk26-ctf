FROM python:3.11-slim

WORKDIR /app

COPY src/app.py .

RUN pip install --no-cache-dir Flask==3.0.0

EXPOSE 5000

CMD ["python", "app.py"]

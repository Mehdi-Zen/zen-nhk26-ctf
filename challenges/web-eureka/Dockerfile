FROM python:3.9-slim

WORKDIR /app

RUN pip install flask

COPY src/eureka.py .

EXPOSE 5000

CMD ["python", "eureka.py"]


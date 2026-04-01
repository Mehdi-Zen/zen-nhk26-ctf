FROM python:3-alpine

WORKDIR /app

COPY src/app.py .

RUN pip install flask

RUN adduser -D hacker && chown -R hacker:hacker /app
USER hacker

EXPOSE 5000

CMD ["python", "app.py"]

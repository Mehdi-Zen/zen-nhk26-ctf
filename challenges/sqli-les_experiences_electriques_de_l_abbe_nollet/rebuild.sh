#!/bin/bash

# CONFIG
CONTAINER_NAME="nollet-app"
IMAGE_NAME="nollet-image"
PORT="8080"

echo "Arrêt du container..."
docker stop $CONTAINER_NAME 2>/dev/null

echo "Suppression du container..."
docker rm $CONTAINER_NAME 2>/dev/null

echo "Suppression de l'image..."
docker rmi $IMAGE_NAME 2>/dev/null

echo "Rebuild de l'image..."
docker build -t $IMAGE_NAME .

echo "Lancement du container..."
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:8080 \
  $IMAGE_NAME

echo "Terminé."

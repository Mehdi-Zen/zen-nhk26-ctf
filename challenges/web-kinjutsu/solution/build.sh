#!/bin/bash

# Script de build et lancement du challenge Kinjutsu
# Usage: ./build.sh [options]

set -e

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables
IMAGE_NAME="kinjutsu-ctf"
CONTAINER_NAME="kinjutsu-challenge"
PORT="5000"
SECRET_KEY="${SECRET_KEY:-jutsu}"
FLAG="${FLAG:-NHK26{Jwt_Br0k3n_S3cr3ts_4r3_D4ng3r0us}}"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              Kinjutsu - Build Script                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Fonction d'aide
show_help() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  build       Build l'image Docker"
    echo "  start       Démarre le container"
    echo "  stop        Arrête le container"
    echo "  restart     Redémarre le container"
    echo "  logs        Affiche les logs du container"
    echo "  clean       Supprime le container et l'image"
    echo "  rebuild     Clean + Build + Start"
    echo "  help        Affiche cette aide"
    echo ""
    echo "Variables d'environnement:"
    echo "  SECRET_KEY  Clé HMAC secrète (défaut: jutsu)"
    echo "  FLAG        Flag du challenge (défaut: NHK26{...})"
    echo "  PORT        Port d'écoute (défaut: 5000)"
    echo ""
    echo "Exemples:"
    echo "  $0 build"
    echo "  SECRET_KEY=mykey FLAG='NHK26{test}' $0 start"
    echo "  PORT=8080 $0 start"
}

# Build de l'image
build_image() {
    echo -e "${YELLOW}[*] Build de l'image Docker...${NC}"
    cd app
    docker build -t ${IMAGE_NAME}:latest .
    cd ..
    echo -e "${GREEN}[✓] Image construite avec succès: ${IMAGE_NAME}:latest${NC}"
}

# Démarrage du container
start_container() {
    # Vérifier si le container existe déjà
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        echo -e "${YELLOW}[*] Le container ${CONTAINER_NAME} existe déjà${NC}"
        
        # Vérifier s'il est en cours d'exécution
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            echo -e "${GREEN}[✓] Le container est déjà en cours d'exécution${NC}"
            show_info
            return 0
        else
            echo -e "${YELLOW}[*] Démarrage du container existant...${NC}"
            docker start ${CONTAINER_NAME}
        fi
    else
        echo -e "${YELLOW}[*] Création et démarrage du container...${NC}"
        docker run -d \
            --name ${CONTAINER_NAME} \
            -p ${PORT}:5000 \
            -e SECRET_KEY="${SECRET_KEY}" \
            -e FLAG="${FLAG}" \
            ${IMAGE_NAME}:latest
    fi
    
    echo -e "${GREEN}[✓] Container démarré avec succès${NC}"
    show_info
}

# Arrêt du container
stop_container() {
    echo -e "${YELLOW}[*] Arrêt du container...${NC}"
    docker stop ${CONTAINER_NAME} 2>/dev/null || echo -e "${RED}[!] Container non trouvé ou déjà arrêté${NC}"
    echo -e "${GREEN}[✓] Container arrêté${NC}"
}

# Logs du container
show_logs() {
    echo -e "${YELLOW}[*] Logs du container (Ctrl+C pour quitter):${NC}"
    docker logs -f ${CONTAINER_NAME}
}

# Nettoyage
clean() {
    echo -e "${YELLOW}[*] Nettoyage...${NC}"
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
    docker rmi ${IMAGE_NAME}:latest 2>/dev/null || true
    echo -e "${GREEN}[✓] Nettoyage terminé${NC}"
}

# Informations
show_info() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║              Challenge Information                        ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo -e "${GREEN}[+]${NC} Container Name: ${CONTAINER_NAME}"
    echo -e "${GREEN}[+]${NC} Image: ${IMAGE_NAME}:latest"
    echo -e "${GREEN}[+]${NC} Port: ${PORT}"
    echo -e "${GREEN}[+]${NC} URL: http://localhost:${PORT}"
    echo ""
    echo -e "${CYAN}Endpoints disponibles:${NC}"
    echo -e "  ${GREEN}→${NC} http://localhost:${PORT}/         (Informations)"
    echo -e "  ${GREEN}→${NC} http://localhost:${PORT}/token    (Obtenir un token)"
    echo -e "  ${GREEN}→${NC} http://localhost:${PORT}/secret   (Endpoint protégé)"
    echo ""
    echo -e "${YELLOW}Test rapide:${NC}"
    echo -e "  curl http://localhost:${PORT}/ | jq ."
    echo ""
}

# Menu principal
case "${1:-help}" in
    build)
        build_image
        ;;
    start)
        start_container
        ;;
    stop)
        stop_container
        ;;
    restart)
        stop_container
        sleep 2
        start_container
        ;;
    logs)
        show_logs
        ;;
    clean)
        clean
        ;;
    rebuild)
        clean
        build_image
        start_container
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}[!] Option inconnue: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

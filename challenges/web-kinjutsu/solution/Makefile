.PHONY: help build start stop restart logs clean rebuild test validate

# Variables
IMAGE_NAME = kinjutsu-ctf
CONTAINER_NAME = kinjutsu-challenge
PORT = 5000

# Couleurs pour l'affichage
CYAN = \033[0;36m
GREEN = \033[0;32m
YELLOW = \033[1;33m
NC = \033[0m

help: ## Affiche cette aide
	@echo "$(CYAN)Kinjutsu - Makefile$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""

build: ## Build l'image Docker
	@echo "$(YELLOW)[*] Building Docker image...$(NC)"
	@cd app && docker build -t $(IMAGE_NAME):latest .
	@echo "$(GREEN)[✓] Image built successfully$(NC)"

start: ## Démarre le container
	@echo "$(YELLOW)[*] Starting container...$(NC)"
	@docker run -d \
		--name $(CONTAINER_NAME) \
		-p $(PORT):5000 \
		-e SECRET_KEY=jutsu \
		-e FLAG='NHK26{Jwt_Br0k3n_S3cr3ts_4r3_D4ng3r0us}' \
		$(IMAGE_NAME):latest || (echo "$(YELLOW)[!] Container already exists, starting it...$(NC)" && docker start $(CONTAINER_NAME))
	@echo "$(GREEN)[✓] Container started$(NC)"
	@echo "$(CYAN)[+] URL: http://localhost:$(PORT)$(NC)"

stop: ## Arrête le container
	@echo "$(YELLOW)[*] Stopping container...$(NC)"
	@docker stop $(CONTAINER_NAME) 2>/dev/null || echo "$(YELLOW)[!] Container not running$(NC)"
	@echo "$(GREEN)[✓] Container stopped$(NC)"

restart: stop start ## Redémarre le container

logs: ## Affiche les logs
	@docker logs -f $(CONTAINER_NAME)

clean: ## Supprime le container et l'image
	@echo "$(YELLOW)[*] Cleaning up...$(NC)"
	@docker stop $(CONTAINER_NAME) 2>/dev/null || true
	@docker rm $(CONTAINER_NAME) 2>/dev/null || true
	@docker rmi $(IMAGE_NAME):latest 2>/dev/null || true
	@echo "$(GREEN)[✓] Cleanup done$(NC)"

rebuild: clean build start ## Clean + Build + Start

test: validate ## Alias pour validate

validate: ## Lance les tests de validation
	@echo "$(YELLOW)[*] Running validation tests...$(NC)"
	@./validate.sh

install-deps: ## Installe les dépendances des scripts
	@echo "$(YELLOW)[*] Installing Python dependencies...$(NC)"
	@pip install -r scripts/requirements.txt
	@echo "$(GREEN)[✓] Dependencies installed$(NC)"

info: ## Affiche les informations du container
	@echo "$(CYAN)Container Info:$(NC)"
	@docker ps -a | grep $(CONTAINER_NAME) || echo "Container not found"
	@echo ""
	@echo "$(CYAN)Image Info:$(NC)"
	@docker images | grep $(IMAGE_NAME) || echo "Image not found"

shell: ## Ouvre un shell dans le container
	@docker exec -it $(CONTAINER_NAME) /bin/bash

quick-test: ## Test rapide de l'API
	@echo "$(YELLOW)[*] Testing API endpoints...$(NC)"
	@curl -s http://localhost:$(PORT)/ | jq '.ok'
	@echo "$(GREEN)[✓] API is responding$(NC)"

all: rebuild validate ## Build, start et valide le challenge

#!/bin/bash

# Script de test et validation du challenge Kinjutsu
# Ce script vérifie que tous les composants fonctionnent correctement

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variables
BASE_URL="${BASE_URL:-http://localhost:5000}"
CONTAINER_NAME="kinjutsu-challenge"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           Kinjutsu - Validation Script                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Compteurs
TESTS_PASSED=0
TESTS_FAILED=0

# Fonction de test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${YELLOW}[TEST]${NC} $test_name"
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ PASS${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}  ✗ FAIL${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# Test 1: Container en cours d'exécution
echo -e "\n${CYAN}=== Tests Docker ===${NC}"
run_test "Container is running" "docker ps | grep -q ${CONTAINER_NAME}"

# Test 2: Healthcheck
run_test "Container is healthy" "curl -sf ${BASE_URL}/health"

# Test 3: Endpoint racine
echo -e "\n${CYAN}=== Tests API ===${NC}"
run_test "GET / returns 200" "curl -sf ${BASE_URL}/ | grep -q 'Kinjutsu'"

# Test 4: Endpoint /token
echo -e "${YELLOW}[TEST]${NC} GET /token returns valid JWT"
TOKEN=$(curl -sf ${BASE_URL}/token | grep -oP 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' | head -1)
if [ -n "$TOKEN" ]; then
    echo -e "${GREEN}  ✓ PASS${NC} (Token: ${TOKEN:0:30}...)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test 5: Token a le bon format
run_test "Token has 3 parts (header.payload.signature)" "echo $TOKEN | grep -qE '^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$'"

# Test 6: Accès refusé sans token
run_test "GET /secret without token returns error" "curl -sf ${BASE_URL}/secret | grep -q 'Token manquant'"

# Test 7: Accès refusé avec token user
run_test "GET /secret with user token returns 403" "curl -sf -H \"Authorization: Bearer $TOKEN\" ${BASE_URL}/secret | grep -q 'Accès refusé'"

# Test 8: Brute-force du secret
echo -e "\n${CYAN}=== Tests Scripts ===${NC}"
echo -e "${YELLOW}[TEST]${NC} Brute-force finds secret"
cd scripts
SECRET=$(python3 brutef_secret.py "$TOKEN" small_wordlist.txt 2>/dev/null | grep "Clé HMAC:" | awk '{print $NF}')
cd ..
if [ "$SECRET" = "jutsu" ]; then
    echo -e "${GREEN}  ✓ PASS${NC} (Secret trouvé: $SECRET)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAIL${NC} (Secret attendu: jutsu, trouvé: $SECRET)"
    ((TESTS_FAILED++))
fi

# Test 9: Forge d'un token admin
echo -e "${YELLOW}[TEST]${NC} Forge admin token"
ADMIN_TOKEN=$(python3 solution/forge_hs256.py "$SECRET" '{"user":"mond","role":"admin"}' 2>/dev/null | grep "^eyJ" | head -n1)
if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}  ✓ PASS${NC} (Admin token: ${ADMIN_TOKEN:0:30}...)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Test 10: Accès au secret avec token admin
echo -e "${YELLOW}[TEST]${NC} GET /secret with admin token returns flag"
RESPONSE=$(curl -sf -H "Authorization: Bearer $ADMIN_TOKEN" ${BASE_URL}/secret)
FLAG=$(echo "$RESPONSE" | grep -oP 'NHK26\{[^}]+\}' | head -1)
if [ -n "$FLAG" ] && [[ "$FLAG" =~ ^NHK26\{.*\}$ ]]; then
    echo -e "${GREEN}  ✓ PASS${NC} (Flag: $FLAG)"
    ((TESTS_PASSED++))
else
    echo -e "${RED}  ✗ FAIL${NC}"
    ((TESTS_FAILED++))
fi

# Résumé
echo -e "\n${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    Test Summary                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"
echo -e "Total:  $((TESTS_PASSED + TESTS_FAILED))"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed! Challenge is ready.${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed. Please check the output above.${NC}\n"
    exit 1
fi

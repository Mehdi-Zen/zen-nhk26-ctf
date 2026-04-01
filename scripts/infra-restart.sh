#!/bin/bash
# Script de remontage complet de l'infra CTF
# Usage: ./infra-restart.sh [stop|start|status]

set -e

GALERA_NODES=("192.168.212.31" "192.168.212.32" "192.168.212.33")
CTFD_HOST="192.168.213.10"
DOCKER_HOST="192.168.213.11"
SSH_USER="adminctf"
DB_USER="ctfd"
DB_PASS="CHANGE_ME"
REDIS_PASS="CHANGE_ME"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log() { echo -e "${CYAN}[$(date +%H:%M:%S)]${NC} $1"; }
ok()  { echo -e "${GREEN}  ✅ $1${NC}"; }
err() { echo -e "${RED}  ❌ $1${NC}"; }
warn(){ echo -e "${YELLOW}  ⚠️  $1${NC}"; }

ssh_cmd() {
    local host=$1
    local cmd=$2
    # Si le host est sur le VLAN 212, passer par la VM CTFd comme jump host
    if [[ "$host" == 192.168.212.* ]]; then
        ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -J ${SSH_USER}@${CTFD_HOST} ${SSH_USER}@$host "$cmd" 2>/dev/null
    else
        ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${SSH_USER}@$host "$cmd" 2>/dev/null
    fi
}

force_stop_mariadb() {
    local node=$1
    ssh_cmd $node "sudo systemctl stop mariadb" 2>/dev/null
    sleep 2
    # Si encore actif, force kill
    local status=$(ssh_cmd $node "sudo systemctl is-active mariadb 2>/dev/null")
    if [ "$status" != "inactive" ] && [ "$status" != "failed" ]; then
        warn "MariaDB bloqué sur $node, force kill..."
        ssh_cmd $node "sudo systemctl kill -s SIGKILL mariadb; sudo systemctl reset-failed mariadb" 2>/dev/null
        sleep 1
    fi
}

do_stop() {
    log "=== ARRÊT DE L'INFRA ==="

    log "1/4 - Arrêt CTFd..."
    ssh_cmd $CTFD_HOST "sudo systemctl stop ctfd" && ok "CTFd stoppé" || warn "CTFd déjà stoppé"

    log "2/4 - Arrêt MaxScale + Redis + Nginx..."
    ssh_cmd $CTFD_HOST "sudo systemctl stop maxscale" && ok "MaxScale stoppé" || warn "MaxScale déjà stoppé"
    ssh_cmd $CTFD_HOST "sudo systemctl stop redis-server" && ok "Redis stoppé" || warn "Redis déjà stoppé"
    ssh_cmd $CTFD_HOST "sudo systemctl stop nginx" && ok "Nginx stoppé" || warn "Nginx déjà stoppé"

    log "3/4 - Arrêt Galera (3 nœuds)..."
    for node in "${GALERA_NODES[@]}"; do
        force_stop_mariadb $node && ok "Galera $node stoppé" || warn "Galera $node déjà stoppé"
    done

    log "4/4 - Arrêt Docker..."
    ssh_cmd $DOCKER_HOST "sudo systemctl stop docker.socket docker" && ok "Docker stoppé" || warn "Docker déjà stoppé"

    log "=== INFRA ARRÊTÉE ==="
}

do_start() {
    log "=== REMONTAGE DE L'INFRA ==="

    # 1. Galera bootstrap
    log "1/5 - Bootstrap Galera..."
    BEST_NODE=""
    BEST_SEQNO=-1

    for node in "${GALERA_NODES[@]}"; do
        # Force stop si encore actif/bloqué
        force_stop_mariadb $node

        SEQNO=$(ssh_cmd $node "sudo galera_recovery 2>&1 | grep -oP '(?<=:)\d+' | tail -1")
        if [ -z "$SEQNO" ]; then
            warn "Impossible de récupérer le seqno sur $node"
            continue
        fi
        log "  $node → seqno $SEQNO"
        if [ "$SEQNO" -gt "$BEST_SEQNO" ]; then
            BEST_SEQNO=$SEQNO
            BEST_NODE=$node
        fi
    done

    if [ -z "$BEST_NODE" ]; then
        err "Aucun nœud Galera trouvé. Vérifiez le réseau."
        exit 1
    fi

    log "  Bootstrap sur $BEST_NODE (seqno $BEST_SEQNO)..."
    ssh_cmd $BEST_NODE "sudo sed -i 's/safe_to_bootstrap: 0/safe_to_bootstrap: 1/' /var/lib/mysql/grastate.dat && sudo galera_new_cluster"
    ok "Galera bootstrap sur $BEST_NODE"
    sleep 3

    for node in "${GALERA_NODES[@]}"; do
        if [ "$node" != "$BEST_NODE" ]; then
            ssh_cmd $node "sudo systemctl start mariadb"
            ok "Galera $node démarré"
            sleep 2
        fi
    done

    # Vérification cluster
    CLUSTER_SIZE=$(ssh_cmd $BEST_NODE "mariadb -u $DB_USER -p'$DB_PASS' -e \"SHOW STATUS LIKE 'wsrep_cluster_size';\" 2>/dev/null | grep wsrep | awk '{print \$2}'")
    if [ "$CLUSTER_SIZE" = "3" ]; then
        ok "Cluster Galera OK (3 nœuds synced)"
    else
        warn "Cluster Galera: $CLUSTER_SIZE nœud(s) — attendez que les autres rejoignent"
    fi

    # 2. MaxScale
    log "2/5 - Démarrage MaxScale..."
    ssh_cmd $CTFD_HOST "sudo systemctl start maxscale"
    sleep 2
    SERVERS=$(ssh_cmd $CTFD_HOST "maxctrl list servers 2>/dev/null | grep Running | wc -l")
    if [ "$SERVERS" -ge 2 ]; then
        ok "MaxScale OK ($SERVERS nœuds Running)"
    else
        warn "MaxScale: $SERVERS nœud(s) Running"
    fi

    # 3. Redis
    log "3/5 - Démarrage Redis..."
    ssh_cmd $CTFD_HOST "sudo systemctl start redis-server"
    PONG=$(ssh_cmd $CTFD_HOST "redis-cli -a '$REDIS_PASS' ping 2>/dev/null")
    if [ "$PONG" = "PONG" ]; then
        ok "Redis OK"
    else
        err "Redis ne répond pas"
    fi

    # 4. Nginx
    log "4/5 - Démarrage Nginx..."
    ssh_cmd $CTFD_HOST "sudo systemctl start nginx"
    ok "Nginx démarré"

    # 5. CTFd
    log "5/5 - Démarrage CTFd..."
    ssh_cmd $CTFD_HOST "sudo systemctl start ctfd"
    sleep 5
    CTFD_STATUS=$(ssh_cmd $CTFD_HOST "sudo systemctl is-active ctfd")
    if [ "$CTFD_STATUS" = "active" ]; then
        ok "CTFd OK"
    else
        err "CTFd ne démarre pas — vérifiez les logs: journalctl -u ctfd -n 20"
    fi

    # 6. Docker + Registry
    log "Bonus - Démarrage Docker..."
    ssh_cmd $DOCKER_HOST "sudo systemctl start docker"
    sleep 2
    REGISTRY=$(ssh_cmd $DOCKER_HOST "curl -s http://localhost:5000/v2/_catalog 2>/dev/null | head -c 20")
    if [ -n "$REGISTRY" ]; then
        ok "Docker + Registry OK"
    else
        warn "Registry ne répond pas — vérifiez docker ps"
    fi

    log "=== INFRA REMONTÉE ==="
}

do_status() {
    log "=== STATUS DE L'INFRA ==="

    log "VM CTFd ($CTFD_HOST):"
    for svc in ctfd nginx redis-server maxscale fail2ban; do
        STATUS=$(ssh_cmd $CTFD_HOST "sudo systemctl is-active $svc 2>/dev/null")
        if [ "$STATUS" = "active" ]; then
            ok "$svc"
        else
            err "$svc ($STATUS)"
        fi
    done

    log "Galera Cluster:"
    for node in "${GALERA_NODES[@]}"; do
        STATUS=$(ssh_cmd $node "sudo systemctl is-active mariadb 2>/dev/null")
        if [ "$STATUS" = "active" ]; then
            ok "$node"
        else
            err "$node ($STATUS)"
        fi
    done

    log "MaxScale servers:"
    ssh_cmd $CTFD_HOST "maxctrl list servers 2>/dev/null" || warn "MaxScale non accessible"

    log "VM Docker ($DOCKER_HOST):"
    STATUS=$(ssh_cmd $DOCKER_HOST "sudo systemctl is-active docker 2>/dev/null")
    if [ "$STATUS" = "active" ]; then
        ok "Docker"
        CONTAINERS=$(ssh_cmd $DOCKER_HOST "docker ps -q | wc -l 2>/dev/null")
        ok "$CONTAINERS containers actifs"
    else
        err "Docker ($STATUS)"
    fi

    log "=== FIN STATUS ==="
}

case "${1:-status}" in
    stop)   do_stop ;;
    start)  do_start ;;
    status) do_status ;;
    restart) do_stop; sleep 3; do_start ;;
    *)
        echo "Usage: $0 [stop|start|status|restart]"
        exit 1
        ;;
esac

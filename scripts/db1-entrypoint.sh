#!/bin/bash
set -e

echo "=== DB1 Entrypoint Smart Bootstrap ==="

# Fonction pour vérifier si un nœud répond
check_node() {
    timeout 2 bash -c "cat < /dev/null > /dev/tcp/$1/3306" 2>/dev/null
    return $?
}

# Vérifier si db2 ou db3 sont accessibles
if check_node "172.20.0.11" || check_node "172.20.0.12"; then
    echo "✓ Autres nœuds détectés (db2 ou db3), REJOINDRE le cluster existant"
    
    # Modifier grastate.dat pour empêcher le bootstrap
    if [ -f /var/lib/mysql/grastate.dat ]; then
        sed -i 's/safe_to_bootstrap: 1/safe_to_bootstrap: 0/' /var/lib/mysql/grastate.dat
        echo "✓ grastate.dat modifié : safe_to_bootstrap = 0"
    fi
    
    # Lancer MariaDB SANS --wsrep-new-cluster
    exec docker-entrypoint.sh mysqld \
        --wsrep-node-address=db1 \
        --wsrep-node-name=node1
else
    echo "✗ Aucun autre nœud détecté, BOOTSTRAP d'un nouveau cluster"
    
    # Forcer safe_to_bootstrap à 1 pour permettre le bootstrap
    if [ -f /var/lib/mysql/grastate.dat ]; then
        sed -i 's/safe_to_bootstrap: 0/safe_to_bootstrap: 1/' /var/lib/mysql/grastate.dat
        echo "✓ grastate.dat modifié : safe_to_bootstrap = 1 (forcé pour bootstrap)"
    fi
    
    # Lancer MariaDB AVEC --wsrep-new-cluster
    exec docker-entrypoint.sh mysqld \
        --wsrep-new-cluster \
        --wsrep-node-address=db1 \
        --wsrep-node-name=node1
fi

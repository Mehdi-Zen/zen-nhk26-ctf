#!/bin/bash
# Build incremental : ne rebuild que les challenges Docker modifies
# Usage: ./scripts/build-challenges.sh [registry]

REGISTRY="${1:-192.168.213.11:5000}"
BUILD_ALL="${2:-}"
CHALLENGES_DIR="challenges"

echo "=== Build des challenges ==="
echo "Registry: $REGISTRY"
echo ""

if [ "$BUILD_ALL" = "--all" ]; then
    echo "Mode: rebuild complet"
    CHANGED_DIRS=$(find "$CHALLENGES_DIR/" -maxdepth 1 -mindepth 1 -type d | sort)
else
    # Detecter les challenges modifies depuis le dernier commit
    CHANGED_DIRS=$(git diff --name-only HEAD~1 HEAD 2>/dev/null | grep "^${CHALLENGES_DIR}/" | cut -d'/' -f1-2 | sort -u || echo "")

    if [ -z "$CHANGED_DIRS" ]; then
        echo "Aucun changement detecte, build de tous les challenges avec Dockerfile..."
        CHANGED_DIRS=$(find "$CHALLENGES_DIR/" -maxdepth 1 -mindepth 1 -type d | sort)
    fi
fi

built=0
skipped=0

for challenge_dir in $CHANGED_DIRS; do
    challenge_name=$(basename "$challenge_dir")

    if [ ! -f "$challenge_dir/Dockerfile" ]; then
        echo "SKIP $challenge_name (no Dockerfile)"
        skipped=$((skipped + 1))
        continue
    fi

    image_name=$(echo "$challenge_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')
    full_image="$REGISTRY/$image_name"

    echo "BUILD $challenge_name -> $full_image:latest"
    cd "$challenge_dir"
    docker build -t "$full_image:latest" .
    docker push "$full_image:latest"
    cd - > /dev/null

    built=$((built + 1))
done

echo ""
echo "Done: $built built, $skipped skipped"

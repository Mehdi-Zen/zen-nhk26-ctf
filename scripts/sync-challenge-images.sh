#!/bin/bash
# Copie les images challenge.* de chaque challenge vers le dossier static du theme
# Usage: ./scripts/sync-challenge-images.sh

CHALLENGES_DIR="$(dirname "$0")/../challenges"
DEST_DIR="$(dirname "$0")/../CTFd/themes/cybernoir/static/img/challenges"

mkdir -p "$DEST_DIR"

count=0
for img in "$CHALLENGES_DIR"/*/files/challenge.*; do
    [ -f "$img" ] || continue

    # Nom du challenge = nom du dossier parent du files/
    challenge_name="$(basename "$(dirname "$(dirname "$img")")")"
    ext="${img##*.}"

    cp "$img" "$DEST_DIR/${challenge_name}.${ext}"
    echo "  $challenge_name.$ext"
    ((count++))
done

echo "Done: $count images copiees dans $DEST_DIR"

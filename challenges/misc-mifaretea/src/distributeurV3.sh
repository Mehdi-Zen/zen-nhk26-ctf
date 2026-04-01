#!/bin/bash

PM3="/home/denis/Téléchargements/proxmark3/client/proxmark3"
PORT="/dev/ttyACM0"

FLAG="NHK26{T2SL4_N3EDS_T8A}"

echo "=== Distributeur Tesla CTF ==="
echo "Placez votre carte sur le lecteur..."
echo

while true; do
    RAW=$($PM3 $PORT -c "hf mf rdbl --blk 8; hf mf rdbl --blk 9; hf mf rdbl --blk 10" 2>/dev/null)

    # Bloc 8 : crédit
    BLOCK8=$(echo "$RAW" | grep "blk 8" -A 5 | grep -oP "([0-9A-Fa-f]{2} ?){16}" | head -n1 | tr -d ' ')

    # Bloc 9 : date Tesla Day
    BLOCK9=$(echo "$RAW" | grep "blk 9" -A 5 | grep -oP "([0-9A-Fa-f]{2} ?){16}" | head -n1 | tr -d ' ')

    # Bloc 10 : checksum
    BLOCK10=$(echo "$RAW" | grep "blk 10" -A 5 | grep -oP "([0-9A-Fa-f]{2} ?){16}" | head -n1 | tr -d ' ')

    # Si un bloc n'est pas lu correctement, on boucle
    if [[ -z "$BLOCK8" || -z "$BLOCK9" || -z "$BLOCK10" ]]; then
        sleep 1
        continue
    fi

    # Il y a 32 caractères Hexa...
    CREDIT_HEX=${BLOCK8:30:2}
    DATE_HEX=${BLOCK9:28:4}
    CHECKSUM_HEX=${BLOCK10:28:4}

    # Si un des octets est vide...
    if [[ -z "$CREDIT_HEX" || -z "$DATE_HEX" || -z "$CHECKSUM_HEX" ]]; then
        sleep 1
        continue
    fi

    CREDIT=$((16#$CREDIT_HEX))
    DATE=$((16#$DATE_HEX))

    echo "---- Carte détectée ----"

    # IF 1 : Vérification crédit
    if (( CREDIT < 3 )); then
        echo "Crédit insuffisant: $CREDIT €"
    else
        echo "Crédit OK: $CREDIT € "
        
        # IF 2 : Vérification date Tesla Day (imbriqué)
        if [[ $DATE_HEX != "1007" ]]; then
            echo "Date invalide: 0x$DATE_HEX"
        else
            echo "Tesla Day OK: 0x$DATE_HEX"
            
            # IF 3 : Vérification checksum (imbriqué)
            EXPECTED_CHECKSUM=$(printf "%02X" $((CREDIT ^ DATE)))
            if [[ $CHECKSUM_HEX != $EXPECTED_CHECKSUM ]]; then
                echo "Presque ! problème de CHECKSUM: 0x$CHECKSUM_HEX"
            else
                echo "Checksum OK: 0x$CHECKSUM_HEX"
                echo ""
                echo "TOUTES conditions remplies, Thé servi !"
                echo "$FLAG"
            fi
        fi
    fi

    echo
    sleep 5
    clear

    echo "=== Distributeur Tesla CTF ==="
    echo "Placez votre carte sur le lecteur..."
done

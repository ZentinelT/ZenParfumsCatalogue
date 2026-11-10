#!/bin/bash
# Script para el cron diario — se ejecuta desde launchd a las 10am

LOG="/Users/arieloliva/ZenParfumsCatalogue/logs/cron.log"
mkdir -p "$(dirname "$LOG")"

echo "======================================" >> "$LOG"
echo "Inicio: $(date '+%d/%m/%Y %H:%M:%S')" >> "$LOG"

cd /Users/arieloliva/ZenParfumsCatalogue

# Cargar las keys del .env
export $(grep -v '^#' .env | xargs)

# Correr la actualización y guardar log
bash actualizar.sh >> "$LOG" 2>&1
EXIT=$?

if [ $EXIT -eq 0 ]; then
  echo "✅ Finalizado OK: $(date '+%H:%M:%S')" >> "$LOG"
else
  echo "❌ Error (código $EXIT): $(date '+%H:%M:%S')" >> "$LOG"
fi

echo "" >> "$LOG"

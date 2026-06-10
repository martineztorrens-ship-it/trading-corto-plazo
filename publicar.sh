#!/bin/bash
# Publica los cambios locales (data.json, etc.) en GitHub Pages.
# Uso: ./publicar.sh "mensaje opcional"

set -e
cd "$(dirname "$0")"

MENSAJE="${1:-Actualizar datos $(date '+%d/%m/%Y %H:%M')}"

git add -A

if git diff --cached --quiet; then
  echo "No hay cambios para publicar."
  exit 0
fi

git commit -m "$MENSAJE"
git push origin main

echo ""
echo "Publicado correctamente."
echo "La web se actualizará en 1-2 minutos en:"
echo "https://martineztorrens-ship-it.github.io/trading-corto-plazo/"

#!/bin/bash
set -e
cd "$(dirname "$0")"

# ── Verificar que la key esté disponible ──────────────────────────────────────
if [ -z "$SUPABASE_KEY" ]; then
  # Intentar leerla del archivo .env local si existe
  if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
  fi
fi

if [ -z "$SUPABASE_KEY" ]; then
  echo "❌ Falta la SUPABASE_KEY."
  echo "   Opción 1: corré   SUPABASE_KEY=eyJ... ./actualizar.sh"
  echo "   Opción 2: creá un archivo .env con  SUPABASE_KEY=eyJ..."
  exit 1
fi

# ── Bajar datos y generar JSONs ───────────────────────────────────────────────
echo "▶ Actualizando catálogo..."
python3 actualizar_catalogo.py

# ── Regenerar páginas individuales de perfumes ───────────────────────────────
echo "▶ Generando páginas de perfumes..."
python3 generar_paginas.py

# ── Publicar si todo salió bien ───────────────────────────────────────────────
echo "▶ Publicando en GitHub..."
git add data/products.json data/fichas.json data/novedades.json data/marcas.json img/marcas perfume/ sitemap.xml 2>/dev/null || true
git diff --quiet --cached || git commit -m "Actualizar catálogo — $(date '+%d/%m/%Y %H:%M')"
git push

echo "✅ Catálogo actualizado y publicado."

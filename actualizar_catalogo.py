name: Actualizar catálogo

on:
  schedule:
    - cron: "0 */6 * * *"   # cada 6 horas
  workflow_dispatch:         # permite correrlo manualmente desde GitHub

permissions:
  contents: write

jobs:
  actualizar:
    runs-on: ubuntu-latest
    steps:
      - name: Clonar repo
        uses: actions/checkout@v4

      - name: Instalar Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Instalar dependencias
        run: pip install pandas requests

      - name: Generar catálogo actualizado
        env:
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: python actualizar_catalogo.py

      - name: Commit y push si hay cambios
        run: |
          git config user.name "github-actions"
          git config user.email "actions@github.com"
          git add index.html
          git diff --quiet --cached || git commit -m "Actualizar catálogo automáticamente"
          git push

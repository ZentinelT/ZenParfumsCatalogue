import os
import re
import json
import requests
import pandas as pd

# ---------- CONFIG ----------
API_KEY = os.environ["SUPABASE_KEY"]
API_URL = "https://syylbuvjuekkanxynpps.supabase.co/rest/v1/productos"

MARGEN_NORMAL = 15000
MARGEN_TUBBEES = 10000
SIN_STOCK_PRECIO = 15000  # sentinela ya usado en el sitio para "Sin stock"

HTML_PATH = "index.html"

CAT_MAP = {
    "arabes": "Árabe",
    "internacionales": "Internacional",
}

# ---------- 1. DESCARGAR DATOS ----------
headers = {"apikey": API_KEY, "Authorization": f"Bearer {API_KEY}"}
params = {"select": "*"}

print("Descargando productos...")
response = requests.get(API_URL, headers=headers, params=params)
if response.status_code != 200:
    print("Error:", response.status_code, response.text)
    exit(1)

df = pd.DataFrame(response.json())
print(f"Productos descargados: {len(df)}")

# ---------- 2. FILTRAR ----------
df = df[(df["tipo"] == "perfume") & (df["activo"] == True)].copy()

def calcular_precio(row):
    if pd.isna(row.get("stock_actual")) or row["stock_actual"] <= 0:
        return SIN_STOCK_PRECIO
    base = row.get("precio_min_ars")
    if pd.isna(base):
        return SIN_STOCK_PRECIO
    if str(row.get("empresa", "")).strip().upper() == "TUBBEES":
        return int(base + MARGEN_TUBBEES)
    return int(base + MARGEN_NORMAL)

def genero_map(g):
    g = str(g or "").strip()
    if "♀" in g:
        return "Mujer"
    if "♂" in g:
        return "Hombre"
    return "Unisex"

def partir_nombre(empresa, nombre):
    empresa = str(empresa or "").strip()
    nombre = str(nombre or "").strip()
    prefijo = empresa + " - "
    if nombre.startswith(prefijo):
        return nombre[len(prefijo):].strip()
    return nombre

def parsear_notas(desc):
    desc = str(desc or "")
    top = heart = base = ""
    m = re.search(r"Notas? de [Ss]alida:?\s*(.*?)(?=Notas? de |$)", desc)
    if m: top = m.group(1).strip(" .")
    m = re.search(r"Notas? de [Cc]oraz[oó]n:?\s*(.*?)(?=Notas? de |$)", desc)
    if m: heart = m.group(1).strip(" .")
    m = re.search(r"Notas? de [Ff]ondo:?\s*(.*?)(?=Notas? de |$)", desc)
    if m: base = m.group(1).strip(" .")
    return top, heart, base

registros = []
for _, row in df.iterrows():
    top, heart, base = parsear_notas(row.get("descripcion"))
    ml = row.get("ml")
    try:
        ml = int(ml) if pd.notna(ml) else None
    except Exception:
        ml = None

    registros.append({
        "brand": str(row.get("empresa", "")).strip(),
        "name": partir_nombre(row.get("empresa"), row.get("nombre")),
        "ml": ml,
        "cat": CAT_MAP.get(str(row.get("cat_catalogo", "")).strip(), str(row.get("cat_catalogo", "")).strip()),
        "price": calcular_precio(row),
        "img": str(row.get("imagen_url", "") or ""),
        "top": top,
        "heart": heart,
        "base": base,
        "gender": genero_map(row.get("genero")),
    })

print(f"Perfumes activos: {len(registros)}")

# ---------- 3. REEMPLAZAR SOLO EL ARRAY DATA EN EL HTML ----------
with open(HTML_PATH, "r", encoding="utf-8") as f:
    html = f.read()

nuevo_json = json.dumps(registros, ensure_ascii=False)
nuevo_bloque = f"const DATA = {nuevo_json};"

patron = re.compile(r"const DATA = \[.*?\];", re.DOTALL)
if not patron.search(html):
    print("No se encontró el array DATA en el HTML. Abortando sin modificar nada.")
    exit(1)

html_actualizado = patron.sub(lambda m: nuevo_bloque, html, count=1)

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html_actualizado)

print("Listo: DATA actualizado dentro de index.html (diseño intacto)")

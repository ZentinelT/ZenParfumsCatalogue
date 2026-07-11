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

HTML_PATH = "index.html"  # el nuevo zen-parfums-v5.html renombrado como index.html

CAT_MAP = {
    "arabes": "arabes",
    "internacionales": "internacional",
    "accesorios": "accesorios",
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
df = df[df["activo"] == True].copy()
if "oculto" in df.columns:
    df = df[(df["oculto"].isna()) | (df["oculto"] == False)]

def calcular_precio(row):
    base = row.get("precio_min_ars")
    if pd.isna(base):
        return 0
    if str(row.get("empresa", "")).strip().upper() == "TUBBEES":
        return int(base + MARGEN_TUBBEES)
    return int(base + MARGEN_NORMAL)

def calcular_stock(row):
    st = row.get("stock_actual")
    if pd.isna(st) or st <= 0:
        return "out"
    if st <= 2:
        return "low"
    return "ok"

def genero_map(g):
    g = str(g or "").strip()
    if "♀" in g:
        return "mujer"
    if "♂" in g:
        return "hombre"
    return "unisex"

def parsear_notas(desc):
    desc = str(desc or "").strip()
    if not desc:
        return "—"
    top = heart = base = ""
    m = re.search(r"Notas? de [Ss]alida:?\s*(.*?)(?=Notas? de |$)", desc)
    if m: top = m.group(1).strip(" .")
    m = re.search(r"Notas? de [Cc]oraz[oó]n:?\s*(.*?)(?=Notas? de |$)", desc)
    if m: heart = m.group(1).strip(" .")
    m = re.search(r"Notas? de [Ff]ondo:?\s*(.*?)(?=Notas? de |$)", desc)
    if m: base = m.group(1).strip(" .")
    partes = []
    if top: partes.append("Salida  " + top)
    if heart: partes.append("Corazón  " + heart)
    if base: partes.append("Fondo  " + base)
    return "    ".join(partes) if partes else desc

def fmt_precio(p):
    if not p:
        return "—"
    return "$" + f"{p:,}".replace(",", ".")

registros = []
for i, (_, row) in enumerate(df.iterrows(), start=1):
    ml = row.get("ml")
    try:
        ml = int(ml) if pd.notna(ml) else None
    except Exception:
        ml = None
    size = f"{ml}ml" if ml else ""

    precio = calcular_precio(row)

    registros.append({
        "id": i,
        "b": str(row.get("empresa", "")).strip(),
        "n": str(row.get("nombre", "")).strip(),
        "s": size,
        "p": precio,
        "c": CAT_MAP.get(str(row.get("cat_catalogo", "")).strip(), str(row.get("cat_catalogo", "")).strip()),
        "g": genero_map(row.get("genero")),
        "st": calcular_stock(row),
        "i": str(row.get("imagen_url", "") or ""),
        "nt": parsear_notas(row.get("descripcion")),
        "p1": fmt_precio(precio),
    })

print(f"Productos activos: {len(registros)}")

# ---------- 3. REEMPLAZAR SOLO EL BLOQUE pdata EN EL HTML ----------
with open(HTML_PATH, "r", encoding="utf-8") as f:
    html = f.read()

nuevo_json = json.dumps(registros, ensure_ascii=False, separators=(",", ":"))

patron = re.compile(
    r'(<script type="application/json" id="pdata">)(.*?)(</script>)',
    re.DOTALL
)
if not patron.search(html):
    print("No se encontró el bloque pdata en el HTML. Abortando sin modificar nada.")
    exit(1)

html_actualizado = patron.sub(lambda m: m.group(1) + nuevo_json + m.group(3), html, count=1)

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html_actualizado)

print("Listo: pdata actualizado dentro de index.html (diseño intacto)")

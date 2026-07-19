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

# ---------- 1b. DESCARGAR FICHAS TÉCNICAS ----------
FICHAS_TABLE_CANDIDATES = ["fichas_perfume", "fichas_perfumes", "fichas_tecnicas", "fichas", "ficha_producto", "fichas_productos", "producto_fichas"]
fichas_json = []
fichas_tabla_usada = None
for tabla in FICHAS_TABLE_CANDIDATES:
    url_fichas = f"https://syylbuvjuekkanxynpps.supabase.co/rest/v1/{tabla}"
    r = requests.get(url_fichas, headers=headers, params={"select": "*"})
    if r.status_code == 200:
        data = r.json()
        if isinstance(data, list) and len(data) > 0 and "nombre_completo" in data[0]:
            fichas_json = data
            fichas_tabla_usada = tabla
            break

if fichas_tabla_usada:
    print(f"Fichas técnicas descargadas de tabla '{fichas_tabla_usada}': {len(fichas_json)}")
else:
    print("ADVERTENCIA: no se encontró tabla de fichas técnicas. Probadas:", FICHAS_TABLE_CANDIDATES)
    print("Si el nombre real es otro, agregalo a FICHAS_TABLE_CANDIDATES en este script.")

FICHA_CAMPOS = [
    "nombre_completo", "marca", "anno", "concentracion", "genero", "familia_olfativa",
    "inspirado_en", "notas_salida", "notas_corazon", "notas_fondo", "descripcion",
    "momento_dia", "estacion", "ocasion", "clima", "proyeccion", "duracion", "estela",
    "color_liquido", "perfil_usuario", "rango_edad_min", "rango_edad_max",
    "estilo_descripcion", "inspirado_en_imagen_url", "inspirado_en_nombre", "inspiraciones",
]

fichas_registros = []
for f in fichas_json:
    if f.get("activo") is False:
        continue
    fichas_registros.append({k: f.get(k) for k in FICHA_CAMPOS if f.get(k) not in (None, "")})

print(f"Fichas activas a publicar: {len(fichas_registros)}")

# ---------- 2. FILTRAR ----------
df = df[df["activo"] == True].copy()
if "oculto" in df.columns:
    df = df[(df["oculto"].isna()) | (df["oculto"] == False)]

CATEGORIAS_PERMITIDAS = ["arabes", "internacionales"]
df = df[df["cat_catalogo"].astype(str).str.strip().isin(CATEGORIAS_PERMITIDAS)]
print(f"Productos tras filtrar por categoría {CATEGORIAS_PERMITIDAS}: {len(df)}")

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
    if desc is None:
        return "—"
    if pd.isna(desc):
        return "—"

    text = str(desc).strip()
    if not text:
        return "—"

    placeholders = {"nan", "none", "null", "n/a", "na", "undefined", "sin datos", "sin notas", "no data"}
    if text.lower() in placeholders:
        return "—"

    text = re.sub(r"\s+", " ", text).strip()

    # Intento 1: detectar etiquetas tipo "Salida: ...", "Corazón: ...", "Fondo: ..."
    matches = list(re.finditer(
        r"(?:^|[.;\n])\s*(?:notas?\s+de\s+)?(salida|coraz[oó]n|fondo|base)\b\s*[:\-–/]*\s*([^.;\n]+)",
        text,
        re.IGNORECASE,
    ))

    if matches:
        partes = []
        label_map = {
            "salida": "Salida",
            "coraz\u00f3n": "Coraz\u00f3n",
            "corazon": "Coraz\u00f3n",
            "fondo": "Fondo",
            "base": "Fondo",
        }
        for m in matches:
            label = m.group(1).strip().lower()
            value = re.sub(r"\s+", " ", m.group(2)).strip(" .:-")
            if value:
                partes.append(label_map.get(label, label.title()) + " " + value)
        if partes:
            return " · ".join(partes)

    # Intento 2: si no hay etiquetas, devolver el texto limpio si parece ser una descripción de notas
    cleaned = re.sub(r"\s+", " ", text).strip(" .;:-")
    if cleaned and len(cleaned) < 400:
        return cleaned

    return "—"

def fmt_precio(p):
    if not p:
        return "—"
    return "$" + f"{p:,}".replace(",", ".")

registros = []
for _, row in df.iterrows():
    raw_id = row.get("id")
    try:
        pid = int(raw_id) if pd.notna(raw_id) else None
    except Exception:
        pid = None
    if pid is None:
        print(f"ADVERTENCIA: producto sin id de Supabase, se omite: {row.get('nombre')}")
        continue

    ml = row.get("ml")
    try:
        ml = int(ml) if pd.notna(ml) else None
    except Exception:
        ml = None
    size = f"{ml}ml" if ml else ""

    precio = calcular_precio(row)

    nota_texto = ""
    for key in ["descripcion", "descripcion_olfativa", "descripcion_olf", "notas", "notas_olfativas", "notas_olf", "notes", "notes_olfativas"]:
        if key in df.columns:
            val = row.get(key)
            if val is not None and not pd.isna(val):
                texto = str(val).strip()
                if texto and texto.lower() not in {"nan", "none", "null", "n/a", "na", "undefined", "sin datos", "sin notas", "no data"}:
                    nota_texto = texto
                    break

    registros.append({
        "id": pid,
        "b": str(row.get("empresa", "")).strip(),
        "n": str(row.get("nombre", "")).strip(),
        "s": size,
        "p": precio,
        "c": CAT_MAP.get(str(row.get("cat_catalogo", "")).strip(), str(row.get("cat_catalogo", "")).strip()),
        "g": genero_map(row.get("genero")),
        "st": calcular_stock(row),
        "i": str(row.get("imagen_url", "") or ""),
        "nt": parsear_notas(nota_texto),
        "p1": fmt_precio(precio),
    })

registros.sort(key=lambda r: r["id"])

print(f"Productos activos: {len(registros)}")

# ---------- 3. ESCRIBIR LOS JSON DE DATOS ----------
os.makedirs("data", exist_ok=True)

with open("data/products.json", "w", encoding="utf-8") as f:
    json.dump(registros, f, ensure_ascii=False, indent=2)

with open("data/fichas.json", "w", encoding="utf-8") as f:
    json.dump(fichas_registros, f, ensure_ascii=False, indent=2)

print("Listo: data/products.json y data/fichas.json actualizados")

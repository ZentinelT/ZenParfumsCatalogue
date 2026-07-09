import os
import requests
import pandas as pd

# ---------- CONFIG ----------
API_KEY = os.environ["SUPABASE_KEY"]  # se toma de un GitHub Secret
API_URL = "https://syylbuvjuekkanxynpps.supabase.co/rest/v1/productos"

MARGEN_NORMAL = 15000
MARGEN_TUBBEES = 10000

OUTPUT_HTML = "index.html"

# ---------- 1. DESCARGAR DATOS ----------
headers = {
    "apikey": API_KEY,
    "Authorization": f"Bearer {API_KEY}",
}
params = {"select": "*"}

print("Descargando productos...")
response = requests.get(API_URL, headers=headers, params=params)

if response.status_code != 200:
    print("Error:", response.status_code, response.text)
    exit(1)

productos = response.json()
df = pd.DataFrame(productos)
print(f"Productos descargados: {len(df)}")

# ---------- 2. FILTRAR Y CALCULAR PRECIOS ----------
df = df[(df["tipo"] == "perfume") & (df["activo"] == True)].copy()

def calcular_precio(row):
    base = row["precio_min_ars"]
    if pd.isna(base):
        return None
    if str(row["empresa"]).strip().upper() == "TUBBEES":
        return base + MARGEN_TUBBEES
    return base + MARGEN_NORMAL

df["precio_final"] = df.apply(calcular_precio, axis=1)
df["stock_estado"] = df["stock_actual"].apply(
    lambda x: "Sin stock" if pd.isna(x) or x <= 0 else "Disponible"
)

resultado = df[[
    "nombre", "empresa", "genero", "cat_catalogo",
    "descripcion", "imagen_url", "precio_final", "stock_estado"
]].rename(columns={
    "nombre": "producto",
    "empresa": "marca",
    "cat_catalogo": "categoria",
    "descripcion": "notas",
    "imagen_url": "foto",
})

print(f"Perfumes activos: {len(resultado)}")

# ---------- 3. GENERAR HTML ----------
cards = ""
for _, row in resultado.iterrows():
    nombre = row.get("producto", "")
    marca = row.get("marca", "")
    genero = row.get("genero", "")
    categoria = row.get("categoria", "")
    notas = str(row.get("notas", "") or "")
    foto = row.get("foto", "")
    precio = row.get("precio_final", 0)
    stock_estado = row.get("stock_estado", "Disponible")
    sin_stock = stock_estado == "Sin stock"

    try:
        precio_fmt = f"${precio:,.0f}".replace(",", ".")
    except Exception:
        precio_fmt = str(precio)

    clase_extra = " sin-stock" if sin_stock else ""
    aviso = '<p class="aviso-stock">SIN STOCK</p>' if sin_stock else ""
    precio_html = "" if sin_stock else f'<p class="precio">{precio_fmt}</p>'

    cards += f"""
    <div class="card{clase_extra}">
        <img src="{foto}" alt="{nombre}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x300?text=Sin+foto'">
        <div class="info">
            <span class="badge">{categoria} {genero}</span>
            <h3>{nombre}</h3>
            <p class="marca">{marca}</p>
            <p class="notas">{notas}</p>
            {aviso}
            {precio_html}
        </div>
    </div>
    """

html = f"""<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Catálogo de Perfumes</title>
<style>
  body {{
    font-family: Arial, sans-serif;
    background: #0d0d0d;
    color: #f2f2f2;
    margin: 0;
    padding: 20px;
  }}
  h1 {{
    text-align: center;
    color: #d4af37;
    font-weight: 300;
    letter-spacing: 2px;
  }}
  .grid {{
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 20px;
    max-width: 1400px;
    margin: 30px auto;
  }}
  .card {{
    background: #1a1a1a;
    border: 1px solid #333;
    border-radius: 10px;
    overflow: hidden;
    transition: transform 0.2s;
  }}
  .card:hover {{
    transform: translateY(-5px);
    border-color: #d4af37;
  }}
  .card img {{
    width: 100%;
    height: 260px;
    object-fit: cover;
    background: #000;
  }}
  .info {{
    padding: 12px 14px;
  }}
  .badge {{
    font-size: 11px;
    color: #d4af37;
    text-transform: uppercase;
    letter-spacing: 1px;
  }}
  h3 {{
    margin: 6px 0 2px;
    font-size: 15px;
    font-weight: 600;
  }}
  .marca {{
    font-size: 12px;
    color: #aaa;
    margin: 0 0 8px;
  }}
  .notas {{
    font-size: 11px;
    color: #888;
    max-height: 60px;
    overflow: hidden;
    margin-bottom: 10px;
  }}
  .precio {{
    font-size: 18px;
    color: #fff;
    font-weight: bold;
    border-top: 1px solid #333;
    padding-top: 8px;
    margin: 0;
  }}
  .card.sin-stock img {{
    opacity: 0.4;
    filter: grayscale(60%);
  }}
  .card.sin-stock {{
    opacity: 0.7;
  }}
  .aviso-stock {{
    display: inline-block;
    background: #b03030;
    color: #fff;
    font-size: 11px;
    font-weight: bold;
    letter-spacing: 1px;
    padding: 3px 8px;
    border-radius: 4px;
    margin: 4px 0 8px;
  }}
</style>
</head>
<body>
  <h1>Catálogo de Perfumes</h1>
  <div class="grid">
    {cards}
  </div>
</body>
</html>
"""

with open(OUTPUT_HTML, "w", encoding="utf-8") as f:
    f.write(html)

print(f"Listo: {OUTPUT_HTML}")

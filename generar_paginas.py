"""Genera /perfume/<id>-<slug>/index.html (una pagina por perfume, con OG + JSON-LD)
y sitemap.xml completo. Lee data/products.json y data/fichas.json."""
import json, os, re, shutil, unicodedata
from html import escape as esc

SITE = "https://zenparfums.com"
WA = "543515911990"

def norm(n):
    s = re.sub(r"\s+", " ", (n or "").upper()).strip()
    while re.search(r"\|\s*\d+\s*ML\s*$", s):
        s = re.sub(r"\|\s*\d+\s*ML\s*$", "", s).strip()
    return s

def clean_name(n):
    s = "-".join(n.split("-")[1:]) if "-" in n else n
    s = s.split("|")[0] if "|" in s else s
    return s.strip()

def slugify(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")[:70]

P = json.load(open("data/products.json", encoding="utf-8"))
F = json.load(open("data/fichas.json", encoding="utf-8"))
fi = {norm(f.get("nombre_completo")): f for f in F}

CSS = ("body{margin:0;font-family:Georgia,serif;background:#faf7f2;color:#222}"
       "main{max-width:760px;margin:0 auto;padding:24px 20px 60px}"
       "a.top{color:#8a6d3b;text-decoration:none;font-size:14px}"
       ".box{display:flex;gap:24px;flex-wrap:wrap;margin-top:18px}"
       ".box img{width:280px;max-width:100%;border-radius:12px;background:#fff;object-fit:contain}"
       ".inf{flex:1;min-width:240px}h1{font-size:26px;margin:0 0 4px}"
       ".b{color:#8a6d3b;letter-spacing:.1em;font-size:13px;text-transform:uppercase}"
       ".pr{font-size:28px;margin:14px 0}.st{font-size:14px;color:#666}"
       ".btn{display:inline-block;margin:6px 8px 6px 0;padding:12px 20px;border-radius:30px;"
       "text-decoration:none;font-family:Arial,sans-serif;font-size:15px}"
       ".w{background:#25d366;color:#fff}.c{border:1px solid #8a6d3b;color:#8a6d3b}"
       "h2{font-size:17px;margin:24px 0 6px}p{line-height:1.55}")

old = "perfume"
if os.path.isdir(old):
    shutil.rmtree(old)

urls = [SITE + "/", SITE + "/match/"]
n = 0
for p in P:
    if p.get("c") == "accesorios":
        continue
    nm = clean_name(p["n"])
    brand = p["b"].title() if p["b"].isupper() else p["b"]
    title = f"{nm} — {brand}"
    slug = f"{p['id']}-{slugify(nm)}"
    url = f"{SITE}/perfume/{slug}/"
    f = fi.get(norm(p["n"])) or {}
    notas = [f.get(k) for k in ("notas_salida", "notas_corazon", "notas_fondo")]
    notas_txt = " · ".join(f"{l}: {v}" for l, v in zip(("Salida", "Corazón", "Fondo"), notas) if v)
    if not notas_txt and p.get("nt") and p["nt"] != "—":
        notas_txt = p["nt"]
    desc_f = (f.get("descripcion") or "").strip()
    precio = p.get("p") or 0
    stock = {"ok": "En stock", "low": "Últimas unidades", "out": "Sin stock"}[p["st"]]
    meta = f"{title} {p.get('s','')}".strip()
    if precio:
        meta += f" · {p['p1']}"
    meta += ". Perfume original en Zen Parfums, envíos a todo el país."
    if notas_txt:
        meta += " " + notas_txt
    meta = meta[:290]
    ld = {"@context": "https://schema.org", "@type": "Product", "name": title,
          "brand": {"@type": "Brand", "name": brand}, "description": (desc_f or meta)[:500], "url": url}
    if p.get("i"):
        ld["image"] = p["i"]
    if precio:
        ld["offers"] = {"@type": "Offer", "priceCurrency": "ARS", "price": precio, "url": url,
                        "availability": "https://schema.org/" + ("OutOfStock" if p["st"] == "out" else "InStock")}
    wa = f"https://wa.me/{WA}?text=" + re.sub(r"[^A-Za-z0-9]", lambda m: "%%%02X" % ord(m.group()), f"Hola! Me interesa {nm} ({brand})")
    html = f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)} | Zen Parfums</title>
<meta name="description" content="{esc(meta)}">
<link rel="canonical" href="{url}">
<link rel="icon" href="/img/favicon-32.png">
<meta property="og:type" content="product"><meta property="og:site_name" content="Zen Parfums">
<meta property="og:title" content="{esc(title)}{(' · ' + p['p1']) if precio else ''}">
<meta property="og:description" content="{esc(meta)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{esc(p.get('i') or SITE + '/img/og-zen.jpg')}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<style>{CSS}</style></head><body><main>
<a class="top" href="/">← Zen Parfums · Catálogo</a>
<div class="box">{('<img src="' + esc(p['i']) + '" alt="' + esc(title) + '" referrerpolicy="no-referrer">') if p.get('i') else ''}
<div class="inf"><div class="b">{esc(brand)}</div><h1>{esc(nm)}</h1>
<div class="st">{esc(p.get('s',''))} · {stock}</div>
{('<div class="pr">' + esc(p['p1']) + '</div>') if precio else ''}
<a class="btn w" href="{wa}">Consultar por WhatsApp</a>
<a class="btn c" href="/?product={p['id']}">Ver en el catálogo</a></div></div>
{('<h2>Notas</h2><p>' + esc(notas_txt) + '</p>') if notas_txt else ''}
{('<h2>Descripción</h2><p>' + esc(desc_f) + '</p>') if desc_f else ''}
</main></body></html>"""
    os.makedirs(f"perfume/{slug}", exist_ok=True)
    open(f"perfume/{slug}/index.html", "w", encoding="utf-8").write(html)
    urls.append(url)
    n += 1

sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
sm += [f"<url><loc>{u}</loc></url>" for u in urls]
sm.append("</urlset>")
open("sitemap.xml", "w", encoding="utf-8").write("\n".join(sm) + "\n")
print(f"Paginas de perfume: {n}; sitemap: {len(urls)} URLs")

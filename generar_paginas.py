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

def cap(s):
    s = s.strip()
    return s[:1].upper() + s[1:]

def notas(txt):
    parts = re.split(r"\s*,\s*|\s+y\s+", txt or "")
    return " · ".join(cap(re.sub(r"[.\s]+$", "", p)) for p in parts if p.strip())

P = json.load(open("data/products.json", encoding="utf-8"))
F = json.load(open("data/fichas.json", encoding="utf-8"))
fi = {norm(f.get("nombre_completo")): f for f in F}

CSS = """
:root{--bg:#0e0b07;--bg2:#17120b;--card:#1d1710;--line:rgba(214,178,110,.22);--gold:#d6b26e;--gold2:#f1dba5;--ink:#f4ecdc;--mut:#b9ab92;--ivory:#f5efe3;--txt:#d9ceb9}
html[data-theme=light]{--bg:#faf6ee;--bg2:#f1eadb;--card:#fff;--line:rgba(138,109,59,.3);--gold:#9a7632;--gold2:#7a5a1e;--ink:#1d1710;--mut:#6f6350;--txt:#3d3426}
html[data-theme=light] body{background:radial-gradient(1100px 600px at 75% -10%,rgba(214,178,110,.24),transparent 60%),var(--bg)}
html[data-theme=light] .stage{box-shadow:0 24px 60px rgba(90,70,30,.22),0 0 0 1px var(--line)}
.tr{display:flex;align-items:center}.tg{background:none;border:1px solid var(--line);color:var(--gold2);width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:16px;margin-left:16px;line-height:1;flex-shrink:0}.tg:hover{border-color:var(--gold)}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{background:radial-gradient(1100px 600px at 75% -10%,rgba(214,178,110,.13),transparent 60%),var(--bg);color:var(--ink);font-family:Inter,system-ui,sans-serif;font-weight:300;line-height:1.7;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration:none}
.top{display:flex;align-items:center;justify-content:space-between;max-width:1120px;margin:0 auto;padding:22px 24px}
.logo{font-family:"Cormorant Garamond",Georgia,serif;font-size:21px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold2)}
.back{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--mut);border-bottom:1px solid transparent;transition:.3s}
.back:hover{color:var(--gold2);border-color:var(--gold)}
.rule{height:1px;background:linear-gradient(90deg,transparent,var(--line),transparent);max-width:1120px;margin:0 auto}
main{max-width:1120px;margin:0 auto;padding:44px 24px 24px}
.hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.05fr);gap:56px;align-items:center}
.stage{position:relative;border-radius:22px;background:radial-gradient(circle at 50% 38%,#fffdf8 0%,var(--ivory) 55%,#e4d9c3 100%);aspect-ratio:4/5;box-shadow:0 30px 80px rgba(0,0,0,.55),0 0 0 1px var(--line),inset 0 0 0 8px rgba(14,11,7,.04);display:flex;align-items:center;justify-content:center;overflow:hidden}
.stage img{width:100%;height:100%;object-fit:contain;padding:28px;mix-blend-mode:multiply}
.stage::after{content:"";position:absolute;inset:10px;border:1px solid rgba(138,109,59,.35);border-radius:14px;pointer-events:none}
.brand{font-size:12px;letter-spacing:.34em;text-transform:uppercase;color:var(--gold);margin-bottom:14px}
h1{font-family:"Cormorant Garamond",Georgia,serif;font-weight:400;font-size:clamp(38px,5.4vw,64px);line-height:1.05;color:var(--ink);letter-spacing:.01em}
.orn{display:flex;align-items:center;gap:14px;margin:22px 0;color:var(--gold)}
.orn::before,.orn::after{content:"";height:1px;width:56px;background:var(--line)}
.orn i{width:6px;height:6px;transform:rotate(45deg);background:var(--gold)}
.tags{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:22px}
.tag{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold2);border:1px solid var(--line);padding:6px 14px;border-radius:100px}
.stk{display:inline-flex;align-items:center;gap:8px;font-size:12px;color:var(--mut);letter-spacing:.06em}
.dot{width:7px;height:7px;border-radius:50%;background:#3bb273}.dot.low{background:#e08a2e}.dot.out{background:#c0392b}
.price{font-family:"Cormorant Garamond",Georgia,serif;font-size:48px;color:var(--gold2);line-height:1;margin:6px 0 26px}
.cta{display:flex;flex-wrap:wrap;gap:12px}
.btn{display:inline-flex;align-items:center;justify-content:center;padding:16px 30px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;border-radius:3px;transition:.3s;font-weight:500}
.b1{background:linear-gradient(135deg,#e6c987,#b88f46);color:#17110a;box-shadow:0 10px 30px rgba(214,178,110,.28)}
.b1:hover{filter:brightness(1.08);transform:translateY(-1px)}
.b2{border:1px solid var(--gold);color:var(--gold2)}
.b2:hover{background:rgba(214,178,110,.1)}
.trust{display:flex;flex-wrap:wrap;gap:6px 22px;margin-top:26px;font-size:11px;letter-spacing:.1em;color:var(--mut);text-transform:uppercase}
.trust span::before{content:"\\25C6";color:var(--gold);margin-right:8px;font-size:8px;vertical-align:1px}
section.blk{margin-top:70px}
.h2{font-family:"Cormorant Garamond",Georgia,serif;font-size:32px;font-weight:400;color:var(--ink);display:flex;align-items:center;gap:18px;margin-bottom:26px}
.h2::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--line),transparent)}
.facts{display:grid;grid-template-columns:repeat(3,1fr);gap:0;background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.fact{background:var(--card);padding:18px 20px;outline:1px solid var(--line);outline-offset:-.5px}
.fl{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold);margin-bottom:5px}
.fv{font-size:15px;color:var(--ink)}
.tl{position:relative;padding-left:34px;max-width:620px}
.tl::before{content:"";position:absolute;left:6px;top:10px;bottom:10px;width:1px;background:linear-gradient(var(--gold),rgba(214,178,110,.15))}
.nt{position:relative;margin-bottom:26px}.nt:last-child{margin-bottom:0}
.nt::before{content:"";position:absolute;left:-33px;top:7px;width:9px;height:9px;transform:rotate(45deg);background:var(--gold)}
.nl{font-size:11px;letter-spacing:.24em;text-transform:uppercase;color:var(--gold);margin-bottom:4px}
.nv{font-family:"Cormorant Garamond",Georgia,serif;font-size:25px;color:var(--ink);line-height:1.3}
.txt{max-width:740px;font-size:16px;color:var(--txt)}
.insp{display:flex;gap:18px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px;margin-bottom:12px;max-width:740px}
.insp img{width:70px;height:94px;object-fit:cover;border-radius:6px;flex-shrink:0;background:#fff}
.insp b{display:block;font-family:"Cormorant Garamond",Georgia,serif;font-size:22px;font-weight:500;color:var(--gold2);margin-bottom:4px}
.insp p{font-size:14px;color:var(--mut)}
.more{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.mc{background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden;transition:.3s}
.mc:hover{transform:translateY(-4px);border-color:var(--gold)}
.mc .im{aspect-ratio:1;background:var(--ivory);display:flex;align-items:center;justify-content:center}
.mc img{width:100%;height:100%;object-fit:contain;padding:12px;mix-blend-mode:multiply}
.mc .tx{padding:12px 14px 14px}
.mc small{display:block;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold)}
.mc span{display:block;font-family:"Cormorant Garamond",Georgia,serif;font-size:19px;line-height:1.2;margin:3px 0 6px}
.mc em{font-style:normal;font-size:14px;color:var(--gold2)}
footer{max-width:1120px;margin:80px auto 0;padding:36px 24px 46px;text-align:center;color:var(--mut);font-size:12px;letter-spacing:.12em}
footer .logo{display:block;margin-bottom:10px;font-size:17px}
.fact:last-child:nth-child(odd){grid-column:1/-1}
@media(max-width:820px){.top{padding:18px 18px}.logo{font-size:16px;letter-spacing:.22em;white-space:nowrap}.back{font-size:10px;letter-spacing:.12em;text-align:right}.hero{grid-template-columns:1fr;gap:30px}.stage{aspect-ratio:1/1;max-width:520px;margin:0 auto;width:100%}.facts{grid-template-columns:repeat(2,1fr)}.more{grid-template-columns:repeat(2,1fr)}main{padding-top:24px}.price{font-size:42px}.btn{flex:1}section.blk{margin-top:52px}}
"""

old = "perfume"
if os.path.isdir(old):
    shutil.rmtree(old)

by_brand = {}
for p in P:
    if p.get("c") != "accesorios" and p["st"] != "out" and p.get("i"):
        by_brand.setdefault(p["b"], []).append(p)

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
    sal, cor, fon = f.get("notas_salida"), f.get("notas_corazon"), f.get("notas_fondo")
    notas_txt = " · ".join(f"{l}: {v}" for l, v in zip(("Salida", "Corazón", "Fondo"), (sal, cor, fon)) if v)
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

    tags = "".join(f'<span class="tag">{esc(x)}</span>' for x in (p.get("s"), f.get("genero"), f.get("concentracion")) if x)
    facts = "".join(f'<div class="fact"><div class="fl">{l}</div><div class="fv">{esc(v)}</div></div>'
                    for l, v in (("Estación", f.get("estacion")), ("Momento", f.get("momento_dia")), ("Duración", f.get("duracion")),
                                 ("Estela", f.get("estela")), ("Proyección", f.get("proyeccion")), ("Clima", f.get("clima")),
                                 ("Familia olfativa", f.get("familia_olfativa")), ("Ocasión", f.get("ocasion")),
                                 ("Color del líquido", f.get("color_liquido"))) if v)
    if not (sal or cor or fon) and p.get("nt") and p["nt"] != "—":
        piram = f'<div class="nt"><div class="nv">{esc(notas(p["nt"]))}</div></div>'
    else:
        piram = "".join(f'<div class="nt"><div class="nl">{l}</div><div class="nv">{esc(notas(v))}</div></div>'
                        for l, v in (("Salida", sal), ("Corazón", cor), ("Fondo", fon)) if v)
    insp = ""
    for i in (f.get("inspiraciones") or []):
        if i and (i.get("nombre") or i.get("imagen_url")):
            insp += ('<div class="insp">' + (f'<img src="{esc(i["imagen_url"])}" alt="" loading="lazy" referrerpolicy="no-referrer">' if i.get("imagen_url") else "") +
                     '<div>' + (f'<b>{esc(i["nombre"])}</b>' if i.get("nombre") else "") + (f'<p>{esc(i["texto"])}</p>' if i.get("texto") else "") + '</div></div>')
    if not insp and f.get("inspirado_en_nombre"):
        insp = f'<div class="insp"><div><b>{esc(f["inspirado_en_nombre"])}</b>' + (f'<p>{esc(f["inspirado_en"])}</p>' if f.get("inspirado_en") else "") + '</div></div>'
    estilo = (f.get("estilo_descripcion") or f.get("perfil_usuario") or "").strip()

    def sec(t, body):
        return f'<section class="blk"><h2 class="h2">{t}</h2>{body}</section>' if body else ""

    otros = [q for q in by_brand.get(p["b"], []) if q["id"] != p["id"]][:4]
    more = ""
    if otros:
        more = '<div class="more">' + "".join(
            f'<a class="mc" href="/perfume/{q["id"]}-{slugify(clean_name(q["n"]))}/"><div class="im"><img src="{esc(q["i"])}" alt="{esc(clean_name(q["n"]))}" loading="lazy" referrerpolicy="no-referrer"></div>'
            f'<div class="tx"><small>{esc(brand)}</small><span>{esc(clean_name(q["n"]))}</span><em>{esc(q["p1"]) if q.get("p") else ""}</em></div></a>' for q in otros) + '</div>'

    html = f"""<!doctype html>
<html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)} | Zen Parfums</title>
<meta name="description" content="{esc(meta)}">
<meta name="theme-color" content="#0e0b07">
<link rel="canonical" href="{url}">
<link rel="icon" href="/img/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500&family=Inter:wght@300;400;500&display=swap" rel="stylesheet">
<meta property="og:type" content="product"><meta property="og:site_name" content="Zen Parfums">
<meta property="og:title" content="{esc(title)}{(' · ' + p['p1']) if precio else ''}">
<meta property="og:description" content="{esc(meta)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{esc(p.get('i') or SITE + '/img/og-zen.jpg')}">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<script>try{{if(localStorage.getItem("zp-theme")==="light")document.documentElement.setAttribute("data-theme","light")}}catch(e){{}}</script>
<style>{CSS}</style></head><body>
<header class="top"><a class="logo" href="/">Zen Parfums</a><div class="tr"><a class="back" href="/?product={p['id']}">Ver en el catálogo</a><button class="tg" id="tg" type="button" aria-label="Cambiar tema">◐</button></div></header>
<div class="rule"></div>
<main>
<div class="hero">
<div class="stage">{('<img src="' + esc(p['i']) + '" alt="' + esc(title) + '" referrerpolicy="no-referrer">') if p.get('i') else ''}</div>
<div>
<div class="brand">{esc(f.get('marca') or brand)}</div>
<h1>{esc(nm)}</h1>
<div class="orn"><i></i></div>
<div class="tags">{tags}</div>
<div class="stk"><span class="dot {p['st']}"></span>{stock}</div>
{('<div class="price">' + esc(p['p1']) + '</div>') if precio else '<div style="height:26px"></div>'}
<div class="cta"><a class="btn b1" href="{wa}">Consultar por WhatsApp</a><a class="btn b2" href="/?product={p['id']}">Ver en el catálogo</a></div>
<div class="trust"><span>100% original</span><span>Envíos a todo el país</span><span>Atención personalizada</span></div>
</div></div>
{sec('Perfil olfativo', ('<div class="facts">' + facts + '</div>') if facts else '')}
{sec('Pirámide olfativa', ('<div class="tl">' + piram + '</div>') if piram else '')}
{sec('Descripción', ('<p class="txt">' + esc(desc_f) + '</p>') if desc_f else '')}
{sec('Para quién es', ('<p class="txt">' + esc(estilo) + '</p>') if estilo else '')}
{sec('Inspirado en', insp)}
{sec('Más de ' + esc(brand), more)}
</main>
<footer><a class="logo" href="/">Zen Parfums</a>Perfumes originales · Córdoba, Argentina</footer>
<script>document.getElementById("tg").onclick=function(){{var d=document.documentElement,l=d.getAttribute("data-theme")==="light";if(l)d.removeAttribute("data-theme");else d.setAttribute("data-theme","light");try{{localStorage.setItem("zp-theme",l?"dark":"light")}}catch(e){{}}}}</script>
</body></html>"""
    os.makedirs(f"perfume/{slug}", exist_ok=True)
    open(f"perfume/{slug}/index.html", "w", encoding="utf-8").write(html)
    urls.append(url)
    n += 1

sm = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
sm += [f"<url><loc>{u}</loc></url>" for u in urls]
sm.append("</urlset>")
open("sitemap.xml", "w", encoding="utf-8").write("\n".join(sm) + "\n")
print(f"Paginas de perfume: {n}; sitemap: {len(urls)} URLs")

# -*- coding: utf-8 -*-
"""Genera una ficha técnica a partir de las notas + acordes que Belle manda en
cada producto, para los perfumes que no tienen ficha propia en la tabla.

La tabla de fichas de Belle (fichas_perfume) dejó de devolver filas a nuestra
clave en nov/2026; sin esto, todo producto nuevo se queda sin pirámide partida,
sin familia olfativa y sin descripción. Acá reconstruimos lo reconstruible:

  - familia olfativa  -> de los acordes (dato real de Belle, mismo formato que
    usan las fichas de ellos: la lista de acordes por % descendente)
  - pirámide          -> parseada del texto de `notas` cuando trae los rótulos
    "Notas de salida/corazón/fondo" (si viene plana, se deja plana)
  - momento, estación, ocasión, estela, duración, descripción, para-quién
    -> deducidos del eje olfativo dominante. Esto es ESTIMADO, no dato de Belle,
    por eso la ficha queda marcada con "generada": True y el front lo rotula.

Si Belle alguna vez vuelve a mandar la ficha real, esa gana: sólo generamos
para los nombres que no están en el set de fichas reales.
"""
import re
import unicodedata

__all__ = ["generar_ficha", "acordes_ordenados", "piramide_de_notas"]


def _sinac(s):
    return "".join(c for c in unicodedata.normalize("NFD", str(s))
                   if unicodedata.category(c) != "Mn").lower()


# typos y variantes que trae Belle en los nombres de acorde
_FIX = {
    "fesco": "fresco", "aresco": "fresco", "aresco especiado": "fresco especiado",
    "fresco especiad": "fresco especiado", "especiado fresco": "fresco especiado",
    "amizclado": "almizclado", "wihisky": "whisky", "patchouli": "pachuli",
    "tepernico": "terpenico", "nuece": "nueces",
}


def _norm_acorde(nombre):
    s = _sinac(nombre).strip().strip(".").strip()
    s = re.sub(r"\s+", " ", s)
    return _FIX.get(s, s)


def acordes_ordenados(acordes):
    """[(norm, display, pct)] ordenado por pct desc, sin duplicados.
    Acepta la lista de dicts o el string JSON crudo de Belle."""
    import json
    if isinstance(acordes, str):
        try:
            acordes = json.loads(acordes)
        except Exception:
            return []
    if not isinstance(acordes, list):
        return []
    items = sorted((a for a in acordes if isinstance(a, dict) and a.get("nombre")),
                   key=lambda a: -(a.get("pct") or 0))
    vistos, out = set(), []
    for a in items:
        n = _norm_acorde(a["nombre"])
        if not n or n in vistos:
            continue
        vistos.add(n)
        disp = re.sub(r"\s+", " ", str(a["nombre"]).strip().strip(".")).strip()
        disp = disp[:1].upper() + disp[1:]
        out.append((n, disp, a.get("pct") or 0))
    return out


def piramide_de_notas(notas):
    """(salida, corazon, fondo, plano). Si trae los rótulos, parte la pirámide;
    si no, devuelve el texto plano en el 4º valor."""
    if not notas:
        return None, None, None, None
    t = re.sub(r"\s+", " ", str(notas)).strip()
    m = {}
    for lab, key in [("salida", "sal"), ("coraz[oó]n", "cor"), ("fondo", "fon"), ("base", "fon")]:
        rx = re.search(r"notas?\s+de\s+" + lab +
                       r"\s*[:\-–]?\s*(.+?)(?=notas?\s+de\s+(?:salida|coraz|fondo|base)|$)",
                       t, re.I)
        if rx:
            val = rx.group(1).strip(" .;:-")
            if val and key not in m:
                m[key] = val
    if m:
        return m.get("sal"), m.get("cor"), m.get("fon"), None
    return None, None, None, t.strip(" .;:-")


# ejes olfativos para deducir el perfil
_EJES = {
    "fresco": {"citrico", "fresco", "fresco especiado", "acuatico", "marino", "ozonico",
               "verde", "aromatico", "lavanda", "herbal", "mentolado", "menta", "mineral",
               "metalico", "aldehidico", "conifera", "terpenico", "salado", "tropical",
               "frutal", "citrico suave", "champan", "vodka"},
    "gourmand": {"dulce", "avainillado", "vainillado", "caramelo", "chocolate", "cacao",
                 "cafe", "coco", "amielado", "miel", "almendrado", "nueces", "lactonico",
                 "acerezado", "pistacho", "ron", "whisky", "alcohol", "gourmand",
                 "cera de abeja"},
    "oriental": {"amaderado", "ambar", "ambarado", "ambar gris", "oud", "cuero", "tabaco",
                 "calido especiado", "especiado", "especiado suave", "especiado calido",
                 "canela", "ahumado", "balsamico", "resinoso", "pachuli", "musgoso", "musgo",
                 "musgo de roble", "terroso", "terrosos", "incienso", "chipre", "anis"},
    "floral": {"floral", "floral blanco", "florales", "rosas", "rosa", "nardos", "iris",
               "violeta", "jazmin", "azahar", "floral amarillo", "blanco"},
    "polvo": {"atalcado", "almizclado", "animalico"},
}


def _eje_de(nombre):
    for eje, s in _EJES.items():
        if nombre in s:
            return eje
    return None


_PERFILES = {
    "fresco": dict(
        momento="Día / Tarde", estacion="Primavera / Verano", clima="Cálido / Templado",
        duracion="Moderada (5h a 7h)", estela="Moderada", proyeccion="Media",
        ocasion="Uso diario, oficina, deporte y salidas al aire libre.",
        estilo="Pensado para quienes buscan frescura limpia y versátil para todos los días.",
        intro="Un perfume fresco y luminoso",
        cierre="Deja una estela limpia, fácil de llevar todos los días."),
    "gourmand": dict(
        momento="Tarde / Noche", estacion="Otoño / Invierno", clima="Templado / Fresco / Frío",
        duracion="Prolongada (7h a 9h)", estela="Intensa", proyeccion="Alta",
        ocasion="Salidas nocturnas, citas y ocasiones donde buscás acaparar cumplidos.",
        estilo="Para quienes disfrutan de fragancias dulces, envolventes y adictivas.",
        intro="Un perfume dulce y envolvente",
        cierre="Deja una estela golosa y adictiva que invita a acercarse."),
    "oriental": dict(
        momento="Tarde / Noche", estacion="Otoño / Invierno", clima="Templado / Fresco / Frío",
        duracion="Excepcional (8h a 12h)", estela="Intensa", proyeccion="Muy alta",
        ocasion="Eventos, salidas nocturnas y reuniones de alto nivel.",
        estilo="Diseñado para una presencia fuerte y de carácter, con estela que deja huella.",
        intro="Un perfume cálido y amaderado",
        cierre="Deja una estela intensa y con carácter que perdura por horas."),
    "floral": dict(
        momento="Día / Tarde / Noche", estacion="Primavera / Otoño",
        clima="Cálido / Templado / Fresco", duracion="Moderada (6h a 8h)",
        estela="Moderada", proyeccion="Media",
        ocasion="Uso diario, trabajo, citas y eventos de día o de noche.",
        estilo="Para quienes buscan elegancia floral versátil, fácil de llevar a cualquier lado.",
        intro="Un perfume floral y elegante",
        cierre="Deja una estela delicada y versátil para cualquier momento."),
    "polvo": dict(
        momento="Día / Tarde / Noche", estacion="Todo el año",
        clima="Cálido / Templado / Fresco", duracion="Moderada (6h a 8h)",
        estela="Moderada", proyeccion="Media",
        ocasion="Uso diario distinguido, oficina y salidas.",
        estilo="Para quienes prefieren fragancias prolijas, de piel, suaves y elegantes.",
        intro="Un perfume suave y aterciopelado",
        cierre="Deja una estela prolija y sensual, muy pegada a la piel."),
}


def _notas_clave(sal, cor, fon, plano, n=3):
    def trozos(s):
        if not s:
            return []
        return [re.sub(r"\([^)]*\)", "", x).strip(" .").strip()
                for x in re.split(r"[,;·]", s) if x.strip()]
    if plano:
        pool = trozos(plano)
    else:
        pool = []
        for parte in (sal, cor, fon):
            t = trozos(parte)
            if t:
                pool.append(t[0])
        for parte in (sal, cor, fon):
            for x in trozos(parte):
                if x not in pool:
                    pool.append(x)
    out = []
    for x in pool:
        xl = x.lower()
        if xl and xl not in [o.lower() for o in out]:
            out.append(xl)
        if len(out) >= n:
            break
    return out


def generar_ficha(nombre_completo, marca, notas, acordes):
    """Devuelve el dict de ficha generada, o None si no hay con qué (p. ej. un kit
    sin notas ni acordes)."""
    acs = acordes_ordenados(acordes)
    sal, cor, fon, plano = piramide_de_notas(notas)
    if not acs and not (sal or cor or fon or plano):
        return None

    ficha = {
        "nombre_completo": nombre_completo,
        "marca": marca,
        "notas_salida": sal,
        "notas_corazon": cor,
        "notas_fondo": fon,
        "generada": True,
    }
    if acs:
        ficha["familia_olfativa"] = ", ".join(d for _n, d, _p in acs)

        peso = {}
        for n, _d, p in acs[:6]:
            e = _eje_de(n)
            if e:
                peso[e] = peso.get(e, 0) + (p or 0)
        dom = max(peso, key=peso.get) if peso else "floral"
        R = _PERFILES[dom]

        nk = _notas_clave(sal, cor, fon, plano)
        desc = R["intro"]
        if nk:
            desc += ", con " + (nk[0] if len(nk) == 1 else ", ".join(nk[:-1]) + " y " + nk[-1])
        desc += ". " + R["cierre"]

        ficha.update(
            momento_dia=R["momento"], estacion=R["estacion"], clima=R["clima"],
            ocasion=R["ocasion"], duracion=R["duracion"], estela=R["estela"],
            proyeccion=R["proyeccion"], descripcion=desc, estilo_descripcion=R["estilo"],
        )

    # limpiar claves None
    return {k: v for k, v in ficha.items() if v is not None}

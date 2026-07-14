/**
 * Pipeline de datos: descarga productos + fichas de Supabase, aplica los
 * transforms de shared/, joinea fichas por nombre normalizado y emite
 * data/catalog.json + data/fichas.json. Reemplaza a actualizar_catalogo.py.
 *
 * Uso:
 *   tsx scripts/fetch-catalog.ts            # build real (requiere SUPABASE_KEY)
 *   tsx scripts/fetch-catalog.ts --fixture  # sin red, usa tests/fixtures/*
 *
 * NFR-007: los data/*.json son artefactos, no se commitean (ver .gitignore).
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import { calcularPrecio, formatearPrecio, margenesFromEnv } from "../shared/transform/precio.ts";
import { calcularStock } from "../shared/transform/stock.ts";
import { mapearGenero } from "../shared/transform/genero.ts";
import { parseNotas, parsePiramide } from "../shared/transform/notas.ts";
import { cleanName, getConcentracion, getTamanoMl, normName, slugify } from "../shared/transform/slug.ts";
import type { Ficha, Product } from "../shared/types.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SUPABASE_URL = "https://syylbuvjuekkanxynpps.supabase.co/rest/v1";
const FICHAS_TABLE_CANDIDATES = [
  "fichas_perfume", "fichas_perfumes", "fichas_tecnicas", "fichas",
  "ficha_producto", "fichas_productos", "producto_fichas",
];
const FICHA_CAMPOS = [
  "nombre_completo", "marca", "anno", "concentracion", "genero", "familia_olfativa",
  "inspirado_en", "notas_salida", "notas_corazon", "notas_fondo", "descripcion",
  "momento_dia", "estacion", "ocasion", "clima", "proyeccion", "duracion", "estela",
  "color_liquido", "perfil_usuario", "rango_edad_min", "rango_edad_max",
  "estilo_descripcion", "inspirado_en_imagen_url", "inspirado_en_nombre", "inspiraciones",
] as const;
const CAT_MAP: Record<string, string> = {
  arabes: "arabes",
  internacionales: "internacional",
  accesorios: "accesorios",
};
const NOTA_KEYS = [
  "descripcion", "descripcion_olfativa", "descripcion_olf", "notas",
  "notas_olfativas", "notas_olf", "notes", "notes_olfativas",
];

const REQUEST_TIMEOUT = 30_000;
const MAX_RETRIES = 3;

async function httpGet(url: string, apiKey: string): Promise<Response> {
  let lastErr: unknown;
  for (let intento = 1; intento <= MAX_RETRIES; intento++) {
    try {
      return await fetch(url, {
        headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
    } catch (e) {
      lastErr = e;
      console.warn(`  intento ${intento}/${MAX_RETRIES} falló para ${url}: ${String(e)}`);
      if (intento < MAX_RETRIES) await new Promise((r) => setTimeout(r, 2000 * intento));
    }
  }
  throw lastErr;
}

/** Solo se publican URLs https (NFR-005). */
function imagenValida(url: unknown): string {
  const s = String(url ?? "").trim();
  return s.startsWith("https://") ? s : "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function transformarProducto(row: Row, margenes: { normal: number; tubbees: number }): Product {
  const nombreCompleto = String(row.nombre ?? "").trim();
  const marca = String(row.empresa ?? "").trim();
  const precio = calcularPrecio(row.precio_min_ars, marca, margenes);

  let notaTexto: unknown = "";
  for (const key of NOTA_KEYS) {
    const val = row[key];
    if (val != null && String(val).trim()) { notaTexto = val; break; }
  }

  const ml = getTamanoMl(nombreCompleto) ?? (row.ml != null ? Number(row.ml) : null);
  const categoria = CAT_MAP[String(row.cat_catalogo ?? "").trim()] ?? String(row.cat_catalogo ?? "").trim();

  return {
    id: Number(row.id),
    slug: slugify(marca, cleanName(nombreCompleto)),
    marca,
    nombre: cleanName(nombreCompleto),
    nombreCompleto,
    concentracion: getConcentracion(nombreCompleto),
    tamanoMl: Number.isFinite(ml) ? ml : null,
    precio,
    precioFmt: formatearPrecio(precio),
    categoria,
    genero: mapearGenero(row.genero),
    stock: calcularStock(row.stock_actual),
    imagenUrl: imagenValida(row.imagen_url),
    notas: parseNotas(notaTexto),
  };
}

/** Mapea un registro legacy (#pdata) al nuevo modelo Product, para modo fixture. */
function legacyAProducto(p: Row): Product {
  const nombreCompleto = String(p.n ?? "");
  const texto = p.nt && p.nt !== "—" ? String(p.nt) : null;
  return {
    id: Number(p.id),
    slug: slugify(p.b, cleanName(nombreCompleto)),
    marca: String(p.b ?? ""),
    nombre: cleanName(nombreCompleto),
    nombreCompleto,
    concentracion: getConcentracion(nombreCompleto),
    tamanoMl: getTamanoMl(nombreCompleto) ?? (p.s ? Number(String(p.s).replace(/\D/g, "")) || null : null),
    precio: Number(p.p) || 0,
    precioFmt: p.p1 ?? formatearPrecio(Number(p.p) || 0),
    categoria: String(p.c ?? ""),
    genero: p.g ?? "unisex",
    stock: p.st ?? "out",
    imagenUrl: imagenValida(p.i),
    notas: { texto, piramide: parsePiramide(texto) },
  };
}

function normalizarFichas(raw: Row[]): Ficha[] {
  const out: Ficha[] = [];
  for (const f of raw) {
    if (f.activo === false) continue;
    const ficha: Row = { slug: slugify(String(f.nombre_completo ?? "")) };
    for (const k of FICHA_CAMPOS) {
      if (f[k] != null && f[k] !== "") ficha[k] = f[k];
    }
    out.push(ficha as Ficha);
  }
  return out;
}

/** Enlaza cada producto con su ficha por nombre normalizado; reporta huérfanas. */
function joinFichas(productos: Product[], fichas: Ficha[]): void {
  const porNombre = new Map<string, Ficha>();
  for (const f of fichas) porNombre.set(normName(f.nombre_completo), f);

  const usadas = new Set<string>();
  for (const p of productos) {
    const key = normName(p.nombreCompleto);
    const f = porNombre.get(key);
    if (f) { p.fichaSlug = f.slug; usadas.add(key); }
  }
  const huerfanas = fichas.filter((f) => !usadas.has(normName(f.nombre_completo)));
  if (huerfanas.length) {
    console.warn(`ADVERTENCIA: ${huerfanas.length} ficha(s) huérfana(s) sin producto que matchee:`);
    for (const f of huerfanas.slice(0, 20)) console.warn(`  - ${f.nombre_completo}`);
  }
}

async function main() {
  const fixture = process.argv.includes("--fixture");
  const margenes = margenesFromEnv();
  let productos: Product[];
  let fichas: Ficha[];

  if (fixture) {
    console.log("Modo fixture: leyendo tests/fixtures/legacy-*.json (sin red).");
    const pdata = JSON.parse(await readFile(resolve(ROOT, "tests/fixtures/legacy-pdata.json"), "utf8")) as Row[];
    const fdata = JSON.parse(await readFile(resolve(ROOT, "tests/fixtures/legacy-fdata.json"), "utf8")) as Row[];
    productos = pdata.map(legacyAProducto);
    fichas = normalizarFichas(fdata);
  } else {
    const apiKey = process.env.SUPABASE_KEY;
    if (!apiKey) throw new Error("Falta la variable de entorno SUPABASE_KEY");

    console.log("Descargando productos...");
    const resP = await httpGet(`${SUPABASE_URL}/productos?select=*`, apiKey);
    if (!resP.ok) throw new Error(`Error productos: ${resP.status} ${await resP.text()}`);
    let rows = (await resP.json()) as Row[];
    console.log(`Productos descargados: ${rows.length}`);

    rows = rows.filter((r) => r.activo === true).filter((r) => r.oculto == null || r.oculto === false);

    console.log("Buscando tabla de fichas...");
    let fichasRaw: Row[] = [];
    for (const tabla of FICHAS_TABLE_CANDIDATES) {
      const r = await httpGet(`${SUPABASE_URL}/${tabla}?select=*`, apiKey);
      if (r.ok) {
        const data = (await r.json()) as Row[];
        if (Array.isArray(data) && data.length > 0 && "nombre_completo" in data[0]!) {
          fichasRaw = data;
          console.log(`Fichas descargadas de '${tabla}': ${data.length}`);
          break;
        }
      }
    }
    if (!fichasRaw.length) console.warn("ADVERTENCIA: no se encontró tabla de fichas técnicas.");

    productos = rows.map((r) => transformarProducto(r, margenes));
    fichas = normalizarFichas(fichasRaw);
  }

  joinFichas(productos, fichas);

  const dataDir = resolve(ROOT, "data");
  await mkdir(dataDir, { recursive: true });
  await writeFile(resolve(dataDir, "catalog.json"), JSON.stringify(productos), "utf8");
  await writeFile(resolve(dataDir, "fichas.json"), JSON.stringify(fichas), "utf8");
  console.log(`Escritos ${productos.length} productos y ${fichas.length} fichas en data/.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

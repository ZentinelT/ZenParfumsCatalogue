# Implementation Plan: Refactor del catálogo Zen Parfums a Nuxt SSG

**Branch**: `refactor/nuxt` | **Spec**: [spec.md](spec.md)
**Input**: Especificación funcional de `spec.md`

## Resumen

Reemplazar el monolito `index.html` (1 MB con datos embebidos, actualizado por regex desde Python y commiteado cada 3 h) por una aplicación **Nuxt 4 + TypeScript** generada estáticamente (`nuxi generate`), desplegada en **GitHub Pages** vía `actions/deploy-pages` sin commits de artefactos, con datos obtenidos de **Supabase en build** y **revalidación de stock/precio en runtime** (modo híbrido).

## Contexto técnico

**Lenguaje/Versión**: TypeScript 5.x, Node 22
**Framework**: Nuxt 4 (modo SSG estricto — GitHub Pages no soporta SSR)
**Estado**: Pinia + `pinia-plugin-persistedstate`
**Gestor de paquetes**: pnpm
**Testing**: Vitest (+ @vue/test-utils), Playwright (e2e)
**Lint**: ESLint flat config + `@nuxt/eslint`
**Datos**: Supabase REST (`https://syylbuvjuekkanxynpps.supabase.co/rest/v1/`), tablas `productos` y fichas técnicas
**Hosting**: GitHub Pages — **project page, sin dominio custom** (T002 resuelto vía
`gh api repos/ZentinelT/ZenParfumsCatalogue/pages`: `cname: null`,
`html_url: https://zentinelt.github.io/ZenParfumsCatalogue/`). Valores definitivos:
`app.baseURL = /ZenParfumsCatalogue/` y `site.url = https://zentinelt.github.io`
(solo el origen: sitemap y canonical le suman el baseURL).
Hoy Pages sirve `source: branch main` (el sitio legacy); el cutover a "GitHub Actions" es T040.
**Restricción clave**: todo lo dinámico post-build ocurre en el navegador; no hay backend propio.

## Arquitectura

```
Supabase (productos + fichas)
   │  build time (cron 3 h / workflow_dispatch / push a main)
   ▼
scripts/fetch-catalog.ts ──► data/catalog.json + data/fichas.json  (artefactos, en .gitignore)
   ▼
nuxi generate ──► .output/public  (/, /perfume/[slug], sitemap.xml)
   ▼
actions/deploy-pages ──► GitHub Pages

Runtime (navegador):
useStockRevalidation() ──► GET Supabase REST (anon key + RLS, vista pública
                            con solo: id/nombre, stock_actual, precio_min_ars)
                       ──► pisa stock/precio en memoria; ante error, quedan
                            los datos del build (degradación silenciosa)
```

### Decisiones y racionales

| Decisión | Racional |
|---|---|
| Nuxt SSG en vez de SPA actual | SEO por producto (HU-3), HTML inicial chico (NFR-001), templating de Vue elimina la inyección por `innerHTML` (NFR-005) |
| Datos como artefacto de build, no commit | Elimina el crecimiento del historial (NFR-007, HU-2.4) |
| Port de la lógica Python → TS en `shared/` | Hoy el parseo de notas está duplicado en Python y JS; una sola implementación tipada y testeada (FR-005/006/007) |
| Join de fichas por nombre normalizado **en build** | El matching frágil deja de ejecutarse en cada cliente; huérfanas se reportan una vez en el log (HU-2.3) |
| Revalidación runtime solo de stock/precio | Mínima superficie expuesta vía anon key; el resto del contenido no cambia entre builds (HU-5) |
| `@nuxtjs/color-mode` | Persistencia + sin flash (HU-4.3) y elimina la cascada de `!important` del dark mode actual |

## Estructura del proyecto

```
app/
├── assets/css/tokens.css        # variables actuales (--go, --fd, --w, …) light/dark
├── components/
│   ├── SiteHeader.vue           # header sticky + badges carrito/favoritos
│   ├── MobileMenu.vue
│   ├── TheHero.vue              # hero + trust bar (estático)
│   ├── TrustSections.vue        # nosotros / stats / confianza / CTA
│   ├── SiteFooter.vue
│   ├── CatalogGrid.vue          # orquesta búsqueda + filtros + grilla + paginación
│   ├── CatalogSearch.vue
│   ├── CatalogFilters.vue
│   ├── ProductCard.vue
│   ├── ProductModal.vue
│   ├── FichaTecnica.vue         # modal ficha + reuso en página de detalle
│   ├── CartDrawer.vue
│   ├── WishlistDrawer.vue
│   ├── PaginationBar.vue
│   └── NotificationToast.vue
├── composables/
│   ├── useCatalog.ts            # filtro + búsqueda + paginación (estado de UI)
│   ├── useStockRevalidation.ts  # FR-016
│   └── useWhatsAppCheckout.ts   # FR-012
├── stores/
│   ├── cart.ts                  # persistido en clave zp2 (migración incluida)
│   └── wishlist.ts              # persistido en clave zp-wish
├── pages/
│   ├── index.vue                # landing + catálogo
│   └── perfume/[slug].vue       # detalle SEO con JSON-LD Product
shared/
├── types.ts                     # Product, Ficha, StockStatus, …
└── transform/
    ├── precio.ts                # calcularPrecio (márgenes por env: MARGEN_NORMAL, MARGEN_TUBBEES)
    ├── stock.ts                 # calcularStock (ok/low/out)
    ├── genero.ts                # ♀/♂/unisex
    ├── notas.ts                 # parseNotas (única implementación)
    └── slug.ts                  # normName + slugify (usado por join de fichas y rutas)
scripts/
└── fetch-catalog.ts             # descarga Supabase, transforma, joinea fichas, emite data/*.json
data/                            # .gitignore — solo existe en build local/CI
specs/001-refactor-catalogo/     # esta documentación
```

Convención de nombre de producto (formato actual `CÓDIGO - NOMBRE | CONCENTRACIÓN | 100ML`): el parseo de nombre limpio, concentración y tamaño vive en `shared/transform/` y se ejecuta en build; el cliente recibe campos ya separados.

## Datos

### Modelo publicado (build)

`data/catalog.json` — por producto: `id` (estable, derivado de Supabase, no del índice del loop como hoy), `slug`, `marca`, `nombre`, `concentracion`, `tamanoMl`, `precio`, `precioFmt`, `categoria` (`arabes`/`internacional`/`accesorios`), `genero` (`hombre`/`mujer`/`unisex`), `stock` (`ok`/`low`/`out`), `imagenUrl`, `notas` (`{salida, corazon, fondo}` o texto libre), `fichaSlug?`.

`data/fichas.json` — fichas activas con los 25 campos actuales de `FICHA_CAMPOS`.

### Supabase

- **Build**: fetch con la key actual de secrets (`SUPABASE_KEY`) — se mantiene fuera del cliente.
- **Runtime**: crear **vista pública** (p.ej. `catalogo_publico`) con solo `nombre`/`id`, `stock_actual`, `precio_min_ars`, `activo`, y política RLS de SELECT anónimo únicamente sobre esa vista. La anon key embebida en el cliente solo puede leer eso.
- El cálculo de margen para el precio revalidado se hace en el cliente con los márgenes inyectados en build (públicos de facto, ya que el precio final se publica).

## Infra / CI-CD

### `.github/workflows/ci.yml` (nuevo)
PR y push a `main`: `pnpm lint` → `nuxi typecheck` → `vitest run` → `nuxi generate` (con fixture de datos, sin Supabase).

### `.github/workflows/deploy.yml` (reemplaza `actualizar-catalogo.yml`)
Triggers: `schedule: 0 */3 * * *`, `workflow_dispatch`, `push: main`.
Pasos: checkout → pnpm install → `tsx scripts/fetch-catalog.ts` (secrets: `SUPABASE_KEY`; env: `MARGEN_NORMAL=15000`, `MARGEN_TUBBEES=10000`) → `nuxi generate` → `actions/upload-pages-artifact` → `actions/deploy-pages`.
Permisos: `pages: write`, `id-token: write`. **Sin** `contents: write`.

### GitHub Pages
Cambiar la fuente de Pages de "branch" a "GitHub Actions". Si no hay dominio custom, `app.baseURL = '/ZenParfumsCatalogue/'`.

## Seguridad

- Templating de Vue con binding de atributos (`:src`) — elimina la interpolación cruda actual en `innerHTML`.
- Validación de `imagenUrl` en build (solo `https:`).
- RLS + vista pública para la anon key (arriba).
- CSP por meta tag: `default-src 'self'; img-src https:; connect-src <supabase>; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com`.
- `referrerpolicy="no-referrer"` en imágenes externas (se conserva del sitio actual).

## Testing

- **Unit (Vitest)**: `shared/transform/*` — casos reales extraídos del `pdata` actual como fixtures; **test de paridad**: la salida de `fetch-catalog.ts` sobre un dump del JSON embebido actual debe coincidir con lo que publica hoy el pipeline Python (precio, stock, género, notas).
- **Stores**: agregar/quitar/cantidades, migración de claves legacy, localStorage corrupto.
- **e2e (Playwright)**: flujo filtrar → buscar → abrir modal → agregar al carrito → abrir drawer → interceptar `window.open` y validar el mensaje de WhatsApp (FR-012); toggle de tema sin flash; navegación a `/perfume/<slug>`.

## Migración y rollback

1. Todo el desarrollo en branch `refactor/nuxt`; el `index.html` legacy y su workflow siguen operando en `main`.
2. Validación de paridad (checklist de spec.md) sobre el preview del build.
3. **Cutover**: merge a `main` + cambiar fuente de Pages a GitHub Actions. El workflow legacy se deshabilita en el mismo PR.
4. **Rollback**: revertir la fuente de Pages al branch anterior (el `index.html` sigue en el historial); re-habilitar el workflow legacy.
5. Post-estabilización: borrar `index.html`, `actualizar_catalogo.py` y `actualizar-catalogo.yml`.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| IDs de producto hoy son el índice del loop (inestables entre builds) → carritos guardados apuntan a otro producto | Migración de carrito matchea por nombre+marca, no por id; nuevo id estable de Supabase |
| Matching de fichas por nombre sigue siendo frágil | Se ejecuta en build con reporte de huérfanas; a futuro, FK real en Supabase (fuera de alcance) |
| Project page con baseURL rompe rutas absolutas | Task explícito de verificación de dominio antes de fijar `baseURL` |
| Supabase caído en build programado | El build falla sin publicar; el deploy anterior queda vivo |

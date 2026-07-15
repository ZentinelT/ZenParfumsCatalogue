# Zen Parfums — Catálogo (refactor Nuxt SSG)

Rama de refactor del catálogo desde el monolito `index.html` (1 MB) hacia
**Nuxt 4 + TypeScript** generado estáticamente. Ver
[`specs/001-refactor-catalogo/`](specs/001-refactor-catalogo/) para spec, plan y tasks.

> El sitio legacy (`index.html`, `actualizar_catalogo.py`) sigue operando en `main`.
> Esta rama se cutover-ea cuando se valide la paridad (T039–T040).

## Arquitectura

```
Supabase (productos + fichas)
   │  build (cron 3 h / dispatch / push a main)
   ▼
scripts/fetch-catalog.ts ──► data/catalog.json + data/fichas.json   (artefactos, gitignored)
   ▼
nuxi generate ──► .output/public   (/, /perfume/[slug], sitemap.xml)
   ▼
actions/deploy-pages ──► GitHub Pages   (sin commits al repo)

Runtime (navegador):
useStockRevalidation() ──► GET vista pública Supabase ──► pisa stock/precio en memoria
```

La lógica de transformación (precio, stock, género, notas, slugs) se portó de
`actualizar_catalogo.py` a `shared/transform/` como **una sola implementación
tipada y testeada** (antes estaba duplicada en Python y en el JS del HTML).

## Requisitos

- Node 22 (`.nvmrc`)
- pnpm 9 (`corepack enable`)

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm install` | Instala dependencias |
| `pnpm fetch-catalog` | Descarga Supabase → `data/*.json` (requiere `SUPABASE_KEY`) |
| `pnpm fetch-catalog:fixture` | Genera `data/*.json` desde `tests/fixtures/` (sin red) |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm generate:fixture` | fixture + `nuxi generate` (build reproducible sin Supabase) |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Calidad |
| `pnpm test:e2e` | Playwright (Fase 6) |

Arranque rápido sin credenciales:

```bash
corepack enable
pnpm install
pnpm generate:fixture
pnpm preview
```

## Estado

Hecho: **Fases 0–5**. El sitio se genera completo (1006 rutas) y funciona.

- ✅ Pipeline de datos portado de Python a TS (`shared/transform/*`), con test de
  paridad contra el `#pdata` real del sitio legacy
- ✅ UI completa con paridad visual verificada contra el legacy en navegador
- ✅ Carrito/favoritos persistidos en las claves legacy (`zp2`, `zp-wish`) con migración
- ✅ SEO: 500 páginas `/perfume/<slug>` con JSON-LD `Product` + `sitemap.xml`
- ✅ Revalidación de stock/precio en runtime (requiere la anon key, ver T003)

### Pendientes conocidos

| # | Pendiente | Task |
|---|---|---|
| 1 | **HTML inicial 143 KB** (objetivo <100 KB). El catálogo (369 KB) sigue en el bundle JS porque el filtrado en cliente lo necesita: separarlo a recurso aparte es la optimización que falta. Ya bajó de 1 MB. | T038 |
| 2 | **Focus trap** en modales y drawers. Escape, `aria-modal` y click en overlay ya funcionan. | T021, T027 |
| 3 | **Animaciones de reveal** al hacer scroll (`.rev`), respetando `prefers-reduced-motion`. El CSS está portado; falta el IntersectionObserver. | T023 |
| 4 | **robots.txt** | T035 |
| 5 | **Links de categoría del footer** no aplican el filtro (van a `#catalogo` sin filtrar). | — |
| 6 | **favicon** ausente (404 en consola). El legacy tampoco tenía. | — |
| 7 | **e2e con Playwright** y medición Lighthouse. | T037, T038 |
| 8 | **Test de paridad sobre inputs crudos** de `productos` (requiere un dump real de Supabase). | T017 |

### Bloqueantes externos (requieren consola, no código)

- **T002**: definir `NUXT_APP_BASE_URL` según dominio custom o project page.
- **T003**: crear la vista `catalogo_publico` + RLS y cargar `NUXT_PUBLIC_SUPABASE_ANON_KEY`.
  **Sin esto la revalidación queda desactivada** (el sitio usa los datos del build).
- **T040**: cambiar la fuente de GitHub Pages a "GitHub Actions" en el cutover.

### Nota de seguridad (CSP)

`script-src` incluye `'unsafe-inline'`: Nuxt emite scripts inline (hidratación, payload,
tema sin flash) y una CSP por `<meta>` no admite nonces — GitHub Pages no permite
cabeceras HTTP. La inyección de HTML crudo que motivaba la regla estricta ya no existe:
Vue escapa todo por templating (NFR-005).

## Variables de entorno

Ver [`.env.example`](.env.example). En CI: `SUPABASE_KEY` como secret; `MARGEN_*`,
`NUXT_APP_BASE_URL`, `NUXT_SITE_URL` como variables.

## Pendientes de infra (requieren acceso a consola)

- **T002**: definir `NUXT_APP_BASE_URL` según si hay dominio custom o project page.
- **T003**: crear vista pública `catalogo_publico` + RLS para la anon key de runtime.
- **T040**: cambiar la fuente de GitHub Pages a "GitHub Actions" en el cutover.

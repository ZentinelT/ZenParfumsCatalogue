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

## Estado del scaffold

Hecho: Fase 0–2 (fundaciones + pipeline de datos portado y verificado).

- ✅ `shared/types.ts`, `shared/transform/*` (precio, stock, género, notas, slug) + tests
- ✅ `scripts/fetch-catalog.ts` con join de fichas y modo `--fixture`
- ✅ Config Nuxt/ESLint/Vitest, tokens de diseño, workflows CI + deploy
- ⏳ Fase 3+ (componentes Vue, stores, revalidación runtime, SEO por producto): pendiente,
  ver [`tasks.md`](specs/001-refactor-catalogo/tasks.md) T018–T038.

## Variables de entorno

Ver [`.env.example`](.env.example). En CI: `SUPABASE_KEY` como secret; `MARGEN_*`,
`NUXT_APP_BASE_URL`, `NUXT_SITE_URL` como variables.

## Pendientes de infra (requieren acceso a consola)

- **T002**: definir `NUXT_APP_BASE_URL` según si hay dominio custom o project page.
- **T003**: crear vista pública `catalogo_publico` + RLS para la anon key de runtime.
- **T040**: cambiar la fuente de GitHub Pages a "GitHub Actions" en el cutover.

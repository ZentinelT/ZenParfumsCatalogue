# Tasks: Refactor del catálogo Zen Parfums a Nuxt SSG

**Input**: [spec.md](spec.md) + [plan.md](plan.md)
**Convención**: `[P]` = puede ejecutarse en paralelo con otras tasks `[P]` de su fase (archivos distintos, sin dependencia entre sí). Las tasks sin `[P]` dependen de las anteriores de su fase.

## Fase 0 — Preparación

- [ ] **T001** Crear branch `refactor/nuxt` desde `main`.
- [ ] **T002** [P] Verificar en la config de GitHub Pages si hay dominio custom; registrar en `plan.md` el valor definitivo de `app.baseURL` (`/` o `/ZenParfumsCatalogue/`).
- [ ] **T003** [P] En Supabase: crear vista `catalogo_publico` (id/nombre, `stock_actual`, `precio_min_ars`, `activo`) y política RLS de SELECT anónimo solo sobre esa vista; verificar que la anon key NO puede leer `productos` ni fichas directamente. Anotar la anon key para runtime.
- [ ] **T004** [P] Extraer un dump de los JSON embebidos actuales (`#pdata` y `#fdata` de `index.html`) a `tests/fixtures/legacy-pdata.json` y `tests/fixtures/legacy-fdata.json` — servirán como fixtures del test de paridad (T016).

## Fase 1 — Fundaciones

- [ ] **T005** Scaffold del proyecto: Nuxt 4 + TypeScript estricto + pnpm en la raíz del repo; `nuxt.config.ts` con `ssr: true`, prerender de todas las rutas, `app.baseURL` según T002; `.gitignore` para `data/`, `.output/`, `node_modules/`.
- [ ] **T006** [P] Configurar ESLint (`@nuxt/eslint`, flat config) y scripts `lint`, `typecheck`.
- [ ] **T007** [P] Configurar Vitest + `@vue/test-utils`; script `test`.
- [ ] **T008** [P] Instalar y configurar Pinia + `pinia-plugin-persistedstate` y `@nuxtjs/color-mode` (atributo `data-theme` en `<body>`, clave de storage `zp-theme`).
- [ ] **T009** [P] Portar los design tokens del `<style>` actual (index.html:15-37) a `app/assets/css/tokens.css` con variantes light/dark por `data-theme` — sin `!important`; cargar fuentes Cormorant Garamond + Inter.
- [ ] **T010** [P] Definir tipos en `shared/types.ts`: `Product`, `Ficha`, `StockStatus`, `Categoria`, `Genero`, `CartItem`.

## Fase 2 — Data pipeline (port Python → TS)

- [ ] **T011** [P] `shared/transform/precio.ts`: `calcularPrecio` con márgenes desde env (`MARGEN_NORMAL=15000`, `MARGEN_TUBBEES=10000`) + tests con casos de `actualizar_catalogo.py` (empresa TUBBEES, precio nulo → 0). *(FR-007)*
- [ ] **T012** [P] `shared/transform/stock.ts`: `calcularStock` (≤0→out, ≤2→low, resto ok) + tests. *(FR-006)*
- [ ] **T013** [P] `shared/transform/genero.ts`: mapeo ♀/♂/unisex + tests. *(FR-003)*
- [ ] **T014** [P] `shared/transform/notas.ts`: única implementación de `parseNotas` (unifica la versión Python `parsear_notas` y la JS `parseNotes`): etiquetas salida/corazón/fondo, placeholders ("nan", "sin datos", …) → null, texto libre < 400 chars → tal cual + tests con notas reales del fixture. *(FR-005, edge cases)*
- [ ] **T015** [P] `shared/transform/slug.ts`: `normName` (quita sufijos `| N ML`), `cleanName` (quita prefijo de código y sufijos `|`), `getConcentracion` (EDP/EDT/Elixir/Parfum/Extrait) y `slugify` para rutas + tests. *(FR-005, HU-3)*
- [ ] **T016** `scripts/fetch-catalog.ts`: descarga `productos` y fichas de Supabase (misma lógica de candidatos de tabla), filtra activos/ocultos, aplica transforms, joinea fichas por `normName` con **advertencia de huérfanas en stdout**, valida `imagenUrl` (solo https), emite `data/catalog.json` + `data/fichas.json` con ids estables de Supabase. Modo `--fixture` que lee los fixtures de T004 en lugar de la red. *(HU-2, FR-004)*
- [ ] **T017** Test de paridad: correr el pipeline en modo fixture y comparar precio/stock/género/notas contra `legacy-pdata.json`; documentar y justificar cualquier diferencia intencional (p.ej. ids estables).

## Fase 3 — UI

- [ ] **T018** [P] Componentes estáticos: `SiteHeader` (sticky + badges), `MobileMenu`, `TheHero`, `TrustSections`, `SiteFooter`, botón flotante de WhatsApp — paridad visual con las secciones actuales (index.html:456-700). *(NFR-003)*
- [ ] **T019** [P] `ProductCard.vue`: imagen con lazy + fallback a placeholder SVG, marca, nombre limpio, badges de concentración/tamaño, notas resumidas, indicador de stock, precio (o "SIN STOCK"), acciones (favorito / ficha / carrito). *(FR-005, FR-006)*
- [ ] **T020** `useCatalog.ts` + `CatalogGrid.vue` + `CatalogSearch.vue` + `CatalogFilters.vue` + `PaginationBar.vue`: filtros excluyentes, búsqueda marca+nombre+notas, exclusión de accesorios, paginación de 48 con elipsis y contador. *(FR-001…FR-004)*
- [ ] **T021** [P] `ProductModal.vue`: detalle con pirámide olfativa, acceso a ficha; focus trap, cierre con Escape y click en overlay, `aria-modal`. *(FR-008, NFR-004)*
- [ ] **T022** [P] `FichaTecnica.vue`: todos los campos de ficha omitiendo vacíos, inspiraciones con imagen, rango de edad compuesto. *(FR-009)*
- [ ] **T023** `pages/index.vue`: composición landing + catálogo; animaciones de reveal con IntersectionObserver respetando `prefers-reduced-motion`. *(NFR-004)*
- [ ] **T024** `pages/perfume/[slug].vue`: página estática por producto reutilizando el detalle + `useSeoMeta` (título, description, OG) + JSON-LD `Product` con precio y disponibilidad; prerender desde `data/catalog.json`. *(HU-3, FR-008)*

## Fase 4 — Estado e interacción

- [ ] **T025** [P] `stores/cart.ts`: agregar (rechaza `out`), incrementar/decrementar con eliminación en 0, total, contador; persistencia en clave `zp2` + **migración del formato legacy** (matcheo por marca+nombre por el cambio de ids); tolerante a localStorage corrupto. *(FR-010, HU-4, NFR-006)*
- [ ] **T026** [P] `stores/wishlist.ts`: toggle, persistencia `zp-wish` + migración legacy; pasar favorito a carrito. *(FR-011)*
- [ ] **T027** `CartDrawer.vue` + `WishlistDrawer.vue`: estados vacíos, cantidades, totales, accesibilidad de drawer (focus trap, Escape). *(FR-010, FR-011, NFR-004)*
- [ ] **T028** [P] `useWhatsAppCheckout.ts`: mensaje con formato exacto actual (`- {marca} {nombre} ({tamaño}) x{qty} = {subtotal}` + total) y apertura de `wa.me/543515911990`. *(FR-012)*
- [ ] **T029** [P] `NotificationToast.vue` + integración con acciones de carrito/favoritos. *(FR-014)*
- [ ] **T030** Toggle de tema en header y menú móvil vía color-mode, verificando ausencia de flash y migración de `zp-theme`. *(FR-013, HU-4.3)*

## Fase 5 — Híbrido runtime

- [ ] **T031** `useStockRevalidation.ts`: al montar el catálogo, GET a la vista `catalogo_publico` con anon key; recalcular stock/precio con los transforms de `shared/`; pisar estado en memoria; timeout corto y degradación silenciosa ante error; deshabilitar compra si el producto pasó a `out`. *(FR-016, HU-5)*
- [ ] **T032** Tests del composable: respuesta ok, Supabase caído, producto que pasa a out con ítem en carrito.

## Fase 6 — Infra y calidad

- [ ] **T033** [P] `.github/workflows/ci.yml`: lint + typecheck + vitest + `nuxi generate --fixture` en PRs y push a `main`.
- [ ] **T034** [P] `.github/workflows/deploy.yml`: cron `0 */3 * * *` + `workflow_dispatch` + push a `main` → fetch-catalog (secrets `SUPABASE_KEY`, env de márgenes) → generate → `actions/deploy-pages`; permisos `pages: write`, `id-token: write`, **sin** `contents: write`. *(FR-015, HU-2.4)*
- [ ] **T035** [P] Sitemap (`@nuxtjs/sitemap`) con todas las rutas de producto + `robots.txt`. *(HU-3.2)*
- [ ] **T036** [P] CSP por meta tag según plan.md; auditar que ninguna imagen/estilo/conexión quede bloqueada.
- [ ] **T037** Playwright e2e: filtrar → buscar → modal → agregar → drawer → mensaje de WhatsApp interceptado; tema oscuro persistente; `/perfume/<slug>` navegable. *(criterios HU-1)*
- [ ] **T038** Lighthouse sobre el build generado: HTML inicial < 100 KB, LCP < 2,5 s (3G rápido), accesibilidad ≥ 90. *(NFR-001, NFR-002)*

## Fase 7 — Cutover

- [ ] **T039** Checklist de paridad funcional/visual contra el sitio legacy (todos los criterios de aceptación de spec.md) sobre un preview del build.
- [ ] **T040** Merge `refactor/nuxt` → `main`; cambiar la fuente de GitHub Pages a "GitHub Actions"; deshabilitar/eliminar `actualizar-catalogo.yml`; verificar el primer deploy programado.
- [ ] **T041** Ventana de observación (≥1 semana): monitorear el cron, fichas huérfanas en logs, métricas de Lighthouse en producción. Rollback documentado: revertir fuente de Pages + re-habilitar workflow legacy.
- [ ] **T042** Limpieza final: eliminar `index.html` y `actualizar_catalogo.py` del repo; actualizar README con la nueva arquitectura y runbook del pipeline.

## Trazabilidad requisitos → tasks

| Requisito | Tasks |
|---|---|
| FR-001…004 (catálogo/filtros/búsqueda) | T020, T023 |
| FR-005 (tarjeta) | T014, T015, T019 |
| FR-006 (stock) | T012, T019, T031 |
| FR-007 (precio/márgenes) | T011, T016, T034 |
| FR-008/009 (detalle/ficha) | T021, T022, T024 |
| FR-010/011 (carrito/favoritos) | T025, T026, T027 |
| FR-012 (WhatsApp) | T028, T037 |
| FR-013 (tema) | T008, T030 |
| FR-014 (toasts) | T029 |
| FR-015 (pipeline) | T016, T034 |
| FR-016 (revalidación) | T003, T031, T032 |
| NFR-001/002 (peso/LCP) | T005, T038 |
| NFR-003 (paridad visual) | T009, T018, T039 |
| NFR-004 (a11y) | T021, T027, T023, T038 |
| NFR-005 (seguridad) | T003, T016, T036 |
| NFR-006 (migración localStorage) | T025, T026, T030 |
| NFR-007 (repo sin artefactos) | T005, T034 |

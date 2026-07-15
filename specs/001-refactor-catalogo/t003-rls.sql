-- T003 — Vista pública + RLS para la revalidación de stock/precio (FR-016, NFR-005)
--
-- POR QUÉ: la anon key se embebe en el navegador. Hoy `anon` puede leer
-- `productos` entera (57 columnas: costos, márgenes, ganancias, ventas por
-- persona, inventario interno y los productos con activo=false). Publicar la
-- key sin esto expone todo eso. Este script deja legible SOLO lo que el
-- catálogo necesita para refrescar stock y precio.
--
-- Verificado el 2026-07-15 con la anon key:
--   catalogo_publico -> 404 (no existe)
--   productos        -> 200 (anon lee las 57 columnas)  <-- a cerrar
--   fichas_perfume   -> 200 (anon lee todo)             <-- a cerrar
--
-- ⚠️ ANTES DE CORRER ESTO: confirmá que el secret SUPABASE_KEY del workflow es
-- la **service_role** key y no la anon. El build (scripts/fetch-catalog.ts) lee
-- `productos` con esa key; service_role saltea RLS, pero si fuera la anon, al
-- cerrar el acceso el pipeline deja de generar el catálogo.
-- Comprobación rápida (el payload del JWT debe decir "role":"service_role"):
--   echo "<SUPABASE_KEY>" | cut -d. -f2 | base64 -d
--
-- Ejecutar en: Supabase > SQL Editor.

begin;

-- 1) Vista pública: solo los campos que usa useStockRevalidation, y solo de
--    productos publicables (los ocultos/inactivos ni aparecen).
create or replace view public.catalogo_publico as
select
  p.id,
  p.stock_actual,
  p.precio_min_ars,
  p.activo
from public.productos p
where p.activo = true
  and (p.oculto is null or p.oculto = false);

-- La vista corre con los permisos de su dueño, así puede leer `productos`
-- aunque `productos` quede cerrada para anon.
alter view public.catalogo_publico set (security_invoker = off);

-- 2) Cerrar el acceso directo de anon a las tablas base.
alter table public.productos enable row level security;
alter table public.fichas_perfume enable row level security;

revoke all on public.productos from anon;
revoke all on public.fichas_perfume from anon;

-- 3) Abrir únicamente la vista, y solo para lectura.
grant select on public.catalogo_publico to anon;

commit;

-- ---------------------------------------------------------------------------
-- VERIFICACIÓN (correr desde la terminal con la ANON key; K=<anon key>)
--
--   U=https://syylbuvjuekkanxynpps.supabase.co/rest/v1
--   # debe dar 200 y solo 4 campos:
--   curl -s "$U/catalogo_publico?select=*&limit=1" -H "apikey: $K" -H "Authorization: Bearer $K"
--   # deben dar 401/403 (ya no legibles):
--   curl -s -o /dev/null -w "%{http_code}\n" "$U/productos?select=*&limit=1"      -H "apikey: $K" -H "Authorization: Bearer $K"
--   curl -s -o /dev/null -w "%{http_code}\n" "$U/fichas_perfume?select=*&limit=1" -H "apikey: $K" -H "Authorization: Bearer $K"
--
-- Recién cuando esto dé 200 / 403 / 403, descomentar NUXT_PUBLIC_SUPABASE_ANON_KEY
-- en .env y cargarla como variable del repo para el deploy.
-- ---------------------------------------------------------------------------

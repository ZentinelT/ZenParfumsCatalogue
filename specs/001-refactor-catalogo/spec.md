# Feature Specification: Refactor del catálogo Zen Parfums a Nuxt SSG

**Feature Branch**: `refactor/nuxt`
**Created**: 2026-07-14
**Status**: Draft
**Input**: Refactor completo del catálogo monolítico (`index.html` de 1 MB) hacia una arquitectura moderna con SEO por producto, pipeline de datos automatizado y actualización híbrida de stock/precio.

---

## Historias de usuario

### HU-1 — Cliente explora y pide por WhatsApp (principal)

> Como **cliente de Zen Parfums**, quiero explorar un catálogo rápido de +500 perfumes con búsqueda, filtros, fichas técnicas, favoritos y carrito, y enviar mi pedido por WhatsApp, para comprar sin fricción desde el móvil.

**Criterios de aceptación:**

1. **Given** que abro el sitio en un móvil con conexión 3G, **When** carga la página principal, **Then** veo el catálogo interactivo en menos de 2,5 s (LCP) y el HTML inicial pesa menos de 100 KB.
2. **Given** que estoy en el catálogo, **When** escribo en el buscador, **Then** los resultados se filtran por marca, nombre y notas olfativas sin recargar la página.
3. **Given** que aplico un filtro (Hombre / Mujer / Unisex / Árabes / Internacional), **When** lo selecciono, **Then** la grilla muestra solo productos que cumplen el filtro, la paginación se reinicia a la página 1 y el buscador se limpia.
4. **Given** un producto con ficha técnica disponible, **When** abro su ficha, **Then** veo pirámide olfativa (salida/corazón/fondo), descripción, inspiraciones con imagen y datos técnicos (familia olfativa, momento del día, estación, ocasión, clima, proyección, duración, estela, color del líquido, rango de edad).
5. **Given** productos en mi carrito, **When** toco "Pedir por WhatsApp", **Then** se abre WhatsApp (número del negocio) con un mensaje pre-armado que lista cada ítem (marca, nombre, tamaño, cantidad, subtotal) y el total.
6. **Given** un producto sin stock, **When** lo veo en la grilla o en el modal, **Then** muestra "SIN STOCK", el botón de agregar está deshabilitado y no puede entrar al carrito.

### HU-2 — Dueño del negocio actualiza sin tocar código

> Como **dueño del negocio**, quiero que el catálogo se actualice solo desde Supabase (productos, precios, stock, fichas), para no depender de nadie que edite código.

**Criterios de aceptación:**

1. **Given** que cambio precio, stock o visibilidad de un producto en Supabase, **When** corre el pipeline programado (cada 3 h) o lo disparo manualmente, **Then** el sitio publicado refleja los cambios sin ningún commit manual.
2. **Given** que un producto tiene `activo = false` u `oculto = true`, **When** se regenera el sitio, **Then** ese producto no aparece.
3. **Given** una ficha técnica cuyo nombre no matchea ningún producto, **When** corre el pipeline, **Then** el log del build lista las fichas huérfanas como advertencia (no falla el build).
4. **Given** que el pipeline corre, **When** termina, **Then** el repositorio git no recibe ningún commit con datos generados (el historial deja de crecer).

### HU-3 — Cada perfume es indexable (SEO)

> Como **cliente que busca en Google** "perfume X original Argentina", quiero llegar directo a la página de ese perfume, para ver precio y stock sin navegar todo el catálogo.

**Criterios de aceptación:**

1. **Given** un producto activo, **When** el sitio se genera, **Then** existe una URL estática propia `/perfume/<slug>` con título, meta description, Open Graph y JSON-LD `Product` (nombre, marca, precio, disponibilidad).
2. **Given** el sitio generado, **When** un crawler pide `/sitemap.xml`, **Then** recibe todas las URLs de productos activos.
3. **Given** una URL de un producto que dejó de estar activo, **When** se regenera el sitio, **Then** esa URL deja de existir (404 de Pages).

### HU-4 — Cliente recurrente conserva su estado

> Como **cliente recurrente**, quiero que mi carrito, mis favoritos y mi preferencia de tema persistan entre visitas, para retomar donde dejé.

**Criterios de aceptación:**

1. **Given** que agregué productos al carrito y favoritos, **When** cierro y vuelvo a abrir el navegador, **Then** carrito y favoritos siguen ahí.
2. **Given** que ya usaba el sitio actual (claves `zp2`, `zp-wish`, `zp-theme` en localStorage), **When** entro por primera vez al sitio refactorizado, **Then** mi carrito, favoritos y tema se migran sin pérdida.
3. **Given** que elegí modo oscuro, **When** vuelvo al sitio, **Then** carga directamente en oscuro sin flash de tema claro.

### HU-5 — Stock y precio frescos (modo híbrido)

> Como **cliente**, quiero ver stock y precio actuales aunque el sitio se haya generado horas atrás, para no pedir algo agotado o con precio viejo.

**Criterios de aceptación:**

1. **Given** que el sitio fue generado hace ≤3 h y el stock cambió en Supabase, **When** abro el catálogo, **Then** el indicador de stock y el precio se actualizan en pantalla tras la carga inicial.
2. **Given** que Supabase no responde, **When** abro el catálogo, **Then** el sitio funciona con los datos del build sin error visible para el usuario.
3. **Given** que la revalidación marca un producto como sin stock, **When** intento agregarlo, **Then** el botón queda deshabilitado aunque el build lo tuviera en stock.

---

## Requisitos funcionales

- **FR-001**: El catálogo DEBE mostrar los productos en una grilla paginada de 48 productos por página, con paginación numerada (primera, última, adyacentes y elipsis) y contador "N productos · mostrando X–Y".
- **FR-002**: El sistema DEBE permitir búsqueda de texto libre sobre marca + nombre + notas, insensible a mayúsculas, reiniciando a página 1 en cada cambio.
- **FR-003**: El sistema DEBE ofrecer filtros mutuamente excluyentes: Todos, Hombre, Mujer, Unisex, Árabes, Internacional. Género y categoría provienen de los datos de Supabase.
- **FR-004**: El sistema DEBE excluir del catálogo los productos de categoría `accesorios` y los inactivos/ocultos.
- **FR-005**: Cada tarjeta de producto DEBE mostrar: imagen (o placeholder SVG de frasco si no hay), marca, nombre limpio (sin prefijo de código ni sufijo `| ml`), badge de concentración (EDP/EDT/Elixir/Parfum/Extrait de Parfum) si se detecta, badge de tamaño, notas olfativas resumidas, indicador de stock y precio.
- **FR-006**: El indicador de stock DEBE tener tres estados derivados de `stock_actual`: `ok` (>2, "En stock"), `low` (1–2, "Últimas unidades"), `out` (≤0, "Sin stock").
- **FR-007**: El precio publicado DEBE ser `precio_min_ars` + margen: $10.000 si la empresa es TUBBEES, $15.000 en el resto. Los márgenes DEBEN ser configurables sin tocar código de la app (variables de entorno del pipeline).
- **FR-008**: El sistema DEBE mostrar un detalle de producto (modal en catálogo y página `/perfume/<slug>`) con imagen ampliada, pirámide olfativa parseada (salida/corazón/fondo) cuando sea detectable, y acceso a la ficha técnica si existe.
- **FR-009**: La ficha técnica DEBE renderizar todos los campos disponibles de la tabla de fichas de Supabase (descripción, pirámide, inspiraciones con imagen, familia olfativa, momento del día, estación, ocasión, clima, proyección, duración, estela, color del líquido, perfil de estilo, rango de edad) omitiendo los vacíos.
- **FR-010**: El carrito DEBE permitir agregar, incrementar, decrementar (eliminando al llegar a 0) y DEBE mostrar total estimado; badge con cantidad total visible en header (desktop y móvil).
- **FR-011**: Los favoritos DEBEN poder agregarse/quitarse desde tarjeta, modal y drawer de favoritos, con badge de cantidad, y permitir pasar un favorito al carrito.
- **FR-012**: El checkout DEBE generar un mensaje de WhatsApp con formato: línea por ítem `- {marca} {nombre} ({tamaño}) x{cantidad} = {subtotal}` y total, abriendo `wa.me/<número>` en pestaña nueva.
- **FR-013**: El sitio DEBE soportar modo claro/oscuro con toggle en header y menú móvil, respetando `prefers-color-scheme` como valor inicial y persistiendo la elección.
- **FR-014**: Toda acción de carrito/favoritos DEBE dar feedback visual inmediato (toast con nombre del producto).
- **FR-015**: El pipeline DEBE regenerar y publicar el sitio: cada 3 horas por cron, manualmente por dispatch, y en cada push a `main`.
- **FR-016**: El sitio DEBE revalidar stock y precio en runtime contra Supabase (solo lectura, campos públicos), degradando silenciosamente a los datos del build ante error.

## Requisitos no funcionales

- **NFR-001**: HTML inicial < 100 KB (hoy: 1 MB); datos del catálogo cargados como recurso separado cacheable.
- **NFR-002**: LCP < 2,5 s en 3G rápido; imágenes con `loading="lazy"`.
- **NFR-003**: Paridad visual con el diseño actual: mismos tokens de color/tipografía (Cormorant Garamond + Inter, paleta dorado/crema/oscuro), hero, secciones de confianza, footer.
- **NFR-004**: Accesibilidad: roles/aria en modales y drawers, focus trap y cierre con Escape (hoy inexistentes), contraste AA, `prefers-reduced-motion` respetado.
- **NFR-005**: Seguridad: ningún dato de Supabase se interpola sin escapar (hoy las URLs de imagen se inyectan crudas en `src`); la clave con permisos de escritura nunca llega al navegador; acceso público limitado por RLS a campos de lectura.
- **NFR-006**: Sin regresión para usuarios existentes: migración transparente de localStorage (`zp2`, `zp-wish`, `zp-theme`).
- **NFR-007**: El repositorio no almacena artefactos generados; el historial de git deja de crecer con los datos.

## Edge cases

| Caso | Comportamiento esperado |
|---|---|
| Producto sin imagen | Placeholder SVG de frasco Zen (existente en el diseño actual) |
| Producto sin notas o notas placeholder ("nan", "sin datos", …) | Se muestra "—" / se omite el bloque de notas |
| Notas sin estructura salida/corazón/fondo | Se muestra el texto limpio tal cual (si < 400 caracteres) |
| Producto sin ficha técnica | Botón/enlace de ficha oculto |
| Precio calculado = 0 | Se muestra el precio formateado del pipeline (`p1`) en lugar de $0 |
| Producto sin stock | "SIN STOCK", botones de compra deshabilitados en tarjeta, modal y favoritos |
| Ficha huérfana (no matchea producto) | Advertencia en log de build, no rompe |
| Supabase caído en build | El build falla y NO se publica (se conserva el deploy anterior) |
| Supabase caído en runtime | Se muestran datos del build, sin error visible |
| localStorage corrupto o inaccesible | El sitio funciona con carrito/favoritos vacíos |

## Fuera de alcance

- Pasarela de pago online (el checkout sigue siendo WhatsApp).
- Panel de administración (la gestión sigue en Supabase).
- Cuentas de usuario / login.
- Cambios de diseño visual (es un refactor con paridad, no un rediseño).

## Revisión y aceptación

- [ ] Todos los criterios de aceptación de HU-1…HU-5 verificados en el sitio generado.
- [ ] Requisitos FR-001…FR-016 trazables a tasks en `tasks.md`.
- [ ] NFR-001/002 medidos con Lighthouse sobre el deploy de Pages.
- [ ] Validación de paridad funcional contra el `index.html` legacy antes del cutover.

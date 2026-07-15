import { aplicarRevalidacion, type FilaPublica } from "~~/shared/transform/revalidacion.ts";

const TIMEOUT_MS = 5000;

/**
 * Modo híbrido (FR-016, HU-5): el sitio se genera cada 3 h, pero al abrir el
 * catálogo se piden stock y precio frescos a la vista pública de Supabase y se
 * pisan en memoria. Ante cualquier error, degradación silenciosa: quedan los
 * datos del build y el usuario no ve ningún mensaje de error.
 */
export function useStockRevalidation() {
  const { productos } = useCatalogData();
  const config = useRuntimeConfig().public;

  const revalidando = useState("reval-loading", () => false);
  const revalidado = useState("reval-done", () => false);

  /** La revalidación requiere la anon key + la vista pública (T003). */
  const habilitada = computed(() => Boolean(config.supabaseAnonKey && config.supabaseUrl));

  async function revalidar(): Promise<void> {
    if (!habilitada.value || revalidando.value || revalidado.value) return;
    if (import.meta.server) return; // solo en el navegador

    revalidando.value = true;
    try {
      const url = `${config.supabaseUrl}/rest/v1/${config.catalogoPublicoTable}`;
      const filas = await $fetch<FilaPublica[]>(url, {
        query: { select: "id,stock_actual,precio_min_ars,activo" },
        headers: {
          apikey: config.supabaseAnonKey,
          Authorization: `Bearer ${config.supabaseAnonKey}`,
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      const { actualizados, agotados } = aplicarRevalidacion(productos, filas, {
        normal: Number(config.margenNormal),
        tubbees: Number(config.margenTubbees),
      });

      // Un ítem del carrito que se agotó no puede seguir comprándose.
      if (agotados.length) {
        const cart = useCartStore();
        for (const id of agotados) cart.marcarAgotado(id);
      }

      revalidado.value = true;
      if (import.meta.dev && actualizados) {
        console.info(`[revalidación] ${actualizados} producto(s) actualizados, ${agotados.length} agotados`);
      }
    } catch {
      // Silencioso a propósito: el sitio sigue con los datos del build.
    } finally {
      revalidando.value = false;
    }
  }

  return { revalidar, revalidando, revalidado, habilitada };
}

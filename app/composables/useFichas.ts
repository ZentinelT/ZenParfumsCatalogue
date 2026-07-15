import { joinURL } from "ufo";
import type { Ficha } from "~~/shared/types.ts";

/**
 * Fichas técnicas como recurso separado y cacheable (NFR-001): no van en el
 * bundle JS.
 *
 * - En build/SSR se leen del disco. Un $fetch HTTP a un asset público no
 *   resuelve durante el prerender (deja la ficha fuera del HTML y rompe la
 *   hidratación), y además un fallo acá debe ser ruidoso.
 * - En el navegador se bajan on-demand la primera vez que se abre una ficha,
 *   con degradación silenciosa ante error.
 *
 * El cache de servidor es a nivel módulo: los datos son inmutables (artefacto
 * de build) y evita releer 832 KB en cada una de las ~500 páginas.
 */
const serverCache: { data: Ficha[] | null } = { data: null };

export function useFichas() {
  // Solo se usa en cliente: en SSR no se toca para no serializar 832 KB en
  // el payload de cada página.
  const fichas = useState<Ficha[] | null>("fichas", () => null);

  function url() {
    return joinURL(useRuntimeConfig().app.baseURL, "/data/fichas.json");
  }

  async function cargar(): Promise<Ficha[]> {
    if (import.meta.server) {
      if (serverCache.data) return serverCache.data;
      try {
        const { readFile } = await import("node:fs/promises");
        const { resolve } = await import("node:path");
        const ruta = resolve(process.cwd(), "public/data/fichas.json");
        serverCache.data = JSON.parse(await readFile(ruta, "utf8")) as Ficha[];
      } catch (e) {
        console.error("[fichas] no se pudo leer public/data/fichas.json en build:", e);
        serverCache.data = [];
      }
      return serverCache.data;
    }

    if (fichas.value) return fichas.value;
    try {
      fichas.value = await $fetch<Ficha[]>(url(), { signal: AbortSignal.timeout(8000) });
    } catch {
      // Degradación silenciosa: sin fichas, el resto del sitio funciona.
      fichas.value = [];
    }
    return fichas.value ?? [];
  }

  async function getFicha(slug: string | undefined | null): Promise<Ficha | undefined> {
    if (!slug) return undefined;
    const all = await cargar();
    return all.find((f) => f.slug === slug);
  }

  const cargando = computed(() => !import.meta.server && fichas.value === null);

  return { fichas, cargando, cargar, getFicha, fichasUrl: url };
}

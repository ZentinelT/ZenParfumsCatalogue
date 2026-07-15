import { joinURL } from "ufo";
import type { Ficha } from "~~/shared/types.ts";

/**
 * Fichas técnicas como recurso separado y cacheable (NFR-001): se bajan
 * on-demand la primera vez que se abre una ficha, no van en el bundle JS.
 */
export function useFichas() {
  const fichas = useState<Ficha[] | null>("fichas", () => null);
  const cargando = useState<boolean>("fichas-loading", () => false);

  function url() {
    return joinURL(useRuntimeConfig().app.baseURL, "/data/fichas.json");
  }

  async function cargar(): Promise<Ficha[]> {
    if (fichas.value) return fichas.value;
    if (cargando.value) {
      // Otra llamada ya está en vuelo: esperar a que resuelva.
      await new Promise<void>((r) => {
        const stop = watch(cargando, (v) => { if (!v) { stop(); r(); } });
      });
      return fichas.value ?? [];
    }
    cargando.value = true;
    try {
      fichas.value = await $fetch<Ficha[]>(url());
    } catch {
      // Degradación silenciosa: sin fichas, el resto del sitio funciona.
      fichas.value = [];
    } finally {
      cargando.value = false;
    }
    return fichas.value ?? [];
  }

  async function getFicha(slug: string | undefined | null): Promise<Ficha | undefined> {
    if (!slug) return undefined;
    const all = await cargar();
    return all.find((f) => f.slug === slug);
  }

  return { fichas, cargando, cargar, getFicha, fichasUrl: url };
}

import type { Product } from "~~/shared/types.ts";

export type Filtro = "todos" | "hombre" | "mujer" | "unisex" | "arabes" | "internacional";
const PAGE_SIZE = 48;

/** Estado de UI del catálogo: filtros excluyentes, búsqueda y paginación (FR-001…004). */
export function useCatalog(productos: Product[]) {
  const filtro = ref<Filtro>("todos");
  const busqueda = ref("");
  const pagina = ref(1);

  // FR-004: los accesorios nunca entran al catálogo.
  const base = productos.filter((p) => p.categoria !== "accesorios");

  const filtrados = computed(() => {
    let l = base;
    switch (filtro.value) {
      case "hombre": case "mujer": case "unisex":
        l = l.filter((p) => p.genero === filtro.value); break;
      case "arabes":
        l = l.filter((p) => p.categoria === "arabes"); break;
      case "internacional":
        l = l.filter((p) => p.categoria === "internacional"); break;
    }
    const q = busqueda.value.toLowerCase().trim();
    if (q) {
      l = l.filter((p) =>
        `${p.marca} ${p.nombreCompleto} ${p.notas.texto ?? ""}`.toLowerCase().includes(q));
    }
    return l;
  });

  const total = computed(() => filtrados.value.length);
  const paginas = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)));

  watch([filtrados, paginas], () => {
    if (pagina.value > paginas.value) pagina.value = 1;
  });

  const visibles = computed(() =>
    filtrados.value.slice((pagina.value - 1) * PAGE_SIZE, pagina.value * PAGE_SIZE));

  const contador = computed(() => {
    if (total.value === 0) return "Sin resultados.";
    const start = (pagina.value - 1) * PAGE_SIZE + 1;
    const end = Math.min(pagina.value * PAGE_SIZE, total.value);
    return `${total.value} producto${total.value !== 1 ? "s" : ""} · mostrando ${start}–${end}`;
  });

  function setFiltro(f: Filtro) {
    filtro.value = f;
    busqueda.value = "";
    pagina.value = 1;
  }
  function setBusqueda(v: string) {
    busqueda.value = v;
    pagina.value = 1;
  }
  function setPagina(p: number) {
    pagina.value = Math.min(Math.max(1, p), paginas.value);
  }

  return {
    filtro, busqueda, pagina, PAGE_SIZE,
    visibles, total, paginas, contador,
    setFiltro, setBusqueda, setPagina,
  };
}
